// Simula tokens Firebase assinados e isola os arquivos de dados em uma cópia temporária.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const net = require('node:net')
const crypto = require('node:crypto')
const { spawn } = require('node:child_process')
const backend = path.join(__dirname, '..', 'backend')
const modules = process.env.NODE_PATH || path.join(backend, 'node_modules')
const jwt = require(path.join(modules, 'jsonwebtoken'))

async function portaLivre() {
    const socket = net.createServer()
    await new Promise((resolve) => socket.listen(0, '127.0.0.1', resolve))
    const porta = socket.address().port
    await new Promise((resolve) => socket.close(resolve))
    return porta
}

async function testar() {
    const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrypta-firebase-'))
    const copia = path.join(temporario, 'backend')
    fs.cpSync(backend, copia, { recursive: true, filter: (origem) =>
        !origem.includes('node_modules') && !origem.endsWith('.env') && !origem.endsWith('.google-private.json') })
    const contas = JSON.parse(fs.readFileSync(path.join(copia, 'usuarios.json')))
    contas.push({id:991001,nome:'Conta Local',email:'local@example.com',senha:'hash-exemplo',perfil:'usuario',plano:'basico'})
    contas.push({id:991002,nome:'Conta Anterior',email:'previous@example.com',senha:null,googleSub:'google-previous',perfil:'usuario',plano:'basico'})
    fs.writeFileSync(path.join(copia, 'usuarios.json'),JSON.stringify(contas))
    fs.writeFileSync(path.join(copia, '.google-private.json'),JSON.stringify({sub:'google-master'}))
    const par = crypto.generateKeyPairSync('rsa',{modulusLength:2048})
    const certificado = par.publicKey.export({format:'pem',type:'spki'})
    const kid = 'firebase-test-kid'
    const mock = path.join(temporario,'firebase-certs.js')
    fs.writeFileSync(mock,`const original=global.fetch; global.fetch=async(url,opts)=>{
 if(String(url).includes('securetoken@system.gserviceaccount.com'))return new Response(JSON.stringify({${JSON.stringify(kid)}:${JSON.stringify(certificado)}}),{status:200,headers:{'cache-control':'public,max-age=300'}});
 return original(url,opts);
};`)
    const porta = await portaLivre()
    const base = `http://127.0.0.1:${porta}`
    const processo = spawn(process.execPath,['--require',mock,'server.js'],{cwd:copia,env:{...process.env,
        NODE_ENV:'test',NODE_PATH:modules,PORT:String(porta),JWT_SECRET:'firebase-teste-segredo-mais-de-32-caracteres',
        GOOGLE_CLIENT_ID:'',GOOGLE_CLIENT_SECRET:'',GOOGLE_REDIRECT_URI:'',FIREBASE_PROJECT_ID:'syncrypta-auth-test'},
        stdio:['ignore','pipe','pipe']})
    let erros='';processo.stderr.on('data',(dados)=>{erros+=dados})
    function token(email,googleSub,uid,ajustes={}) {
        const agora=Math.floor(Date.now()/1000)
        const dados={iss:'https://securetoken.google.com/syncrypta-auth-test',aud:'syncrypta-auth-test',sub:uid,
            email,name:'Pessoa Teste',email_verified:true,auth_time:agora,
            firebase:{sign_in_provider:'google.com',identities:{'google.com':[googleSub]}},...ajustes}
        return jwt.sign(dados,par.privateKey,{algorithm:'RS256',expiresIn:'10m',keyid:kid})
    }
    const login=async(idToken)=>{const resposta=await fetch(`${base}/api/firebase/login`,{method:'POST',
        headers:{'content-type':'application/json'},body:JSON.stringify({idToken})});return {status:resposta.status,dados:await resposta.json()}}
    try {
        let pronto=false
        for(let i=0;i<60;i++){try{if((await fetch(`${base}/api/saude`)).ok){pronto=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}
        assert.ok(pronto,erros)
        assert.deepEqual(await(await fetch(`${base}/api/firebase/config`)).json(),{habilitado:true,projectId:'syncrypta-auth-test'})
        const novoToken=token('new@example.com','google-new','firebase-new')
        const primeiro=await login(novoToken)
        assert.equal(primeiro.status,200,JSON.stringify(primeiro.dados))
        const headers={Authorization:`Bearer ${primeiro.dados.token}`}
        const conta=await(await fetch(`${base}/api/minha-conta`,{headers})).json()
        assert.equal(conta.usuario.perfil,'usuario')
        assert.equal(conta.usuario.plano,'basico')
        assert.equal(conta.usuario.acessoTotal,false)
        const dashboard=await(await fetch(`${base}/api/dashboard`,{headers})).json()
        assert.equal(dashboard.saldoFinal,0)
        assert.equal(dashboard.movimentacoes.length,0)
        assert.equal((await fetch(`${base}/api/clientes`,{headers})).status,403)
        const retorno=await login(novoToken)
        assert.equal(retorno.status,200)
        const usuarios=JSON.parse(fs.readFileSync(path.join(copia,'usuarios.json')))
        assert.equal(usuarios.filter(u=>u.firebaseUid==='firebase-new').length,1)
        assert.equal((await login(token('local@example.com','google-local','firebase-local'))).status,401)
        assert.equal((await login(token('thais.demo@syncrypta.local','google-not-master','firebase-master'))).status,401)
        assert.equal((await login(token('other@example.com','google-master','firebase-master-other-email'))).status,401)
        assert.equal((await login(token('new@example.com','google-other','firebase-other'))).status,401)
        assert.equal((await login(token('new@example.com','google-new','firebase-new',{aud:'wrong-project'}))).status,401)
        assert.equal((await login(token('new@example.com','google-new','firebase-new',{firebase:{sign_in_provider:'password',identities:{}}}))).status,401)
        const horario = Math.floor(Date.now()/1000)
        assert.equal((await login(token('skew@example.com','google-skew','firebase-skew',{iat:horario+17,auth_time:horario+17}))).status,200)
        assert.equal((await login(token('future@example.com','google-future','firebase-future',{iat:horario+120,auth_time:horario+120}))).status,401)
        const anterior=await login(token('previous@example.com','google-previous','firebase-previous'))
        assert.equal(anterior.status,200)
        const contasAtualizadas=JSON.parse(fs.readFileSync(path.join(copia,'usuarios.json')))
        assert.equal(contasAtualizadas.find(u=>u.id===991002).firebaseUid,'firebase-previous')
        console.log('OK: Firebase Google cria Básico vazio, mantém UID, vincula Google anterior e bloqueia colisões e master.')
    } finally {
        processo.kill('SIGTERM')
        await new Promise((resolve)=>{if(processo.exitCode!==null)return resolve();processo.once('exit',resolve);setTimeout(resolve,1000)})
        fs.rmSync(temporario,{recursive:true,force:true})
    }
}
testar().catch((erro)=>{console.error(erro);process.exitCode=1})
