// Diagnóstico da consulta de CNPJ: testa cada serviço direto do seu computador, sem precisar do site.
// Uso (no terminal, dentro da pasta backend):   node testar-cnpj.js 19131243000197
// Mostra, para cada serviço, se respondeu, quanto tempo levou e o nome da empresa (ou o erro).
const { FONTES, consultarFonte, cnpjValido } = require('./cnpj')

;(async () => {
    const cnpj = String(process.argv[2] || '19131243000197').replace(/\D/g, '')
    if (!cnpjValido(cnpj)) { console.log(`CNPJ inválido: ${cnpj}. Confira os 14 números.`); process.exit(1) }
    console.log(`Testando o CNPJ ${cnpj} em ${FONTES.length} serviços...\n`)
    let algumOk = false
    for (const fonte of FONTES) {
        const r = await consultarFonte(fonte, cnpj)
        if (r.ok) algumOk = true
        const resultado = r.ok ? `OK → ${r.dados.nomeFantasia || r.dados.razaoSocial} (${r.dados.situacao})` : r.naoEncontrado ? 'respondeu, mas não encontrou esse CNPJ' : `ERRO → ${r.erro}`
        console.log(`${fonte.nome.padEnd(14)} ${String(r.tempo).padStart(5)} ms   ${resultado}`)
    }
    console.log(algumOk
        ? '\nPelo menos um serviço funciona. Se o site ainda falhar, feche o backend e rode "npm start" de novo.'
        : '\nNenhum serviço respondeu. Confira a internet, o antivírus/firewall ou a rede da escola (algumas bloqueiam APIs).')
})()
