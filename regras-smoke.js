// Teste das regras inteligentes (4.13): palavra inteira, regra desativada e tipo. Cópia temporária dos dados.
// Uso (na pasta do projeto): node tests/regras-smoke.js
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
    const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrypta-regras-'))
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

        const conta = await entrar('empresarial@example.com')
        const classificar = async (descricao, tipo = '') => (await pedir('/api/classificar-lote', conta, 'POST', { linhas: [{ descricao, tipo, valor: 10, data: '2026-10-10' }] })).dados.linhas[0]
        const nova = (await pedir('/api/regras', conta, 'POST', { termo: 'Padaria', tipo: 'pagamento', categoria: 'Alimentação', subcategoria: 'Padaria' })).dados.regra
        assert.equal((await classificar('PADARIA PAO QUENTE')).categoria, 'Alimentação')
        assert.equal((await classificar('Posto Shell BR')).subcategoria, 'Combustível')
        assert.equal((await classificar('Compra no composto agricola')).categoria, 'Não identificado', '"posto" não pode pegar "composto"')
        assert.equal((await classificar('Padaria venda de bolo', 'receita')).categoria, 'Não identificado', 'regra de pagamento não vale para receita')
        await pedir(`/api/regras/${nova.id}`, conta, 'PUT', { termo: 'Padaria', tipo: 'pagamento', categoria: 'Alimentação', subcategoria: 'Padaria', ativa: false })
        assert.equal((await classificar('PADARIA PAO QUENTE')).categoria, 'Não identificado', 'regra desativada não é usada')
        // 4.14: importar o mesmo extrato duas vezes não duplica os lançamentos
        const linhas = [{ descricao: 'Posto Shell BR', valor: 120, data: '2026-10-11' }, { descricao: 'Mercado Central', valor: 80.5, data: '2026-10-12' }]
        const primeira = (await pedir('/api/importar-lote', conta, 'POST', { linhas })).dados
        assert.equal(primeira.quantidade, 2)
        const revisao = (await pedir('/api/classificar-lote', conta, 'POST', { linhas })).dados
        assert.ok(revisao.linhas.every((l) => l.duplicada) && revisao.resumo.duplicadas === 2, 'a revisão avisa que já existem')
        const segunda = (await pedir('/api/importar-lote', conta, 'POST', { linhas })).dados
        assert.deepEqual([segunda.quantidade, segunda.ignoradas], [0, 2])
        const forcada = (await pedir('/api/importar-lote', conta, 'POST', { linhas: [{ ...linhas[0], importarDuplicada: true }] })).dados
        assert.equal(forcada.quantidade, 1, '"importar mesmo assim" funciona')
        console.log('OK: regras pegam a palavra inteira, respeitam o tipo e ignoram regra desativada; extrato repetido não duplica.')
    } finally {
        processo.kill()
        fs.rmSync(temporario, { recursive: true, force: true })
    }
}

executar().catch((erro) => { console.error(erro); process.exit(1) })
