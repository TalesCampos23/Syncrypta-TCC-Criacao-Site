// ==========================================================
// CONTA DE EXEMPLO DA THAÍS · Syncrypta 4.14
// Cria (ou conserta) a conta exemplar "Thais Calca" SEM apagar nenhum dado existente.
//   E-mail: thais.demo@syncrypta.local   Senha: Syncrypta@2026
// Ela é a conta master (acesso total) e vem com dados fictícios: 3 perfis (Alfa Consultoria,
// Profissional Autônomo, Studio Horizonte), 8 meses de movimentações, regras e saldos.
//
// Uso, com o backend DESLIGADO, dentro da pasta backend:
//   node conta-exemplo.js              cria a conta ou devolve a senha de exemplo
//   node conta-exemplo.js --redefinir  se a conta master usa outro e-mail, volta para o de exemplo
// (No Windows também dá para dar dois cliques em 3_CONTA_EXEMPLO_THAIS.bat.)
// ==========================================================
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const { montarDadosDemo } = require('./seed-demo')

const EMAIL = 'thais.demo@syncrypta.local'
const SENHA = 'Syncrypta@2026'
const MASTER_ID = String(process.env.MASTER_USER_ID || '900001')
const redefinir = process.argv.includes('--redefinir')

const ler = (nome) => {
    const arquivo = path.join(__dirname, `${nome}.json`)
    if (!fs.existsSync(arquivo)) return []
    const texto = fs.readFileSync(arquivo, 'utf8').trim()
    return texto ? JSON.parse(texto) : []
}
const salvar = (nome, lista) => fs.writeFileSync(path.join(__dirname, `${nome}.json`), JSON.stringify(lista, null, 2), 'utf8')

;(async () => {
    if (process.env.NODE_ENV === 'production') {
        console.log('Atenção: com NODE_ENV=production, o servidor troca o e-mail e a senha da master pelos do .env (MASTER_EMAIL e MASTER_PASSWORD_HASH).')
        console.log('Para usar a conta de exemplo, rode o backend sem NODE_ENV=production.\n')
    }
    const demo = await montarDadosDemo()
    const usuarios = ler('usuarios')
    const exemplo = demo.usuarios.find((u) => String(u.id) === MASTER_ID) || demo.usuarios[0]
    exemplo.senha = await bcrypt.hash(SENHA, 10)

    let conta = usuarios.find((u) => String(u.email).toLowerCase() === EMAIL)
    const master = usuarios.find((u) => String(u.id) === MASTER_ID)

    if (conta) {
        // Já existe: garante senha, acesso total e conta ativa.
        Object.assign(conta, { senha: exemplo.senha, perfil: 'cliente_tcc', acessoTotal: true, ativo: true })
        console.log('A conta de exemplo já existia: a senha voltou a ser a de exemplo e ela está ativa.')
    } else if (master) {
        if (!redefinir) {
            console.log(`A conta master já existe, mas usa o e-mail ${master.email}.`)
            console.log('Entre com esse e-mail e a senha dela, ou rode de novo com --redefinir para voltar ao e-mail e à senha de exemplo.')
            console.log('(Os dados continuam todos no lugar.)')
            process.exit(0)
        }
        if (usuarios.some((u) => u !== master && String(u.email).toLowerCase() === EMAIL)) throw new Error(`Outra conta já usa ${EMAIL}.`)
        Object.assign(master, { email: EMAIL, senha: exemplo.senha, perfil: 'cliente_tcc', acessoTotal: true, ativo: true })
        conta = master
        console.log(`A conta master voltou para o e-mail ${EMAIL}.`)
    } else {
        conta = { ...exemplo, ativo: true }
        usuarios.push(conta)
        console.log('Conta de exemplo criada.')
    }
    salvar('usuarios', usuarios)

    // Dados fictícios da conta: só acrescenta o que falta; nada é apagado ou sobrescrito.
    const idConta = String(conta.id)
    for (const nome of ['clientes', 'regras', 'movimentacoes', 'saldos', 'auditoria']) {
        const atuais = ler(nome)
        const doExemplo = (demo[nome] || []).filter((item) => String(item.usuarioId) === MASTER_ID)
        const novos = doExemplo
            .filter((item) => !atuais.some((atual) => String(atual.id) === String(item.id)))
            .map((item) => ({ ...item, usuarioId: conta.id }))
        const conflitos = doExemplo.filter((item) => atuais.some((atual) => String(atual.id) === String(item.id) && String(atual.usuarioId) !== idConta)).length
        if (novos.length) { salvar(nome, [...atuais, ...novos]); console.log(`${nome}: ${novos.length} itens de exemplo adicionados`) }
        if (conflitos) console.log(`${nome}: ${conflitos} itens pulados porque o número de ID já é usado por outra conta`)
    }

    console.log('\nPronto. Ligue o backend (npm start) e entre com:')
    console.log(`  E-mail: ${EMAIL}`)
    console.log(`  Senha:  ${SENHA}`)
})().catch((erro) => {
    console.error('Não foi possível preparar a conta de exemplo:', erro.message)
    process.exit(1)
})
