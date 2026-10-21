// Simula respostas assinadas do Google; não contata uma conta real.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const net = require('node:net')
const { spawn } = require('node:child_process')
const backend = path.join(__dirname, '..', 'backend')
const modules = process.env.NODE_PATH || path.join(backend, 'node_modules')
async function portaLivre() {
    const servidor = net.createServer()
    await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve))
    const porta = servidor.address().port
    await new Promise((resolve) => servidor.close(resolve))
    return porta
}
async function principal() {
    const diretorio = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrypta-google-'))
    const copia = path.join(diretorio, 'backend')
    fs.cpSync(backend, copia, { recursive: true, filter: (origem) => !origem.includes('node_modules') && !origem.endsWith('.env') && !origem.endsWith('.google-private.json') })
    const mock = path.join(diretorio, 'google-mock.js')
    fs.writeFileSync(mock, `const fs=require('fs'),crypto=require('crypto'),jwt=require('jsonwebtoken');
const real=global.fetch,par=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const jwk=par.publicKey.export({format:'jwk'});jwk.kid='mock-kid';jwk.use='sig';jwk.alg='RS256';
global.fetch=async(input,options={})=>{
 const url=String(input);let data;
 if(url.includes('oauth2.googleapis.com/token')){
   const body=new URLSearchParams(options.body);
   const [nonce,identidade]=String(body.get('code')).split('|');
   const regular=identidade==='novo'||identidade==='colisao';
   data=body.get('grant_type')==='refresh_token'?{access_token:'access-mock'}:{id_token:jwt.sign({iss:'https://accounts.google.com',aud:process.env.GOOGLE_CLIENT_ID,nonce,sub:identidade==='colisao'?'outro-google-sub':regular?'novo-google-sub':identidade==='master-impostor'?'outro-master-sub':'master-google-sub',email:regular?'novo@gmail.com':'thais.demo@syncrypta.local',name:regular?'Conta Básica Nova':'Master',email_verified:true},par.privateKey,{algorithm:'RS256',expiresIn:'10m',keyid:'mock-kid'}),refresh_token:'refresh-mock'};
 }else if(url.includes('googleapis.com/oauth2/v3/certs')) data={keys:[jwk]};
 else if(url.includes('googleapis.com/drive/v3/files?')) data={files:[]};
 else if(url.includes('googleapis.com/upload/drive/v3/files?')){fs.writeFileSync('.mock-upload.txt',options.body);data={id:'file-mock'};}
 else return real(input,options);
 return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}})
};`)
    const porta = await portaLivre()
    const base = `http://127.0.0.1:${porta}`
    const processo = spawn(process.execPath, ['--require', mock, 'server.js'], {
        cwd: copia,
        env: {
            ...process.env, NODE_ENV: 'test', NODE_PATH: modules, PORT: String(porta),
            JWT_SECRET: 'teste-isolado-jwt-secret-mais-de-32-caracteres', GOOGLE_CLIENT_ID: 'mock-client', GOOGLE_CLIENT_SECRET: 'mock-secret',
            GOOGLE_REDIRECT_URI: `${base}/api/google/callback`, FRONTEND_URL: 'http://localhost:5500'
        }, stdio: ['ignore', 'pipe', 'pipe']
    })
    let erro = ''; processo.stderr.on('data', (data) => { erro += data })
    try {
        let disponivel = false
        for (let tentativa = 0; tentativa < 60; tentativa++) {
            try { if ((await fetch(`${base}/api/saude`)).ok) { disponivel = true; break } } catch { }
            await new Promise((resolve) => setTimeout(resolve, 100))
        }
        assert.ok(disponivel, erro)
        // O teste assina um token local usando o segredo temporário da cópia isolada.
        const jwt = require(path.join(modules, 'jsonwebtoken'))
        const token = jwt.sign({ id: 900001 }, 'teste-isolado-jwt-secret-mais-de-32-caracteres', { expiresIn: '5m' })
        const autenticar = { Authorization: `Bearer ${token}` }
        const config = await (await fetch(`${base}/api/google/config`)).json()
        assert.equal(config.habilitado, true)
        const conexao = await fetch(`${base}/api/google/conectar`, { method: 'POST', headers: autenticar })
        assert.equal(conexao.status, 200)
        const url = new URL((await conexao.json()).url)
        const callback = await fetch(`${base}/api/google/callback?state=${encodeURIComponent(url.searchParams.get('state'))}&code=${encodeURIComponent(url.searchParams.get('nonce'))}`, { redirect: 'manual' })
        assert.equal(callback.status, 302)
        assert.ok(callback.headers.get('location').includes('google=conectado'), callback.headers.get('location'))
        const status = await (await fetch(`${base}/api/google/status`, { headers: autenticar })).json()
        assert.equal(status.conectado, true)
        const sincronizar = await fetch(`${base}/api/google/sincronizar`, { method: 'POST', headers: autenticar })
        assert.equal(sincronizar.status, 200, JSON.stringify(await sincronizar.json()))
        assert.ok(fs.readFileSync(path.join(copia, '.mock-upload.txt'), 'utf8').includes('syncrypta-backup-v1'))
        const inicio = await fetch(`${base}/api/google/iniciar`, { redirect: 'manual' })
        const urlLogin = new URL(inicio.headers.get('location'))
        const retorno = await fetch(`${base}/api/google/callback?state=${encodeURIComponent(urlLogin.searchParams.get('state'))}&code=${encodeURIComponent(urlLogin.searchParams.get('nonce'))}`, { redirect: 'manual' })
        assert.ok(retorno.headers.get('location').includes('#google_token='), retorno.headers.get('location'))
        const iniciar = async (modo, identidade) => {
            const resposta = await fetch(`${base}/api/google/iniciar${modo === 'cadastro' ? '?modo=cadastro' : ''}`, { redirect: 'manual' })
            const autorizacao = new URL(resposta.headers.get('location'))
            const codigo = `${autorizacao.searchParams.get('nonce')}|${identidade}`
            return fetch(`${base}/api/google/callback?state=${encodeURIComponent(autorizacao.searchParams.get('state'))}&code=${encodeURIComponent(codigo)}`, { redirect: 'manual' })
        }
        const primeiroLogin = await iniciar('login', 'novo')
        const fragmento = new URL(primeiroLogin.headers.get('location')).hash.slice(1)
        const tokenNovo = new URLSearchParams(fragmento).get('google_token')
        assert.ok(tokenNovo)
        const headersNovo = { Authorization: `Bearer ${tokenNovo}` }
        const contaNova = await (await fetch(`${base}/api/minha-conta`, { headers: headersNovo })).json()
        assert.equal(contaNova.usuario.perfil, 'usuario')
        assert.equal(contaNova.usuario.plano, 'basico')
        assert.equal(contaNova.usuario.acessoTotal, false)
        const segundoLogin = await iniciar('login', 'novo')
        const tokenRepetido = new URLSearchParams(new URL(segundoLogin.headers.get('location')).hash.slice(1)).get('google_token')
        const contaRepetida = await (await fetch(`${base}/api/minha-conta`, { headers: { Authorization: `Bearer ${tokenRepetido}` } })).json()
        assert.equal(contaRepetida.usuario.id, contaNova.usuario.id)
        const botaoCadastro = await iniciar('cadastro', 'novo')
        assert.ok(botaoCadastro.headers.get('location').includes('#google_token='), botaoCadastro.headers.get('location'))
        const dashboardNovo = await (await fetch(`${base}/api/dashboard`, { headers: headersNovo })).json()
        assert.equal(dashboardNovo.movimentacoes.length, 0)
        assert.equal(dashboardNovo.saldoFinal, 0)
        assert.equal((await fetch(`${base}/api/clientes`, { headers: headersNovo })).status, 403)
        assert.equal((await fetch(`${base}/api/google/conectar`, { method: 'POST', headers: headersNovo })).status, 403)
        const senhaNaoExiste = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'novo@gmail.com', senha: 'senha-da-google' }) })
        assert.equal(senhaNaoExiste.status, 400)
        const colisao = await iniciar('login', 'colisao')
        assert.ok(colisao.headers.get('location').includes('#google_error='))
        const masterNaoVinculado = await iniciar('login', 'master-impostor')
        assert.ok(masterNaoVinculado.headers.get('location').includes('#google_error='))
        console.log('OK: Google em um clique cria conta Básica vazia, preserva acesso e bloqueia colisão/master; backup simulado.')
    } finally {
        processo.kill('SIGTERM')
        await new Promise((resolve) => { if (processo.exitCode !== null) return resolve(); processo.once('exit', resolve); setTimeout(resolve, 1000) })
        fs.rmSync(diretorio, { recursive: true, force: true })
    }
}
principal().catch((erro) => { console.error(erro); process.exitCode = 1 })