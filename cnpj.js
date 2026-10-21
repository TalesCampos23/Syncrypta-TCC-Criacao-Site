// ==========================================================
// CONSULTA DE CNPJ · Syncrypta 4.11
// Busca os dados públicos da Receita Federal em até três serviços gratuitos, em ordem:
//   1. BrasilAPI       https://brasilapi.com.br/api/cnpj/v1/{cnpj}
//   2. Minha Receita   https://minhareceita.org/{cnpj}       (mesmo formato da BrasilAPI)
//   3. CNPJ.ws         https://publica.cnpj.ws/cnpj/{cnpj}   (formato próprio; limite de poucas consultas por minuto)
// Se um estiver fora do ar, lento ou bloquear a consulta, tenta o próximo.
// Devolve só o que o site usa. Sócios, e-mails e telefones ficam de fora (LGPD).
//
// Para descobrir o que está acontecendo no seu computador:  node testar-cnpj.js 19131243000197
// ==========================================================

const CABECALHOS = {
    Accept: 'application/json',
    // Alguns serviços recusam pedidos sem identificação; por isso o servidor se apresenta.
    'User-Agent': 'Syncrypta-TCC/4.11 (projeto academico FIAP; consulta de dados publicos de CNPJ)'
}

function texto(valor, limite = 160) {
    return String(valor ?? '').trim().replace(/[<>]/g, '').slice(0, limite)
}

function simNao(valor) {
    if (valor === true || /^sim$/i.test(String(valor))) return true
    if (valor === false || /^n[aã]o$/i.test(String(valor))) return false
    return null
}

// Formato da BrasilAPI e da Minha Receita (os dois usam os mesmos nomes de campos).
function lerFormatoReceita(empresa) {
    return {
        razaoSocial: texto(empresa.razao_social),
        nomeFantasia: texto(empresa.nome_fantasia),
        situacao: texto(empresa.descricao_situacao_cadastral, 40),
        atividade: texto(empresa.cnae_fiscal_descricao, 200),
        municipio: texto(empresa.municipio, 80),
        uf: texto(empresa.uf, 2),
        abertura: texto(empresa.data_inicio_atividade, 10),
        porte: texto(empresa.descricao_porte || empresa.porte, 40),
        mei: simNao(empresa.opcao_pelo_mei),
        simples: simNao(empresa.opcao_pelo_simples)
    }
}

// Formato do CNPJ.ws (os dados do estabelecimento ficam dentro de "estabelecimento").
function lerFormatoCnpjWs(empresa) {
    const est = empresa.estabelecimento || {}
    return {
        razaoSocial: texto(empresa.razao_social),
        nomeFantasia: texto(est.nome_fantasia),
        situacao: texto(est.situacao_cadastral, 40).toUpperCase(),
        atividade: texto(est.atividade_principal?.descricao, 200),
        municipio: texto(est.cidade?.nome, 80).toUpperCase(),
        uf: texto(est.estado?.sigla, 2),
        abertura: texto(est.data_inicio_atividade, 10),
        porte: texto(empresa.porte?.descricao, 40),
        mei: simNao(empresa.simples?.mei),
        simples: simNao(empresa.simples?.simples)
    }
}

const FONTES = [
    { id: 'brasilapi', nome: 'BrasilAPI', url: (cnpj) => `${process.env.CNPJ_API_URL || 'https://brasilapi.com.br/api/cnpj/v1'}/${cnpj}`, ler: lerFormatoReceita },
    { id: 'minhareceita', nome: 'Minha Receita', url: (cnpj) => `https://minhareceita.org/${cnpj}`, ler: lerFormatoReceita },
    { id: 'cnpjws', nome: 'CNPJ.ws', url: (cnpj) => `https://publica.cnpj.ws/cnpj/${cnpj}`, ler: lerFormatoCnpjWs }
]

// CNPJ_FONTES=brasilapi,minhareceita limita quais serviços usar (os testes usam isso).
function fontesAtivas() {
    const escolhidas = String(process.env.CNPJ_FONTES || '').split(',').map((s) => s.trim()).filter(Boolean)
    return escolhidas.length ? FONTES.filter((f) => escolhidas.includes(f.id)) : FONTES
}

// Confere os dois dígitos verificadores antes de gastar uma consulta.
function cnpjValido(cnpj) {
    if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false
    const digito = (base) => {
        const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        const resto = [...base].reduce((soma, numero, i) => soma + Number(numero) * pesos[i], 0) % 11
        return resto < 2 ? 0 : 11 - resto
    }
    const d1 = digito(cnpj.slice(0, 12))
    const d2 = digito(cnpj.slice(0, 12) + d1)
    return cnpj.endsWith(`${d1}${d2}`)
}

// Consulta uma fonte. Devolve { ok, dados } | { naoEncontrado } | { erro }.
async function consultarFonte(fonte, cnpj) {
    const inicio = Date.now()
    try {
        const resposta = await fetch(fonte.url(cnpj), { signal: AbortSignal.timeout(7000), headers: CABECALHOS })
        const tempo = Date.now() - inicio
        if (resposta.status === 404) return { naoEncontrado: true, tempo, detalhe: 'HTTP 404' }
        if (!resposta.ok) return { erro: `HTTP ${resposta.status}`, tempo }
        const dados = fonte.ler(await resposta.json())
        if (!dados.razaoSocial) return { erro: 'resposta sem razão social', tempo }
        return { ok: true, dados: { cnpj, ...dados, fonte: `${fonte.nome} · dados públicos da Receita Federal` }, tempo }
    } catch (erro) {
        const motivo = erro.name === 'TimeoutError' ? 'demorou mais de 7 s' : (erro.cause?.code || erro.message)
        return { erro: motivo, tempo: Date.now() - inicio }
    }
}

// Tenta as fontes em ordem. Só diz "não encontrado" se todas que responderam disseram 404.
async function buscarCnpj(cnpj) {
    const tentativas = []
    for (const fonte of fontesAtivas()) {
        const resultado = await consultarFonte(fonte, cnpj)
        tentativas.push({ fonte: fonte.nome, ...resultado })
        if (resultado.ok) return { ok: true, dados: resultado.dados, tentativas }
    }
    const todasNaoEncontraram = tentativas.length && tentativas.every((t) => t.naoEncontrado)
    return { ok: false, naoEncontrado: todasNaoEncontraram, tentativas }
}

module.exports = { cnpjValido, buscarCnpj, consultarFonte, FONTES, lerFormatoReceita, lerFormatoCnpjWs }
