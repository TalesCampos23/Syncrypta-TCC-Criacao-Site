// Teste das configurações e da administração de usuários (4.13). Cópia temporária dos dados.
// Uso (na pasta do projeto): node tests/configuracoes-smoke.js
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const net = require('node:net')
const { spawn } = require('node:child_process')
const backend = path.join(__dirname, '..', 'backend')
const modules = process.env.NODE_PATH || path.join(backend, 'node_modules')
const bcrypt = require(path.join(modules, 'bcryptjs'))

async function portaLivre() {
    const server = net.createServer()
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = server.address().port
    await new Promise((resolve) => server.close(resolve))
    return port
}

async function executar() {
    const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrypta-config-'))
    const copia = path.join(temporario, 'backend')
    fs.cpSync(backend, copia, { recursive: true, filter: (origem) => !origem.includes('node_modules') && !origem.endsWith('.env') })
    const usuariosPath = path.join(copia, 'usuarios.json')
    const usuarios = fs.existsSync(usuariosPath) ? JSON.parse(fs.readFileSync(usuariosPath)) : []
    const senha = 'SenhaDeTeste!2026'
    usuarios.push({ id: 999301, nome: 'Conta Básica', email: 'basica@example.com', senha: bcrypt.hashSync(senha, 10), perfil: 'usuario', plano: 'basico' })
    usuarios.push({ id: 999302, nome: 'Conta Empresarial', email: 'empresarial@example.com', senha: bcrypt.hashSync(senha, 10), perfil: 'usuario', plano: 'empresarial', pagamentoStatus: 'aprovado' })
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios))

    const porta = await portaLivre()
    const base = `http://127.0.0.1:${porta}`
    const processo = spawn(process.execPath, ['server.js'], {
        cwd: copia,
        env: { ...process.env, NODE_ENV: 'test', PORT: String(porta), JWT_SECRET: 'teste-isolado-jwt-secret-mais-de-32-caracteres', NODE_PATH: modules, GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '' },
        stdio: ['ignore', 'pipe', 'pipe']
    })
    try {
        for (let i = 0; i < 50; i++) {
            try { if ((await fetch(`${base}/api/saude`)).ok) break } catch (erro) { /* ainda subindo */ }
            await new Promise((resolve) => setTimeout(resolve, 100))
        }
        const pedir = async (caminho, token, metodo = 'GET', corpo) => {
            const r = await fetch(base + caminho, { method: metodo, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined })
            return { status: r.status, dados: await r.json() }
        }
        const entrar = async (email) => (await pedir('/api/login', null, 'POST', { email, senha })).dados.token

        const master = (await pedir('/api/login', null, 'POST', { email: 'thais.demo@syncrypta.local', senha: 'Syncrypta@2026' })).dados.token
        assert.ok(master, 'login master (rode npm run seed antes)')
        const basica = await entrar('basica@example.com')

        // preferências: aceita só valores conhecidos e volta no /api/minha-conta
        let r = await pedir('/api/configuracoes/preferencias', basica, 'PUT', { fonte: 'grande', destaque: 'roxo', paginaInicial: 'hackear', animacoes: false })
        assert.equal(r.status, 200)
        assert.deepEqual([r.dados.preferencias.fonte, r.dados.preferencias.destaque, r.dados.preferencias.paginaInicial, r.dados.preferencias.animacoes], ['grande', 'roxo', 'dashboard', false])
        assert.equal((await pedir('/api/minha-conta', basica)).dados.usuario.preferencias.fonte, 'grande')

        // nome e senha
        assert.equal((await pedir('/api/configuracoes/perfil', basica, 'PUT', { nome: 'Nova Básica' })).status, 200)
        assert.equal((await pedir('/api/configuracoes/senha', basica, 'PUT', { senhaAtual: 'errada', novaSenha: 'OutraSenha123' })).status, 400)
        assert.equal((await pedir('/api/configuracoes/senha', basica, 'PUT', { senhaAtual: senha, novaSenha: 'curta' })).status, 400)
        assert.equal((await pedir('/api/configuracoes/senha', basica, 'PUT', { senhaAtual: senha, novaSenha: 'OutraSenha123' })).status, 200)
        assert.ok((await pedir('/api/login', null, 'POST', { email: 'basica@example.com', senha: 'OutraSenha123' })).dados.token, 'entra com a senha nova')
        assert.equal((await pedir('/api/configuracoes/senha', master, 'PUT', { senhaAtual: 'Syncrypta@2026', novaSenha: 'OutraSenha123' })).status, 403, 'senha master só pelo servidor')

        // administração: só master
        assert.equal((await pedir('/api/admin/usuarios', basica)).status, 403)
        const lista = await pedir('/api/admin/usuarios', master)
        assert.equal(lista.status, 200)
        assert.ok(!JSON.stringify(lista.dados).includes('$2'), 'nenhum hash de senha sai na lista')
        assert.equal((await pedir('/api/admin/usuarios/900001', master, 'PUT', { ativo: false })).status, 403, 'master protegida')

        // suspender: token para de valer e login é recusado; reativar devolve o acesso
        assert.equal((await pedir('/api/admin/usuarios/999302', master, 'PUT', { ativo: false })).status, 200)
        const empresarial = (await pedir('/api/login', null, 'POST', { email: 'empresarial@example.com', senha })).status
        assert.equal(empresarial, 403, 'conta suspensa não entra')
        assert.equal((await pedir('/api/admin/usuarios/999302', master, 'PUT', { ativo: true, plano: 'profissional' })).status, 200)
        const volta = await entrar('empresarial@example.com')
        assert.equal((await pedir('/api/minha-conta', volta)).dados.plano.id, 'profissional')
        // token antigo de conta suspensa deixa de funcionar
        assert.equal((await pedir('/api/admin/usuarios/999302', master, 'PUT', { ativo: false })).status, 200)
        assert.equal((await pedir('/api/minha-conta', volta)).status, 401)
        console.log('OK: preferências validadas, nome e senha, admin só para master, suspensão bloqueia login e token, troca de plano.')
    } finally {
        processo.kill()
        fs.rmSync(temporario, { recursive: true, force: true })
    }
}

executar().catch((erro) => { console.error(erro); process.exit(1) })
