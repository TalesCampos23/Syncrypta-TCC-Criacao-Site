// Entrada Google via Firebase Authentication. O backend valida o ID token antes de criar sessão Syncrypta.
const fs = require('node:fs')
const path = require('node:path')
const jwt = require('jsonwebtoken')

module.exports = function configurarFirebase({ app, limiteLogin, arquivos, lerJson, salvarJson, masterId, segredo, registrarAuditoria }) {
    const projectId = String(process.env.FIREBASE_PROJECT_ID || '').trim()
    const habilitado = /^[a-z0-9][a-z0-9-]{4,29}$/.test(projectId)
    const urlCertificados = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
    let cache = { certificados: {}, ate: 0 }

    const subMaster = () => {
        try { return JSON.parse(fs.readFileSync(path.join(__dirname, '.google-private.json'), 'utf8')).sub || '' }
        catch { return '' }
    }

    app.get('/api/firebase/config', (req, res) => res.json({ habilitado, projectId: habilitado ? projectId : '' }))

    async function verificarFirebase(idToken) {
        if (typeof idToken !== 'string' || idToken.length > 6000 || idToken.split('.').length !== 3) {
            throw new Error('Token inválido')
        }

        const cabecalho = jwt.decode(idToken, { complete: true })?.header
        if (cabecalho?.alg !== 'RS256' || !cabecalho.kid || typeof cabecalho.kid !== 'string') {
            throw new Error('Assinatura inválida')
        }

        if (Date.now() >= cache.ate || !cache.certificados[cabecalho.kid]) {
            const resposta = await fetch(urlCertificados, { signal: AbortSignal.timeout(12000) })
            if (!resposta.ok) throw new Error('Não foi possível validar a identidade agora')

            const certificados = await resposta.json()
            if (!certificados || typeof certificados !== 'object') throw new Error('Certificados inválidos')

            const segundos = Number(resposta.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 300)
            cache = {
                certificados,
                ate: Date.now() + Math.min(Math.max(segundos, 60), 3600) * 1000
            }
        }

        const certificado = cache.certificados[cabecalho.kid]
        if (typeof certificado !== 'string') throw new Error('Chave de assinatura desconhecida')

        const dados = jwt.verify(idToken, certificado, {
            algorithms: ['RS256'],
            audience: projectId,
            issuer: `https://securetoken.google.com/${projectId}`
        })

        const agora = Math.floor(Date.now() / 1000)
        const googleId = dados.firebase?.identities?.['google.com']?.[0]

        if (!dados.sub || dados.sub.length > 128 || !dados.email_verified ||
            dados.firebase?.sign_in_provider !== 'google.com' || !googleId ||
            typeof dados.iat !== 'number' || dados.iat > agora + 60 ||
            typeof dados.auth_time !== 'number' || dados.auth_time > agora + 60) {
            throw new Error('Conta Google não verificada')
        }

        const email = String(dados.email || '').toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('E-mail Google inválido')
        }

        return {
            uid: dados.sub,
            googleId: String(googleId),
            email,
            nome: String(dados.name || email.split('@')[0])
        }
    }

    app.post('/api/firebase/login', limiteLogin, async (req, res) => {
        if (!habilitado) {
            return res.status(503).json({ mensagem: 'Configure FIREBASE_PROJECT_ID no backend.' })
        }

        try {
            const identidade = await verificarFirebase(req.body?.idToken)
            const usuarios = lerJson(arquivos.usuarios)
            const porUid = usuarios.find((item) => item.firebaseUid === identidade.uid)
            const porGoogle = usuarios.find((item) => item.googleSub === identidade.googleId)
            const porEmail = usuarios.find((item) => String(item.email).toLowerCase() === identidade.email)

            if ((porUid && porGoogle && porUid !== porGoogle) ||
                (porUid && porEmail && porUid !== porEmail) ||
                (porGoogle && porEmail && porGoogle !== porEmail)) {
                throw new Error('Identidade vinculada a outra conta')
            }

            let conta = porUid || porGoogle || porEmail

            if (!conta) {
                if (identidade.googleId === subMaster()) {
                    throw new Error('Este Google já está vinculado à conta master')
                }

                let id = Date.now() + Math.floor(Math.random() * 1000)
                while (usuarios.some((item) => String(item.id) === String(id))) id += 1

                conta = {
                    id,
                    nome: identidade.nome.slice(0, 120),
                    email: identidade.email,
                    senha: null,
                    firebaseUid: identidade.uid,
                    googleSub: identidade.googleId,
                    perfil: 'usuario',
                    plano: 'basico',
                    acessoTotal: false,
                    pagamentoStatus: 'gratuito',
                    criadoEm: new Date().toISOString()
                }

                usuarios.push(conta)
                salvarJson(arquivos.usuarios, usuarios)
                registrarAuditoria(conta.id, 'CRIOU_CONTA', 'usuario', { origem: 'firebase_google' })
            } else {
                if (conta.firebaseUid && conta.firebaseUid !== identidade.uid) {
                    throw new Error('Esta conta usa outra identidade Firebase')
                }

                if (String(conta.email).toLowerCase() !== identidade.email) {
                    throw new Error('Confirme o e-mail cadastrado desta conta')
                }

                if (conta.perfil === 'cliente_tcc') {
                    if (String(conta.id) !== String(masterId) || subMaster() !== identidade.googleId) {
                        throw new Error('Entre com a senha master e vincule o Google antes de usar esta conta')
                    }
                } else if (!['usuario', 'portal_cliente'].includes(conta.perfil) ||
                    conta.googleSub !== identidade.googleId) {
                    throw new Error('Entre com sua senha Syncrypta e vincule este Google no painel')
                }

                conta.firebaseUid = identidade.uid
                salvarJson(arquivos.usuarios, usuarios)
            }

            if (conta.ativo === false) throw new Error('Esta conta foi suspensa pelo administrador')
            const token = jwt.sign(
                { id: conta.id, email: conta.email },
                segredo,
                { expiresIn: '8h' }
            )

            registrarAuditoria(conta.id, 'LOGIN', 'sessao', { origem: 'firebase_google' })

            res.json({
                token,
                usuario: {
                    id: conta.id,
                    nome: conta.nome,
                    email: conta.email,
                    perfil: conta.perfil,
                    plano: conta.plano
                }
            })
        } catch (erro) {
            res.status(401).json({
                mensagem: erro.message || 'Não foi possível validar o login Google.'
            })
        }
    })
}