// Teste do assistente com IA (4.10) sem gastar nada e sem internet:
// sobe um "Gemini falso" e um "Claude falso" no computador e aponta o backend para eles (IA_URL).
// Uso (na pasta do projeto): node tests/ia-smoke.js
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const http = require('node:http')
const net = require('node:net')
const { spawn } = require('node:child_process')
const backend = path.join(__dirname, '..', 'backend')
const modules = process.env.NODE_PATH || path.join(backend, 'node_modules')

async function portaLivre() {
    const server = net.createServer()
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = server.address().port
    await new Promise((resolve) => server.close(resolve))
    return port
}

// Provedor falso: guarda o que recebeu e responde no formato do Gemini ou do Claude.
async function provedorFalso() {
    const recebidos = []
    let falhar = false
    const servidor = http.createServer((req, res) => {
        let corpo = ''
        req.on('data', (parte) => { corpo += parte })
        req.on('end', () => {
            recebidos.push({ url: req.url, headers: req.headers, corpo: JSON.parse(corpo || '{}') })
            res.setHeader('Content-Type', 'application/json')
            if (falhar) { res.statusCode = 500; return res.end('{}') }
            if (req.url.includes(':generateContent')) return res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Resposta do **Gemini** falso.' }] } }] }))
            res.end(JSON.stringify({ content: [{ type: 'text', text: 'Resposta do Claude falso.' }] }))
        })
    })
    const porta = await portaLivre()
    await new Promise((resolve) => servidor.listen(porta, '127.0.0.1', resolve))
    return { url: `http://127.0.0.1:${porta}`, recebidos, servidor, set falhar(v) { falhar = v } }
}

async function subirBackend(env) {
    const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrypta-ia-'))
    fs.cpSync(path.join(__dirname, '..'), temporario, { recursive: true, filter: (origem) => !origem.includes('node_modules') && !origem.endsWith('.env') && !origem.includes(`${path.sep}videos`) })
    const porta = await portaLivre()
    const processo = spawn(process.execPath, ['server.js'], {
        cwd: path.join(temporario, 'backend'),
        env: { ...process.env, NODE_ENV: 'test', PORT: String(porta), JWT_SECRET: 'teste-isolado-jwt-secret-mais-de-32-caracteres', NODE_PATH: modules, GEMINI_API_KEY: '', ANTHROPIC_API_KEY: '', IA_PROVEDOR: '', ...env },
        stdio: ['ignore', 'pipe', 'pipe']
    })
    const base = `http://127.0.0.1:${porta}`
    for (let i = 0; i < 50; i++) {
        try { if ((await fetch(`${base}/api/saude`)).ok) break } catch (erro) { /* ainda subindo */ }
        await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return { base, fechar: () => { processo.kill(); fs.rmSync(temporario, { recursive: true, force: true }) } }
}

const perguntar = (base, corpo) => fetch(`${base}/api/assistente`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })

async function executar() {
    const falso = await provedorFalso()

    // 1) Sem chave: IA desligada
    let api = await subirBackend({})
    try {
        assert.deepEqual(await (await fetch(`${api.base}/api/assistente/status`)).json(), { ativo: false, provedor: null })
        assert.equal((await perguntar(api.base, { mensagem: 'oi' })).status, 503)
    } finally { api.fechar() }

    // 2) Gemini
    api = await subirBackend({ GEMINI_API_KEY: 'chave-gemini-de-teste', IA_URL: falso.url, IA_LIMITE_DIARIO: '4' })
    try {
        const status = await (await fetch(`${api.base}/api/assistente/status`)).json()
        assert.equal(status.ativo, true)
        assert.ok(!JSON.stringify(status).includes('chave'), 'a chave nunca vai para o navegador')
        const historico = [
            { papel: 'assistente', texto: 'mensagem solta do assistente (deve ser descartada no começo)' },
            { papel: 'usuario', texto: 'Como importo o extrato?' },
            { papel: 'assistente', texto: 'Em Importar e revisar.' }
        ]
        const resposta = await perguntar(api.base, { mensagem: 'Meu CPF é 123.456.789-09, pode ajudar?', historico, logado: false })
        assert.equal(resposta.status, 200)
        assert.equal((await resposta.json()).resposta, 'Resposta do **Gemini** falso.')
        const enviado = falso.recebidos.at(-1)
        assert.ok(enviado.url.endsWith('/models/gemini-3.5-flash-lite:generateContent'))
        assert.equal(enviado.headers['x-goog-api-key'], 'chave-gemini-de-teste')
        const sistema = enviado.corpo.systemInstruction.parts[0].text
        assert.ok(sistema.includes('BASE DE AJUDA') && sistema.includes('Posso receber pelo meu Pix pessoal?'), 'a Central de Ajuda vai junto')
        assert.ok(sistema.includes('NÃO está logada'))
        assert.deepEqual(enviado.corpo.contents.map((c) => c.role), ['user', 'model', 'user'])
        const ultima = enviado.corpo.contents.at(-1).parts[0].text
        assert.ok(!ultima.includes('123.456') && ultima.includes('[número removido]'), 'CPF não pode ir para a IA')
        // provedor com erro: 502 (o site cai para a Central de Ajuda)
        falso.falhar = true
        assert.equal((await perguntar(api.base, { mensagem: 'teste de erro' })).status, 502)
        falso.falhar = false
        // limite diário (4): duas já foram, mais duas passam e a quinta é recusada
        assert.equal((await perguntar(api.base, { mensagem: 'pergunta 3' })).status, 200)
        assert.equal((await perguntar(api.base, { mensagem: 'pergunta 4' })).status, 200)
        assert.equal((await perguntar(api.base, { mensagem: 'pergunta 5' })).status, 429)
    } finally { api.fechar() }

    // 3) Claude
    api = await subirBackend({ ANTHROPIC_API_KEY: 'chave-claude-de-teste', IA_URL: falso.url, IA_LIMITE_POR_PESSOA: '2' })
    try {
        const resposta = await perguntar(api.base, { mensagem: 'Para que serve a Syncrypta?', logado: true })
        assert.equal((await resposta.json()).resposta, 'Resposta do Claude falso.')
        const enviado = falso.recebidos.at(-1)
        assert.ok(enviado.url.endsWith('/messages'))
        assert.equal(enviado.headers['x-api-key'], 'chave-claude-de-teste')
        assert.equal(enviado.headers['anthropic-version'], '2023-06-01')
        assert.equal(enviado.corpo.model, 'claude-haiku-4-5-20251001')
        assert.ok(enviado.corpo.system.includes('está logada'))
        assert.deepEqual(enviado.corpo.messages, [{ role: 'user', content: 'Para que serve a Syncrypta?' }])
        // limite por pessoa (2 a cada 15 minutos)
        assert.equal((await perguntar(api.base, { mensagem: 'segunda' })).status, 200)
        assert.equal((await perguntar(api.base, { mensagem: 'terceira' })).status, 429)
    } finally { api.fechar() }

    falso.servidor.close()
    console.log('OK: IA desligada sem chave; Gemini e Claude recebem a Central de Ajuda, sem CPF e sem a chave no navegador; erros e limites tratados.')
}

executar().catch((erro) => { console.error(erro); process.exit(1) })
