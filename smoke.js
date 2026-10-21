// Testes da API em uma cópia temporária dos dados; nunca altera os JSONs entregues.
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
    const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrypta-smoke-'))
    const copia = path.join(temporario, 'backend')
    fs.cpSync(backend, copia, { recursive: true, filter: (origem) => !origem.includes('node_modules') && !origem.endsWith('.env') && !origem.endsWith('.google-private.json') })
    const usuariosPath = path.join(copia, 'usuarios.json')
    const usuarios = JSON.parse(fs.readFileSync(usuariosPath))
    const senha = 'TesteLocalSenha!2026'
    usuarios.find((conta) => String(conta.id) === '900001').senha = bcrypt.hashSync(senha, 10)
    usuarios.push({ id: 999101, nome: 'Cliente A', email: 'cliente.a@example.com', senha: bcrypt.hashSync(senha, 10), perfil: 'portal_cliente', plano: 'basico', clienteId: 920001, proprietarioId: 900001 })
    usuarios.push({ id: 999102, nome: 'Cliente B', email: 'cliente.b@example.com', senha: bcrypt.hashSync(senha, 10), perfil: 'portal_cliente', plano: 'basico', clienteId: 920002, proprietarioId: 900001 })
    usuarios.push({ id: 999103, nome: 'Conta Profissional', email: 'profissional@example.com', senha: bcrypt.hashSync(senha, 10), perfil: 'usuario', plano: 'profissional', pagamentoStatus: 'aprovado' })
    usuarios.push({ id: 999104, nome: 'Conta Empresarial', email: 'empresarial@example.com', senha: bcrypt.hashSync(senha, 10), perfil: 'usuario', plano: 'empresarial', pagamentoStatus: 'aprovado' })
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios))
    const clientesPath = path.join(copia, 'clientes.json')
    const clientes = JSON.parse(fs.readFileSync(clientesPath))
    clientes.push({ id: 929999, usuarioId: 999103, nome: 'Perfil Profissional', perfilFinanceiro: 'pj', segmento: 'Serviços', status: 'Ativo', modoVisual: 'barras' })
    fs.writeFileSync(clientesPath, JSON.stringify(clientes))
    const movimentacoesPath = path.join(copia, 'movimentacoes.json')
    const movimentacoes = JSON.parse(fs.readFileSync(movimentacoesPath))
    movimentacoes.push({ id: 993001, usuarioId: 999103, clienteId: 929999, descricao: 'Receita profissional', tipo: 'receita', categoria: 'Receita', subcategoria: 'Serviços', valor: 2500, data: '2026-09-10', statusClassificacao: 'confirmada' })
    fs.writeFileSync(movimentacoesPath, JSON.stringify(movimentacoes))
    const porta = await portaLivre()
    const base = `http://127.0.0.1:${porta}`
    const processo = spawn(process.execPath, ['server.js'], {
        cwd: copia, env: {
            ...process.env, NODE_ENV: 'test', PORT: String(porta), JWT_SECRET: 'teste-isolado-jwt-secret-mais-de-32-caracteres',
            NODE_PATH: modules, GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '', GOOGLE_REDIRECT_URI: ''
        }, stdio: ['ignore', 'pipe', 'pipe']
    })
    let erros = ''
    processo.stderr.on('data', (texto) => { erros += texto })
    async function requisitar(caminho, token, metodo = 'GET', corpo) {
        const resposta = await fetch(`${base}${caminho}`, {
            method: metodo,
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(corpo ? { 'Content-Type': 'application/json' } : {}) },
            body: corpo ? JSON.stringify(corpo) : undefined
        })
        return { status: resposta.status, dados: await resposta.json() }
    }
    try {
        let disponivel = false
        for (let tentativa = 0; tentativa < 60; tentativa++) {
            if (processo.exitCode !== null) throw new Error(`Servidor encerrou: ${erros}`)
            try { if ((await fetch(`${base}/api/saude`)).ok) { disponivel = true; break } } catch { }
            await new Promise((resolve) => setTimeout(resolve, 100))
        }
        assert.ok(disponivel, `Servidor não iniciou: ${erros}`)
        const entrar = async (email) => {
            const resultado = await requisitar('/api/login', null, 'POST', { email, senha })
            assert.equal(resultado.status, 200)
            return resultado.dados.token
        }
        const master = await entrar('thais.demo@syncrypta.local')
        const clienteA = await entrar('cliente.a@example.com')
        const clienteB = await entrar('cliente.b@example.com')
        const profissional = await entrar('profissional@example.com')
        const empresarial = await entrar('empresarial@example.com')
        const perfilProfissional = await requisitar('/api/clientes', profissional, 'POST', { nome: 'Perfil criado no Profissional', perfilFinanceiro: 'pf' })
        const perfilEmpresarial = await requisitar('/api/clientes', empresarial, 'POST', { nome: 'Perfil criado no Empresarial', perfilFinanceiro: 'pj' })
        assert.equal(perfilProfissional.status, 201)
        assert.equal(perfilEmpresarial.status, 201)
        const perfisProfissional = await requisitar('/api/clientes', profissional)
        assert.equal(perfisProfissional.dados.length, 2)
        assert.ok(perfisProfissional.dados.every((item) => Number(item.usuarioId) === 999103))
        assert.equal((await requisitar('/api/clientes', empresarial)).dados.length, 1)
        const perfisMasterCriados = await requisitar('/api/clientes', master)
        assert.ok(perfisMasterCriados.dados.some((item) => item.nome === 'Perfil criado no Profissional'))
        assert.ok(perfisMasterCriados.dados.some((item) => item.nome === 'Perfil criado no Empresarial'))
        const perfisMaster = await requisitar('/api/clientes', master)
        assert.ok(perfisMaster.dados.some((item) => Number(item.id) === 929999))
        const movimentacoesMaster = await requisitar('/api/movimentacoes?clienteId=929999&mes=2026-09', master)
        assert.equal(movimentacoesMaster.dados[0].usuarioId, 999103)
        assert.equal((await requisitar('/api/clientes', clienteA)).dados.some((item) => Number(item.id) === 929999), false)
        for (const plano of ['basico', 'profissional', 'empresarial']) {
            const demo = await requisitar('/api/demo/acesso', null, 'POST', { plano })
            assert.equal(demo.status, 200)
            assert.equal((await requisitar('/api/movimentacoes/reclassificar-lote', demo.dados.token, 'POST', { ids: [1], categoria: 'Teste' })).status, 403)
        }
        const perfisA = await requisitar('/api/clientes', clienteA)
        assert.equal(perfisA.status, 200)
        assert.deepEqual(perfisA.dados.map((item) => Number(item.id)), [920001])
        const perfisB = await requisitar('/api/clientes', clienteB)
        assert.deepEqual(perfisB.dados.map((item) => Number(item.id)), [920002])
        const dashboardA = await requisitar('/api/dashboard?clienteId=920002&mes=2026-09', clienteA)
        assert.equal(String(dashboardA.dados.contexto.clienteId), '920001')
        assert.ok(dashboardA.dados.movimentacoes.every((item) => String(item.clienteId) === '920001'))
        assert.equal((await requisitar('/api/google/status', clienteA)).status, 403)
        assert.equal((await requisitar('/api/clientes', clienteA, 'POST', { nome: 'Tentativa' })).status, 403)
        assert.equal((await requisitar('/api/movimentacoes/reclassificar-lote', clienteA, 'POST', { ids: [1], categoria: 'Tentativa' })).status, 403)
        assert.equal((await requisitar('/api/cotacao-usd?data=2099-01-01', master)).status, 400)
        assert.deepEqual((await requisitar('/api/google/config')).dados, { habilitado: false })
        const criar = await requisitar('/api/movimentacoes', master, 'POST', { clienteId: '920001', descricao: 'Teste dólar', tipo: 'receita', categoria: 'Receita', subcategoria: 'Teste', valor: 10, moeda: 'USD', cotacaoBrl: 5, data: '2026-09-17' })
        assert.equal(criar.status, 201, JSON.stringify(criar.dados))
        assert.equal(criar.dados.movimentacao.valor, 50)
        assert.equal(criar.dados.movimentacao.valorOriginal, 10)
        const id = criar.dados.movimentacao.id
        const filtradas = await requisitar('/api/movimentacoes?clienteId=920001&mes=2026-09&categoria=Receita&status=confirmada', master)
        assert.ok(filtradas.dados.some((item) => item.id === id))
        const portal = await requisitar('/api/movimentacoes?clienteId=920002', clienteA)
        assert.ok(portal.dados.every((item) => String(item.clienteId) === '920001'))
        const lote = await requisitar('/api/movimentacoes/reclassificar-lote', master, 'POST', { ids: [id], categoria: 'Tecnologia', subcategoria: 'Teste de integração' })
        assert.equal(lote.status, 200)
        assert.equal((await requisitar(`/api/movimentacoes?clienteId=920001&categoria=Tecnologia`, master)).dados.find((item) => item.id === id).statusClassificacao, 'confirmada')
        console.log('OK: planos, permissão master, isolamento PF/PJ, filtros, USD/BRL, reclassificação e configuração Google.')
    } finally {
        processo.kill('SIGTERM')
        await new Promise((resolve) => { if (processo.exitCode !== null) return resolve(); processo.once('exit', resolve); setTimeout(resolve, 1000) })
        fs.rmSync(temporario, { recursive: true, force: true })
    }
}
executar().catch((erro) => { console.error(erro); process.exitCode = 1 })