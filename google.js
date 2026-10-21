// OAuth com Google e cópia privada no Drive. Nunca inclua .google-private.json no ZIP.
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')

module.exports = function configurarGoogle({ app, verificarToken, exigirMaster, limiteLogin, arquivos, lerJson, salvarJson, obterUsuario, masterId, segredo }) {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI
    const front = process.env.FRONTEND_URL || 'http://localhost:5500'
    const habilitado = Boolean(clientId && clientSecret && redirectUri)
    const privado = path.join(__dirname, '.google-private.json')
    const estados = new Map()
    let timer, emAndamento = Promise.resolve(), jwks = { keys: [], carregado: 0 }
    const lerPrivado = () => { try { return JSON.parse(fs.readFileSync(privado, 'utf8')) } catch { return {} } }
    const salvarPrivado = (dados) => {
        const tmp = `${privado}.tmp`
        fs.writeFileSync(tmp, JSON.stringify(dados), { encoding: 'utf8', mode: 0o600 })
        fs.chmodSync(tmp, 0o600)
        fs.renameSync(tmp, privado)
    }
    const destino = (pagina, params = '') => `${front.replace(/\/$/, '')}/${pagina}${params}`
    function autorizar(modo, contaId) {
        const state = crypto.randomBytes(32).toString('base64url')
        const nonce = crypto.randomBytes(32).toString('base64url')
        const verifier = crypto.randomBytes(32).toString('base64url')
        estados.set(state, { modo, contaId, nonce, verifier, expiracao: Date.now() + 10 * 60000 })
        const q = new URLSearchParams({
            client_id: clientId, redirect_uri: redirectUri, response_type: 'code', state, nonce,
            code_challenge: crypto.createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256',
            scope: modo === 'conectar' ? 'openid email profile https://www.googleapis.com/auth/drive.appdata' : 'openid email profile',
            access_type: 'offline', prompt: modo === 'conectar' ? 'consent' : 'select_account'
        })
        return `https://accounts.google.com/o/oauth2/v2/auth?${q}`
    }
    async function respostaGoogle(url, options) {
        const resposta = await fetch(url, { ...options, signal: AbortSignal.timeout(12000) })
        const dados = await resposta.json()
        if (!resposta.ok) throw new Error(dados.error_description || dados.error?.message || dados.error || 'Google indisponível')
        return dados
    }
    async function verificarIdToken(idToken, nonce) {
        if (Date.now() - jwks.carregado > 3600000) {
            const dados = await respostaGoogle('https://www.googleapis.com/oauth2/v3/certs')
            jwks = { keys: dados.keys, carregado: Date.now() }
        }
        const cabecalho = jwt.decode(idToken, { complete: true })?.header
        if (cabecalho?.alg !== 'RS256') throw new Error('Assinatura Google inválida')
        const chave = jwks.keys.find((item) => item.kid === cabecalho.kid)
        if (!chave) throw new Error('Chave Google desconhecida')
        const dados = jwt.verify(idToken, crypto.createPublicKey({ key: chave, format: 'jwk' }), {
            algorithms: ['RS256'], audience: clientId, issuer: ['accounts.google.com', 'https://accounts.google.com']
        })
        if (dados.nonce !== nonce || !dados.sub || dados.email_verified !== true) throw new Error('Identidade Google não verificada')
        return dados
    }
    async function tokenDrive() {
        const refresh = lerPrivado().refreshToken
        if (!refresh) throw new Error('Conecte a conta Google do master para ativar o backup')
        const dados = await respostaGoogle('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refresh, grant_type: 'refresh_token' })
        })
        return dados.access_token
    }
    async function enviarBackup() {
        if (!habilitado || !lerPrivado().refreshToken) throw new Error('Google Drive não conectado')
        const token = await tokenDrive()
        const cabecalho = { Authorization: `Bearer ${token}` }
        const lista = await respostaGoogle('https://www.googleapis.com/drive/v3/files?' + new URLSearchParams({ spaces: 'appDataFolder', q: "name='syncrypta-backup.json' and trashed=false", fields: 'files(id,name)', pageSize: '10' }), { headers: cabecalho })
        const backup = {
            formato: 'syncrypta-backup-v1', criadoEm: new Date().toISOString(),
            dados: Object.fromEntries(['clientes', 'movimentacoes', 'saldos', 'regras'].map((nome) => [nome, lerJson(arquivos[nome]).filter((item) => String(item.usuarioId) === String(masterId))]))
        }
        const conteudo = JSON.stringify(backup)
        if (lista.files?.length) {
            await respostaGoogle(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(lista.files[0].id)}?uploadType=media`, {
                method: 'PATCH', headers: { ...cabecalho, 'Content-Type': 'application/json' }, body: conteudo
            })
        } else {
            const limite = 'syncrypta' + crypto.randomBytes(12).toString('hex')
            const multipart = `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: 'syncrypta-backup.json', parents: ['appDataFolder'], mimeType: 'application/json' })}\r\n--${limite}\r\nContent-Type: application/json\r\n\r\n${conteudo}\r\n--${limite}--`
            await respostaGoogle('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
                method: 'POST', headers: { ...cabecalho, 'Content-Type': `multipart/related; boundary=${limite}` }, body: multipart
            })
        }
        const dados = lerPrivado()
        dados.ultimaSincronizacao = new Date().toISOString()
        delete dados.erro
        salvarPrivado(dados)
        return dados.ultimaSincronizacao
    }
    function sincronizar() {
        emAndamento = emAndamento.catch(() => { }).then(async () => {
            try { return await enviarBackup() } catch (erro) {
                const dados = lerPrivado(); dados.erro = String(erro.message).slice(0, 200); salvarPrivado(dados); throw erro
            }
        })
        return emAndamento
    }
    function agendar(usuarioId, acao) {
        if (String(usuarioId) !== String(masterId) || /^(LOGIN|CRIOU_CONTA)/.test(acao) || !lerPrivado().refreshToken) return
        clearTimeout(timer)
        timer = setTimeout(() => sincronizar().catch((erro) => console.error('Backup Google:', erro.message)), 3000)
        timer.unref?.()
    }
    app.get('/api/google/config', (req, res) => res.json({ habilitado }))
    app.get('/api/google/iniciar', limiteLogin, (req, res) => {
        if (!habilitado) return res.status(503).json({ mensagem: 'Configure as credenciais Google no backend.' })
        const modo = req.query.modo === 'cadastro' ? 'cadastro' : 'login'
        res.redirect(autorizar(modo))
    })
    app.post('/api/google/conectar', verificarToken, exigirMaster, (req, res) => {
        if (!habilitado) return res.status(503).json({ mensagem: 'Configure as credenciais Google no backend.' })
        res.json({ url: autorizar('conectar', req.contaId) })
    })
    app.post('/api/google/vincular', verificarToken, (req, res) => {
        const usuario = obterUsuario(req.contaId)
        if (!habilitado || !['portal_cliente', 'usuario'].includes(usuario?.perfil)) return res.status(403).json({ mensagem: 'Vinculação indisponível para esta conta.' })
        res.json({ url: autorizar('vincular', req.contaId) })
    })
    app.get('/api/google/minha-vinculacao', verificarToken, (req, res) => {
        const conta = obterUsuario(req.contaId)
        res.json({ vinculado: Boolean(conta?.googleSub) || (String(conta?.id) === String(masterId) && Boolean(lerPrivado().sub)) })
    })
    app.get('/api/google/callback', limiteLogin, async (req, res) => {
        const state = String(req.query.state || '')
        const pendente = estados.get(state)
        estados.delete(state)
        if (!habilitado || !pendente || pendente.expiracao < Date.now()) return res.redirect(destino('login.html', '#google_error=O%20acesso%20Google%20expirou'))
        try {
            if (!req.query.code || req.query.error) throw new Error('Autorização não concluída')
            const tokens = await respostaGoogle('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code: String(req.query.code), client_id: clientId, client_secret: clientSecret,
                    redirect_uri: redirectUri, code_verifier: pendente.verifier, grant_type: 'authorization_code'
                })
            })
            const identidade = await verificarIdToken(tokens.id_token, pendente.nonce)
            if (pendente.modo === 'vincular') {
                const usuarios = lerJson(arquivos.usuarios)
                const conta = usuarios.find((item) => String(item.id) === String(pendente.contaId) && ['portal_cliente', 'usuario'].includes(item.perfil))
                if (!conta || conta.email.toLowerCase() !== identidade.email.toLowerCase() || (conta.googleSub && conta.googleSub !== identidade.sub)) throw new Error('E-mail Google diferente da conta autenticada')
                if (usuarios.some((item) => item !== conta && item.googleSub === identidade.sub)) throw new Error('Esta conta Google já está vinculada')
                conta.googleSub = identidade.sub
                salvarJson(arquivos.usuarios, usuarios)
                return res.redirect(destino('dashboard.html', '?google=vinculado'))
            }
            if (pendente.modo === 'conectar') {
                const master = obterUsuario(pendente.contaId)
                if (String(master?.id) !== String(masterId) || master?.perfil !== 'cliente_tcc' || master.email.toLowerCase() !== identidade.email.toLowerCase()) throw new Error('A conta Google deve ser a mesma conta master')
                if (!tokens.refresh_token) throw new Error('Google não forneceu acesso offline. Revogue o acesso do app e conecte novamente.')
                salvarPrivado({ sub: identidade.sub, email: identidade.email, refreshToken: tokens.refresh_token })
                sincronizar().catch((erro) => console.error('Backup Google:', erro.message))
                return res.redirect(destino('dashboard.html', '?google=conectado'))
            }
            const privadoAtual = lerPrivado()
            const usuarios = lerJson(arquivos.usuarios)
            const email = String(identidade.email || '').toLowerCase()
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('O Google não retornou um e-mail válido')
            const contaPorSub = usuarios.find((item) => item.googleSub === identidade.sub)
            const contaPorEmail = usuarios.find((item) => String(item.email).toLowerCase() === email)
            let conta = contaPorSub || contaPorEmail
            if (!conta) {
                if (identidade.sub === privadoAtual.sub) throw new Error('Esta conta Google já está vinculada à conta master.')
                let novoId = Date.now() + Math.floor(Math.random() * 1000)
                while (usuarios.some((item) => String(item.id) === String(novoId))) novoId += 1
                conta = {
                    id: novoId, nome: String(identidade.name || email.split('@')[0]).slice(0, 120), email,
                    senha: null, googleSub: identidade.sub, perfil: 'usuario', plano: 'basico', acessoTotal: false,
                    pagamentoStatus: 'gratuito', criadoEm: new Date().toISOString()
                }
                usuarios.push(conta)
                salvarJson(arquivos.usuarios, usuarios)
            }
            if (conta.perfil === 'demonstracao') throw new Error('Esta conta demonstrativa não usa o login Google')
            if (conta.perfil === 'cliente_tcc') {
                if (String(conta.id) !== String(masterId) || email !== conta.email.toLowerCase() || identidade.sub !== privadoAtual.sub) throw new Error('Entre primeiro com a senha master e vincule este Google')
            } else if (conta.perfil === 'portal_cliente') {
                if (conta.googleSub !== identidade.sub) throw new Error('Entre primeiro com a senha do cliente e vincule este Google')
            } else if (conta.perfil === 'usuario') {
                if (conta.googleSub !== identidade.sub) throw new Error('Esta conta já usa este e-mail. Entre com senha e vincule o Google no painel')
            } else throw new Error('Este acesso Google não está disponível para a conta')
            if (conta.ativo === false) throw new Error('Esta conta foi suspensa pelo administrador')
            const token = jwt.sign({ id: conta.id, email: conta.email }, segredo, { expiresIn: '8h' })
            return res.redirect(destino('login.html', `#google_token=${encodeURIComponent(token)}`))
        } catch (erro) { return res.redirect(destino('login.html', `#google_error=${encodeURIComponent(erro.message)}`)) }
    })
    app.get('/api/google/status', verificarToken, exigirMaster, (req, res) => {
        const dados = lerPrivado()
        res.json({ habilitado, conectado: Boolean(dados.refreshToken), email: dados.email || '', ultimaSincronizacao: dados.ultimaSincronizacao || null, erro: dados.erro || null })
    })
    app.post('/api/google/sincronizar', verificarToken, exigirMaster, async (req, res) => {
        try { const ultimaSincronizacao = await sincronizar(); res.json({ mensagem: 'Cópia salva na pasta privada do aplicativo no Google Drive.', ultimaSincronizacao }) }
        catch (erro) { res.status(503).json({ mensagem: String(erro.message).slice(0, 200) }) }
    })
    return { agendar }
}