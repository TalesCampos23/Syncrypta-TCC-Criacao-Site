// Teste da consulta de CNPJ (4.9) sem depender da internet:
// sobe uma "BrasilAPI falsa" no próprio computador e aponta o backend para ela (CNPJ_API_URL).
// Roda numa cópia temporária dos dados; nunca altera os JSONs entregues.
// Uso (na pasta do projeto): node tests/cnpj-smoke.js
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const http = require('node:http')
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
    // BrasilAPI falsa: um CNPJ ativo (com sócios e e-mail, que NÃO podem passar adiante) e o resto 404.
    let chamadas = 0
    const falsa = http.createServer((req, res) => {
        chamadas++
        res.setHeader('Content-Type', 'application/json')
        if (req.url.endsWith('/11222333000181')) {
            return res.end(JSON.stringify({
                cnpj: '11222333000181', razao_social: 'EMPRESA EXEMPLO LTDA', nome_fantasia: 'EXEMPLO', descricao_situacao_cadastral: 'ATIVA',
                cnae_fiscal_descricao: 'Atividades de contabilidade', municipio: 'SAO PAULO', uf: 'SP', data_inicio_atividade: '2019-03-12',
                descricao_porte: 'MICRO EMPRESA', opcao_pelo_mei: false, opcao_pelo_simples: true,
                email: 'contato@exemplo.com', ddd_telefone_1: '1199999999', qsa: [{ nome_socio: 'FULANO DE TAL' }]
            }))
        }
        res.statusCode = 404
        res.end(JSON.stringify({ message: 'CNPJ não encontrado' }))
    })
    const portaFalsa = await portaLivre()
    await new Promise((resolve) => falsa.listen(portaFalsa, '127.0.0.1', resolve))

    const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrypta-cnpj-'))
    const copia = path.join(temporario, 'backend')
    fs.cpSync(backend, copia, { recursive: true, filter: (origem) => !origem.includes('node_modules') && !origem.endsWith('.env') })
    const usuariosPath = path.join(copia, 'usuarios.json')
    const usuarios = fs.existsSync(usuariosPath) ? JSON.parse(fs.readFileSync(usuariosPath)) : []
    usuarios.push({ id: 999201, nome: 'Conta Básica', email: 'basica@example.com', senha: bcrypt.hashSync('SenhaDeTeste!2026', 10), perfil: 'usuario', plano: 'basico' })
    fs.writeFileSync(usuariosPath, JSON.stringify(usuarios))

    const porta = await portaLivre()
    const base = `http://127.0.0.1:${porta}`
    const processo = spawn(process.execPath, ['server.js'], {
        cwd: copia,
        env: { ...process.env, NODE_ENV: 'test', PORT: String(porta), JWT_SECRET: 'teste-isolado-jwt-secret-mais-de-32-caracteres', NODE_PATH: modules, CNPJ_API_URL: `http://127.0.0.1:${portaFalsa}/api/cnpj/v1`, CNPJ_FONTES: 'brasilapi', GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '' },
        stdio: ['ignore', 'pipe', 'pipe']
    })
    try {
        for (let i = 0; i < 50; i++) {
            try { if ((await fetch(`${base}/api/saude`)).ok) break } catch (erro) { /* ainda subindo */ }
            await new Promise((resolve) => setTimeout(resolve, 100))
        }
        const login = await (await fetch(`${base}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'basica@example.com', senha: 'SenhaDeTeste!2026' }) })).json()
        assert.ok(login.token, 'login da conta Básica')
        const consultar = (cnpj, token = login.token) => fetch(`${base}/api/cnpj/${encodeURIComponent(cnpj)}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })

        // sem login: recusado
        assert.equal((await consultar('11222333000181', null)).status, 401)
        // dígito verificador errado ou números repetidos: recusado sem chamar a API externa
        assert.equal((await consultar('11222333000182')).status, 400)
        assert.equal((await consultar('11111111111111')).status, 400)
        assert.equal(chamadas, 0)
        // CNPJ válido (com pontuação): só os campos que o site usa
        const resposta = await consultar('11.222.333/0001-81')
        assert.equal(resposta.status, 200)
        const empresa = await resposta.json()
        assert.equal(empresa.nomeFantasia, 'EXEMPLO')
        assert.equal(empresa.atividade, 'Atividades de contabilidade')
        assert.equal(empresa.simples, true)
        assert.ok(!('qsa' in empresa) && !('email' in empresa) && !JSON.stringify(empresa).includes('FULANO'), 'sócios e contatos não podem sair do backend')
        // segunda consulta vem do cache (não chama a API de novo)
        assert.equal((await consultar('11222333000181')).status, 200)
        assert.equal(chamadas, 1)
        // CNPJ válido que não existe na base
        assert.equal((await consultar('12345678000195')).status, 404)
        // formato do CNPJ.ws (serviço reserva) também é lido certo
        const { lerFormatoCnpjWs } = require(path.join(backend, 'cnpj.js'))
        const ws = lerFormatoCnpjWs({ razao_social: 'EMPRESA WS LTDA', porte: { descricao: 'Micro Empresa' }, simples: { simples: 'Sim', mei: 'Não' }, estabelecimento: { nome_fantasia: 'WS', situacao_cadastral: 'Ativa', data_inicio_atividade: '2020-01-02', atividade_principal: { descricao: 'Comércio' }, cidade: { nome: 'Santos' }, estado: { sigla: 'SP' } } })
        assert.deepEqual([ws.razaoSocial, ws.nomeFantasia, ws.situacao, ws.atividade, ws.municipio, ws.uf, ws.simples, ws.mei], ['EMPRESA WS LTDA', 'WS', 'ATIVA', 'Comércio', 'SANTOS', 'SP', true, false])
        console.log('OK: CNPJ exige login, valida dígitos, filtra sócios/contatos, usa cache, trata não encontrado e lê o formato do serviço reserva.')
    } finally {
        processo.kill()
        falsa.close()
        fs.rmSync(temporario, { recursive: true, force: true })
    }
}

executar().catch((erro) => { console.error(erro); process.exit(1) })
