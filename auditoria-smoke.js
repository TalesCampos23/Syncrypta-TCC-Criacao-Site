// Teste da auditoria (4.12): roda numa cópia temporária dos dados; nunca altera os JSONs entregues.
// Confere que a auditoria segue o plano (Empresarial ou master), que cada conta vê só os próprios
// registros e que exportações ficam anotadas. Uso (na pasta do projeto): node tests/auditoria-smoke.js
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
    const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrypta-auditoria-'))
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

        const basica = await entrar('basica@example.com')
        assert.equal((await pedir('/api/auditoria', basica)).status, 403, 'Básico não tem auditoria')

        const empresarial = await entrar('empresarial@example.com')
        assert.equal((await pedir('/api/auditoria/exportacao', empresarial, 'POST', { formato: 'excel', mes: '2026-10', linhas: 12 })).status, 200)
        const lista = await pedir('/api/auditoria', empresarial)
        assert.equal(lista.status, 200, 'Empresarial comum vê a auditoria (antes recebia 403)')
        assert.ok(lista.dados.some((r) => r.acao === 'EXPORTOU_RELATORIO' && r.detalhes.linhas === 12), 'exportação anotada')
        assert.ok(lista.dados.every((r) => String(r.usuarioId) === '999302'), 'só os próprios registros')

        const visita = (await pedir('/api/demo/acesso', null, 'POST', { plano: 'empresarial' })).dados.token
        if (visita) assert.equal((await pedir('/api/auditoria', visita)).status, 200, 'visita Empresarial vê a auditoria de exemplo')
        console.log('OK: auditoria segue o plano, cada conta vê só os próprios registros e exportações ficam anotadas.')
    } finally {
        processo.kill()
        fs.rmSync(temporario, { recursive: true, force: true })
    }
}

executar().catch((erro) => { console.error(erro); process.exit(1) })
