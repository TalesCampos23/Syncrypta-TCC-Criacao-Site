const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const helmet = require('helmet')
const { rateLimit } = require('express-rate-limit')
const dotenv = require('dotenv')
const planos = require('./config/planos')

dotenv.config()

const app = express()
const porta = Number(process.env.PORT) || 3000
const segredo = process.env.JWT_SECRET || 'syncrypta-demo-local-2026-troque-em-producao'

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors())
app.use(express.json({ limit: '8mb' }))

const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { mensagem: 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.' }
})

const arquivos = {
    usuarios: path.join(__dirname, 'usuarios.json'),
    movimentacoes: path.join(__dirname, 'movimentacoes.json'),
    pagamentos: path.join(__dirname, 'pagamentos.json'),
    auditoria: path.join(__dirname, 'auditoria.json'),
    regras: path.join(__dirname, 'regras.json'),
    clientes: path.join(__dirname, 'clientes.json'),
    saldos: path.join(__dirname, 'saldos.json')
}

function lerJson(caminho) {
    try {
        if (!fs.existsSync(caminho)) fs.writeFileSync(caminho, '[]', 'utf8')
        const conteudo = fs.readFileSync(caminho, 'utf8').trim()
        return conteudo ? JSON.parse(conteudo) : []
    } catch (erro) {
        console.error('Erro ao ler JSON:', caminho, erro.message)
        return []
    }
}

function salvarJson(caminho, dados) {
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf8')
}

function limparTexto(valor, limite = 180) {
    return String(valor ?? '').trim().replace(/[<>]/g, '').slice(0, limite)
}

function normalizarTexto(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function numero(valor) {
    if (typeof valor === 'number') return valor
    const texto = String(valor ?? '').trim().replace(/\s/g, '')
    if (!texto) return NaN
    if (texto.includes(',') && texto.includes('.')) {
        return Number(texto.replace(/\./g, '').replace(',', '.'))
    }
    return Number(texto.replace(',', '.'))
}

function registrarAuditoria(usuarioId, acao, entidade, detalhes = {}) {
    const auditoria = lerJson(arquivos.auditoria)
    auditoria.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        usuarioId,
        acao,
        entidade,
        detalhes,
        dataHora: new Date().toISOString()
    })
    salvarJson(arquivos.auditoria, auditoria.slice(0, 2000))
}

function verificarToken(req, res, next) {
    const cabecalho = req.headers.authorization
    if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
        return res.status(401).json({ mensagem: 'Sessão não encontrada. Faça login novamente.' })
    }

    try {
        const token = cabecalho.split(' ')[1]
        const dados = jwt.verify(token, segredo)
        req.usuarioId = dados.id
        next()
    } catch (erro) {
        return res.status(401).json({ mensagem: 'Sua sessão expirou. Faça login novamente.' })
    }
}

function obterUsuario(id) {
    return lerJson(arquivos.usuarios).find((usuario) => String(usuario.id) === String(id))
}

function recursosDoUsuario(usuario) {
    return (planos[usuario?.plano] || planos.basico).recursos
}

function exigirRecurso(recurso) {
    return function(req, res, next) {
        const usuario = obterUsuario(req.usuarioId)
        if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado.' })
        if (usuario.acessoTotal === true || recursosDoUsuario(usuario).includes(recurso)) return next()
        return res.status(403).json({
            mensagem: 'Esta funcionalidade não está incluída no seu plano atual.',
            recurso,
            plano: usuario.plano || 'basico'
        })
    }
}

function regrasPadrao() {
    return [
        { id: 'padrao-shell', termo: 'shell', tipo: 'pagamento', categoria: 'Transporte', subcategoria: 'Combustível', confianca: 96 },
        { id: 'padrao-posto', termo: 'posto', tipo: 'pagamento', categoria: 'Transporte', subcategoria: 'Combustível', confianca: 90 },
        { id: 'padrao-uber', termo: 'uber', tipo: 'pagamento', categoria: 'Transporte', subcategoria: 'Aplicativos', confianca: 95 },
        { id: 'padrao-99', termo: '99 app', tipo: 'pagamento', categoria: 'Transporte', subcategoria: 'Aplicativos', confianca: 94 },
        { id: 'padrao-mercado', termo: 'mercado', tipo: 'pagamento', categoria: 'Alimentação', subcategoria: 'Supermercado', confianca: 92 },
        { id: 'padrao-restaurante', termo: 'restaurante', tipo: 'pagamento', categoria: 'Alimentação', subcategoria: 'Restaurante', confianca: 90 },
        { id: 'padrao-enel', termo: 'enel', tipo: 'pagamento', categoria: 'Moradia', subcategoria: 'Energia', confianca: 97 },
        { id: 'padrao-luz', termo: 'conta de luz', tipo: 'pagamento', categoria: 'Moradia', subcategoria: 'Energia', confianca: 94 },
        { id: 'padrao-internet', termo: 'internet', tipo: 'pagamento', categoria: 'Moradia', subcategoria: 'Internet', confianca: 91 },
        { id: 'padrao-aluguel', termo: 'aluguel', tipo: 'pagamento', categoria: 'Moradia', subcategoria: 'Aluguel', confianca: 97 },
        { id: 'padrao-imposto', termo: 'das mei', tipo: 'pagamento', categoria: 'Impostos', subcategoria: 'Tributos', confianca: 96 },
        { id: 'padrao-pix', termo: 'pix recebido', tipo: 'receita', categoria: 'Receita', subcategoria: 'PIX', confianca: 96 },
        { id: 'padrao-salario', termo: 'salario', tipo: 'receita', categoria: 'Receita', subcategoria: 'Salário', confianca: 96 },
        { id: 'padrao-mensalidade', termo: 'mensalidade', tipo: 'receita', categoria: 'Receita', subcategoria: 'Serviços prestados', confianca: 90 }
    ]
}

function regrasDoUsuario(usuarioId, clienteId = '') {
    const personalizadas = lerJson(arquivos.regras)
        .filter((item) => String(item.usuarioId) === String(usuarioId))
        .filter((item) => !item.clienteId || !clienteId || String(item.clienteId) === String(clienteId))
        .map((item) => ({ ...item, personalizada: true }))

    return [...personalizadas, ...regrasPadrao().map((item) => ({ ...item, personalizada: false }))]
}

function sugerirTermoRegra(descricao) {
    const ignoradas = new Set(['pagamento', 'compra', 'debito', 'credito', 'pix', 'transferencia', 'cartao', 'banco'])
    const palavras = normalizarTexto(descricao).split(' ').filter((palavra) => palavra.length >= 3 && !ignoradas.has(palavra))
    return palavras.slice(0, 3).join(' ') || normalizarTexto(descricao).slice(0, 60)
}

function classificarMovimentacao(usuarioId, entrada = {}) {
    const descricao = limparTexto(entrada.descricao, 160)
    const texto = normalizarTexto(descricao)
    const tipoInformado = limparTexto(entrada.tipo, 30).toLowerCase()
    const categoriaInformada = limparTexto(entrada.categoria, 60)
    const subcategoriaInformada = limparTexto(entrada.subcategoria, 60)
    const regras = regrasDoUsuario(usuarioId, entrada.clienteId)
    const regra = regras.find((item) => texto.includes(normalizarTexto(item.termo)))

    const tipo = tipoInformado || regra?.tipo || ''
    const categoria = categoriaInformada || regra?.categoria || ''
    const subcategoria = subcategoriaInformada || regra?.subcategoria || ''
    const preenchimentoCompleto = Boolean(tipoInformado && categoriaInformada)
    const identificada = Boolean(tipo && categoria)
    const confianca = preenchimentoCompleto ? 100 : regra ? Number(regra.confianca || (regra.personalizada ? 98 : 88)) : identificada ? 65 : 20
    const statusClassificacao = preenchimentoCompleto ? 'confirmada' : regra ? (confianca >= 92 ? 'sugerida' : 'revisar') : identificada ? 'revisar' : 'nao_identificada'

    return {
        tipo: tipo || 'pagamento',
        categoria: categoria || 'Não identificado',
        subcategoria: subcategoria || 'A classificar',
        classificacaoAutomatica: !preenchimentoCompleto,
        statusClassificacao,
        confianca,
        regraId: regra?.id || null,
        termoRegra: regra?.termo || ''
    }
}

function salvarRegraAprendida(usuarioId, dados) {
    const termo = limparTexto(dados.termo || sugerirTermoRegra(dados.descricao), 80)
    const categoria = limparTexto(dados.categoria, 60)
    const subcategoria = limparTexto(dados.subcategoria, 60)
    const tipo = limparTexto(dados.tipo, 30).toLowerCase()
    if (!termo || !categoria || !tipo) return null

    const regras = lerJson(arquivos.regras)
    const indice = regras.findIndex((item) =>
        String(item.usuarioId) === String(usuarioId) &&
        normalizarTexto(item.termo) === normalizarTexto(termo) &&
        String(item.clienteId || '') === String(dados.clienteId || '')
    )

    const regra = {
        id: indice >= 0 ? regras[indice].id : Date.now() + Math.floor(Math.random() * 1000),
        usuarioId,
        clienteId: dados.clienteId || '',
        termo,
        tipo,
        categoria,
        subcategoria,
        confianca: 99,
        ativa: true,
        criadaEm: indice >= 0 ? regras[indice].criadaEm : new Date().toISOString(),
        atualizadaEm: new Date().toISOString()
    }

    if (indice >= 0) regras[indice] = regra
    else regras.push(regra)
    salvarJson(arquivos.regras, regras)
    return regra
}

function mesAnterior(mes) {
    if (!/^\d{4}-\d{2}$/.test(String(mes || ''))) return ''
    const [ano, numeroMes] = mes.split('-').map(Number)
    const data = new Date(ano, numeroMes - 2, 1)
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
}

function proximosMeses(mesBase, quantidade = 3) {
    const baseValida = /^\d{4}-\d{2}$/.test(String(mesBase || '')) ? mesBase : new Date().toISOString().slice(0, 7)
    const [ano, mes] = baseValida.split('-').map(Number)
    return Array.from({ length: quantidade }, (_, indice) => {
        const data = new Date(ano, mes - 1 + indice + 1, 1)
        return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
    })
}

function clienteDoUsuario(usuarioId, clienteId) {
    if (!clienteId) return null
    return lerJson(arquivos.clientes).find((item) =>
        String(item.usuarioId) === String(usuarioId) && String(item.id) === String(clienteId)
    ) || null
}

function filtrarMovimentacoes(usuarioId, filtros = {}, usarMes = true) {
    return lerJson(arquivos.movimentacoes)
        .filter((item) => String(item.usuarioId) === String(usuarioId))
        .filter((item) => !filtros.clienteId || String(item.clienteId || '') === String(filtros.clienteId))
        .filter((item) => !filtros.origem || String(item.origem || '') === String(filtros.origem))
        .filter((item) => !filtros.tipo || String(item.tipo || '') === String(filtros.tipo))
        .filter((item) => !filtros.status || String(item.statusClassificacao || '') === String(filtros.status))
        .filter((item) => !usarMes || !filtros.mes || String(item.data || '').slice(0, 7) === String(filtros.mes))
        .sort((a, b) => String(a.data).localeCompare(String(b.data)))
}

function obterSaldoInicial(usuarioId, clienteId, mes) {
    if (!mes) return 0
    const registro = lerJson(arquivos.saldos).find((item) =>
        String(item.usuarioId) === String(usuarioId) &&
        String(item.clienteId || '') === String(clienteId || '') &&
        String(item.mes) === String(mes)
    )
    return Number(registro?.valor || 0)
}

function resumoDashboard(usuarioId, filtros = {}) {
    const movimentacoes = filtrarMovimentacoes(usuarioId, filtros, true)
    const historico = filtrarMovimentacoes(usuarioId, { clienteId: filtros.clienteId, origem: filtros.origem }, false)
    const cliente = clienteDoUsuario(usuarioId, filtros.clienteId)
    const saldoInicial = obterSaldoInicial(usuarioId, filtros.clienteId, filtros.mes)

    let totalRecebido = 0
    let totalPago = 0
    const categorias = {}
    const categoriasDespesas = {}
    const subcategoriasDespesas = {}
    const origens = {}
    const centrosCusto = {}
    const contrapartes = {}

    movimentacoes.forEach((item) => {
        const valor = Number(item.valor) || 0
        const tipo = String(item.tipo).toLowerCase()
        const categoria = item.categoria || 'Outros'
        const subcategoria = item.subcategoria || 'A classificar'
        const origem = item.origem || 'manual'

        if (tipo === 'receita') totalRecebido += valor
        else {
            totalPago += valor
            categoriasDespesas[categoria] = (categoriasDespesas[categoria] || 0) + valor
            subcategoriasDespesas[`${categoria} / ${subcategoria}`] = (subcategoriasDespesas[`${categoria} / ${subcategoria}`] || 0) + valor
        }

        categorias[categoria] = (categorias[categoria] || 0) + valor
        origens[origem] = (origens[origem] || 0) + valor
        if (item.centroCusto) centrosCusto[item.centroCusto] = (centrosCusto[item.centroCusto] || 0) + valor
        if (item.contraparte) contrapartes[item.contraparte] = (contrapartes[item.contraparte] || 0) + valor
    })

    const saldoFinal = saldoInicial + totalRecebido - totalPago
    const proporcaoGastos = totalRecebido > 0 ? totalPago / totalRecebido : totalPago > 0 ? 1.5 : 0
    let saudeFinanceira = movimentacoes.length ? Math.max(5, Math.min(100, Math.round((1.2 - Math.min(proporcaoGastos, 1.2)) / 1.2 * 100))) : 0
    if (saldoFinal > 0 && proporcaoGastos < 0.65) saudeFinanceira = Math.max(saudeFinanceira, 82)

    let descasamento = 'Saudável'
    if (saldoFinal < 0) descasamento = 'Crítico'
    else if (totalRecebido > 0 && totalPago > totalRecebido * 0.8) descasamento = 'Atenção'
    else if (!movimentacoes.length) descasamento = 'Sem dados'

    const mesesMapa = {}
    historico.forEach((item) => {
        const mes = String(item.data || '').slice(0, 7)
        if (!mes) return
        if (!mesesMapa[mes]) mesesMapa[mes] = { receitas: 0, pagamentos: 0 }
        if (String(item.tipo).toLowerCase() === 'receita') mesesMapa[mes].receitas += Number(item.valor) || 0
        else mesesMapa[mes].pagamentos += Number(item.valor) || 0
    })
    const mesesOrdenados = Object.keys(mesesMapa).sort().slice(-12)
    const ultimosSeis = mesesOrdenados.slice(-6)
    const mediaReceitas = ultimosSeis.length ? ultimosSeis.reduce((soma, mes) => soma + mesesMapa[mes].receitas, 0) / ultimosSeis.length : 0
    const mediaPagamentos = ultimosSeis.length ? ultimosSeis.reduce((soma, mes) => soma + mesesMapa[mes].pagamentos, 0) / ultimosSeis.length : 0

    const mesReferencia = filtros.mes || mesesOrdenados.at(-1) || new Date().toISOString().slice(0, 7)
    const mesComparacao = mesAnterior(mesReferencia)
    const anterior = mesesMapa[mesComparacao] || { receitas: 0, pagamentos: 0 }
    const saldoAnterior = anterior.receitas - anterior.pagamentos
    const variacaoSaldo = saldoAnterior !== 0 ? ((totalRecebido - totalPago - saldoAnterior) / Math.abs(saldoAnterior)) * 100 : 0

    const porDescricao = {}
    historico.filter((item) => item.tipo !== 'receita').forEach((item) => {
        const chave = normalizarTexto(item.descricao)
        if (!porDescricao[chave]) porDescricao[chave] = { descricao: item.descricao, valores: [], meses: new Set() }
        porDescricao[chave].valores.push(Number(item.valor) || 0)
        porDescricao[chave].meses.add(String(item.data).slice(0, 7))
    })
    const recorrentes = Object.values(porDescricao)
        .filter((item) => item.meses.size >= 2)
        .map((item) => ({
            descricao: item.descricao,
            media: item.valores.reduce((a, b) => a + b, 0) / item.valores.length,
            ocorrencias: item.valores.length
        }))
        .sort((a, b) => b.media - a.media)
        .slice(0, 6)

    const despesasPeriodo = movimentacoes.filter((item) => item.tipo !== 'receita')
    const mediaDespesa = despesasPeriodo.length ? despesasPeriodo.reduce((s, item) => s + Number(item.valor || 0), 0) / despesasPeriodo.length : 0
    const foraDoPadrao = despesasPeriodo
        .filter((item) => mediaDespesa > 0 && Number(item.valor) > mediaDespesa * 1.65)
        .sort((a, b) => Number(b.valor) - Number(a.valor))
        .slice(0, 5)

    const tendencia = ultimosSeis.length >= 2
        ? ((mesesMapa[ultimosSeis.at(-1)].receitas - mesesMapa[ultimosSeis.at(-1)].pagamentos) - (mesesMapa[ultimosSeis.at(-2)].receitas - mesesMapa[ultimosSeis.at(-2)].pagamentos)) / Math.max(1, Math.abs(mesesMapa[ultimosSeis.at(-2)].receitas - mesesMapa[ultimosSeis.at(-2)].pagamentos))
        : 0
    const projecoes = proximosMeses(mesReferencia, 3).map((mes, indice) => {
        const fator = Math.max(0.75, Math.min(1.25, 1 + tendencia * Math.min(indice + 1, 2) * 0.25))
        const recebimentos = mediaReceitas * fator
        const pagamentos = Math.max(mediaPagamentos, recorrentes.reduce((s, item) => s + item.media, 0))
        return { mes, recebimentos, pagamentos, saldo: recebimentos - pagamentos }
    })

    const revisao = {
        confirmadas: movimentacoes.filter((item) => item.statusClassificacao === 'confirmada').length,
        sugeridas: movimentacoes.filter((item) => item.statusClassificacao === 'sugerida').length,
        revisar: movimentacoes.filter((item) => item.statusClassificacao === 'revisar').length,
        naoIdentificadas: movimentacoes.filter((item) => item.statusClassificacao === 'nao_identificada').length
    }

    return {
        contexto: {
            clienteId: filtros.clienteId || '',
            clienteNome: cliente?.nome || 'Todos os perfis',
            perfilFinanceiro: cliente?.perfilFinanceiro || 'geral',
            mes: filtros.mes || '',
            origem: filtros.origem || ''
        },
        saldoInicial,
        totalRecebido,
        totalPago,
        saldoFinal,
        categorias,
        categoriasDespesas,
        subcategoriasDespesas,
        origens,
        centrosCusto,
        contrapartes,
        movimentacoes,
        ultimasMovimentacoes: [...movimentacoes].reverse().slice(0, 10),
        meses: mesesOrdenados.slice(-6).map((mes) => ({ mes, ...mesesMapa[mes] })),
        saudeFinanceira,
        descasamento,
        comparacao: { mesAnterior: mesComparacao, saldoAnterior, variacaoSaldo },
        projecao: {
            recebimentos: mediaReceitas,
            pagamentos: mediaPagamentos,
            saldoProjetado: mediaReceitas - mediaPagamentos,
            proximosMeses: projecoes,
            recorrentes
        },
        foraDoPadrao,
        revisao
    }
}

function filtrosDaRequisicao(req) {
    return {
        clienteId: limparTexto(req.query.clienteId, 40),
        mes: limparTexto(req.query.mes, 7),
        origem: limparTexto(req.query.origem, 40),
        tipo: limparTexto(req.query.tipo, 30),
        status: limparTexto(req.query.status, 30)
    }
}

app.get('/', (req, res) => res.send('API Syncrypta 4.0 funcionando'))
app.get('/api/saude', (req, res) => res.json({ status: 'ok', versao: '4.0.2', data: new Date().toISOString() }))
app.get('/api/planos', (req, res) => res.json(Object.values(planos)))

app.post('/api/cadastro', async (req, res) => {
    const nome = limparTexto(req.body.nome, 120)
    const email = limparTexto(req.body.email, 160).toLowerCase()
    const senha = String(req.body.senha || '')

    if (!nome || !email || senha.length < 6) {
        return res.status(400).json({ mensagem: 'Informe nome, e-mail e uma senha com pelo menos 6 caracteres.' })
    }

    const usuarios = lerJson(arquivos.usuarios)
    if (usuarios.some((usuario) => usuario.email === email)) {
        return res.status(400).json({ mensagem: 'Este e-mail já está cadastrado.' })
    }

    const usuario = {
        id: Date.now(),
        nome,
        email,
        senha: await bcrypt.hash(senha, 10),
        perfil: 'usuario',
        plano: 'basico',
        acessoTotal: false,
        pagamentoStatus: 'gratuito',
        criadoEm: new Date().toISOString()
    }
    usuarios.push(usuario)
    salvarJson(arquivos.usuarios, usuarios)
    registrarAuditoria(usuario.id, 'CRIOU_CONTA', 'usuario', {})
    res.status(201).json({ mensagem: 'Conta criada com sucesso.' })
})

app.post('/api/login', limiteLogin, async (req, res) => {
    const email = limparTexto(req.body.email, 160).toLowerCase()
    const senha = String(req.body.senha || '')
    const usuario = lerJson(arquivos.usuarios).find((item) => item.email === email)

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
        return res.status(400).json({ mensagem: 'E-mail ou senha inválidos.' })
    }

    const token = jwt.sign({ id: usuario.id, email: usuario.email }, segredo, { expiresIn: '1d' })
    registrarAuditoria(usuario.id, 'LOGIN', 'sessao', {})
    res.json({
        mensagem: 'Login realizado.', token,
        usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, plano: usuario.plano }
    })
})

app.get('/api/minha-conta', verificarToken, (req, res) => {
    const usuario = obterUsuario(req.usuarioId)
    if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado.' })
    const planoAtual = planos[usuario.plano] || planos.basico
    res.json({
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            perfil: usuario.perfil || 'usuario',
            plano: planoAtual.id,
            acessoTotal: Boolean(usuario.acessoTotal),
            pagamentoStatus: usuario.pagamentoStatus || 'gratuito'
        },
        plano: planoAtual
    })
})

app.put('/api/alternar-plano-demo', verificarToken, (req, res) => {
    const planoEscolhido = limparTexto(req.body.plano, 30)
    const usuarios = lerJson(arquivos.usuarios)
    const indice = usuarios.findIndex((item) => String(item.id) === String(req.usuarioId))
    if (indice < 0) return res.status(404).json({ mensagem: 'Usuário não encontrado.' })
    if (!['cliente_tcc', 'administrador'].includes(usuarios[indice].perfil)) {
        return res.status(403).json({ mensagem: 'Sua conta não possui acesso ao modo de demonstração.' })
    }
    if (!planos[planoEscolhido]) return res.status(400).json({ mensagem: 'Plano inválido.' })

    usuarios[indice].plano = planoEscolhido
    usuarios[indice].acessoTotal = true
    salvarJson(arquivos.usuarios, usuarios)
    registrarAuditoria(req.usuarioId, 'ALTEROU_PLANO_DEMO', 'plano', { plano: planoEscolhido })
    res.json({ mensagem: 'Plano de demonstração alterado.', plano: planos[planoEscolhido] })
})

app.post('/api/pagamento-simulado', verificarToken, (req, res) => {
    const planoEscolhido = limparTexto(req.body.plano, 30)
    const formaPagamento = limparTexto(req.body.formaPagamento, 30)
    if (!['profissional', 'empresarial'].includes(planoEscolhido)) return res.status(400).json({ mensagem: 'Plano inválido.' })
    if (!['pix', 'cartao'].includes(formaPagamento)) return res.status(400).json({ mensagem: 'Escolha PIX ou cartão.' })

    const usuarios = lerJson(arquivos.usuarios)
    const indice = usuarios.findIndex((item) => String(item.id) === String(req.usuarioId))
    if (indice < 0) return res.status(404).json({ mensagem: 'Usuário não encontrado.' })

    const pagamentos = lerJson(arquivos.pagamentos)
    const pagamento = {
        id: Date.now(), usuarioId: req.usuarioId, plano: planoEscolhido, formaPagamento,
        valor: planos[planoEscolhido].preco, status: 'aprovado', demonstrativo: true, dataHora: new Date().toISOString()
    }
    pagamentos.unshift(pagamento)
    salvarJson(arquivos.pagamentos, pagamentos)

    usuarios[indice].plano = planoEscolhido
    usuarios[indice].pagamentoStatus = 'aprovado_demo'
    salvarJson(arquivos.usuarios, usuarios)
    registrarAuditoria(req.usuarioId, 'PAGAMENTO_DEMO_APROVADO', 'plano', { plano: planoEscolhido, formaPagamento })
    res.json({ mensagem: 'Pagamento demonstrativo aprovado. Plano ativado.', plano: planos[planoEscolhido] })
})

app.get('/api/clientes', verificarToken, exigirRecurso('clientes'), (req, res) => {
    const clientes = lerJson(arquivos.clientes)
        .filter((item) => String(item.usuarioId) === String(req.usuarioId))
        .sort((a, b) => String(a.nome).localeCompare(String(b.nome)))
    res.json(clientes)
})

app.post('/api/clientes', verificarToken, exigirRecurso('clientes'), (req, res) => {
    const nome = limparTexto(req.body.nome, 120)
    const perfilFinanceiro = ['pf', 'pj'].includes(req.body.perfilFinanceiro) ? req.body.perfilFinanceiro : 'pf'
    const segmento = limparTexto(req.body.segmento, 80) || (perfilFinanceiro === 'pj' ? 'Empresa' : 'Pessoa física')
    const status = limparTexto(req.body.status, 30) || 'Ativo'
    const modoVisual = ['barras', 'linhas', 'rosca'].includes(req.body.modoVisual) ? req.body.modoVisual : 'barras'
    if (!nome) return res.status(400).json({ mensagem: 'Informe o nome ou identificação interna do perfil.' })

    const clientes = lerJson(arquivos.clientes)
    const cliente = {
        id: Date.now(), usuarioId: req.usuarioId, nome, perfilFinanceiro, segmento, status, modoVisual,
        criadoEm: new Date().toISOString()
    }
    clientes.push(cliente)
    salvarJson(arquivos.clientes, clientes)
    registrarAuditoria(req.usuarioId, 'CRIOU', 'perfil_financeiro', { id: cliente.id, nome, perfilFinanceiro })
    res.status(201).json({ mensagem: 'Perfil financeiro cadastrado.', cliente })
})

app.put('/api/clientes/:id', verificarToken, exigirRecurso('clientes'), (req, res) => {
    const clientes = lerJson(arquivos.clientes)
    const indice = clientes.findIndex((item) => String(item.id) === String(req.params.id) && String(item.usuarioId) === String(req.usuarioId))
    if (indice < 0) return res.status(404).json({ mensagem: 'Perfil financeiro não encontrado.' })

    clientes[indice] = {
        ...clientes[indice],
        nome: limparTexto(req.body.nome, 120) || clientes[indice].nome,
        perfilFinanceiro: ['pf', 'pj'].includes(req.body.perfilFinanceiro) ? req.body.perfilFinanceiro : clientes[indice].perfilFinanceiro,
        segmento: limparTexto(req.body.segmento, 80) || clientes[indice].segmento,
        status: limparTexto(req.body.status, 30) || clientes[indice].status,
        modoVisual: ['barras', 'linhas', 'rosca'].includes(req.body.modoVisual) ? req.body.modoVisual : clientes[indice].modoVisual,
        atualizadoEm: new Date().toISOString()
    }
    salvarJson(arquivos.clientes, clientes)
    registrarAuditoria(req.usuarioId, 'EDITOU', 'perfil_financeiro', { id: clientes[indice].id })
    res.json({ mensagem: 'Perfil financeiro atualizado.', cliente: clientes[indice] })
})

app.delete('/api/clientes/:id', verificarToken, exigirRecurso('clientes'), (req, res) => {
    const clientes = lerJson(arquivos.clientes)
    const cliente = clientes.find((item) => String(item.id) === String(req.params.id) && String(item.usuarioId) === String(req.usuarioId))
    if (!cliente) return res.status(404).json({ mensagem: 'Perfil financeiro não encontrado.' })
    salvarJson(arquivos.clientes, clientes.filter((item) => item !== cliente))
    registrarAuditoria(req.usuarioId, 'EXCLUIU', 'perfil_financeiro', { id: cliente.id, nome: cliente.nome })
    res.json({ mensagem: 'Perfil financeiro excluído.' })
})

app.get('/api/saldo-inicial', verificarToken, (req, res) => {
    const clienteId = limparTexto(req.query.clienteId, 40)
    const mes = limparTexto(req.query.mes, 7)
    res.json({ valor: obterSaldoInicial(req.usuarioId, clienteId, mes), clienteId, mes })
})

app.put('/api/saldo-inicial', verificarToken, (req, res) => {
    const clienteId = limparTexto(req.body.clienteId, 40)
    const mes = limparTexto(req.body.mes, 7)
    const valor = numero(req.body.valor)
    if (!/^\d{4}-\d{2}$/.test(mes) || !Number.isFinite(valor)) {
        return res.status(400).json({ mensagem: 'Informe mês e saldo inicial válidos.' })
    }

    const saldos = lerJson(arquivos.saldos)
    const indice = saldos.findIndex((item) =>
        String(item.usuarioId) === String(req.usuarioId) && String(item.clienteId || '') === String(clienteId) && item.mes === mes
    )
    const registro = { id: indice >= 0 ? saldos[indice].id : Date.now(), usuarioId: req.usuarioId, clienteId, mes, valor, atualizadoEm: new Date().toISOString() }
    if (indice >= 0) saldos[indice] = registro
    else saldos.push(registro)
    salvarJson(arquivos.saldos, saldos)
    registrarAuditoria(req.usuarioId, 'DEFINIU_SALDO_INICIAL', 'saldo', { clienteId, mes, valor })
    res.json({ mensagem: 'Saldo inicial atualizado.', registro })
})

app.post('/api/movimentacoes', verificarToken, (req, res) => {
    const descricao = limparTexto(req.body.descricao, 160)
    const valor = numero(req.body.valor)
    const data = limparTexto(req.body.data, 10)
    if (!descricao || !Number.isFinite(valor) || valor <= 0 || !data) {
        return res.status(400).json({ mensagem: 'Preencha descrição, valor e data com informações válidas.' })
    }

    const classificacao = classificarMovimentacao(req.usuarioId, req.body)
    const movimentacoes = lerJson(arquivos.movimentacoes)
    const nova = {
        id: Date.now(), usuarioId: req.usuarioId,
        clienteId: limparTexto(req.body.clienteId, 40),
        descricao,
        tipo: classificacao.tipo,
        categoria: classificacao.categoria,
        subcategoria: classificacao.subcategoria,
        valor,
        data,
        origem: limparTexto(req.body.origem, 40) || 'manual',
        conta: limparTexto(req.body.conta, 80),
        contraparte: limparTexto(req.body.contraparte, 100),
        centroCusto: limparTexto(req.body.centroCusto, 80),
        natureza: limparTexto(req.body.natureza, 40),
        classificacaoAutomatica: classificacao.classificacaoAutomatica,
        statusClassificacao: req.body.statusClassificacao || 'confirmada',
        confianca: classificacao.confianca,
        regraId: classificacao.regraId,
        criadoEm: new Date().toISOString()
    }
    movimentacoes.push(nova)
    salvarJson(arquivos.movimentacoes, movimentacoes)
    if (req.body.aprenderRegra) salvarRegraAprendida(req.usuarioId, nova)
    registrarAuditoria(req.usuarioId, 'CRIOU', 'movimentacao', { id: nova.id, descricao, valor, clienteId: nova.clienteId })
    res.status(201).json({ mensagem: 'Movimentação cadastrada.', movimentacao: nova })
})

app.get('/api/movimentacoes', verificarToken, (req, res) => {
    const filtros = filtrosDaRequisicao(req)
    res.json(filtrarMovimentacoes(req.usuarioId, filtros, true).sort((a, b) => String(b.data).localeCompare(String(a.data))))
})

app.put('/api/movimentacoes/:id', verificarToken, (req, res) => {
    const movimentacoes = lerJson(arquivos.movimentacoes)
    const indice = movimentacoes.findIndex((item) => String(item.id) === String(req.params.id) && String(item.usuarioId) === String(req.usuarioId))
    if (indice < 0) return res.status(404).json({ mensagem: 'Movimentação não encontrada.' })

    const descricao = limparTexto(req.body.descricao, 160)
    const valor = numero(req.body.valor)
    const data = limparTexto(req.body.data, 10)
    if (!descricao || !Number.isFinite(valor) || valor <= 0 || !data) {
        return res.status(400).json({ mensagem: 'Preencha descrição, valor e data com informações válidas.' })
    }

    const classificacao = classificarMovimentacao(req.usuarioId, req.body)
    const anterior = { ...movimentacoes[indice] }
    movimentacoes[indice] = {
        ...movimentacoes[indice],
        clienteId: limparTexto(req.body.clienteId, 40),
        descricao,
        tipo: classificacao.tipo,
        categoria: classificacao.categoria,
        subcategoria: classificacao.subcategoria,
        valor,
        data,
        origem: limparTexto(req.body.origem, 40) || movimentacoes[indice].origem || 'manual',
        conta: limparTexto(req.body.conta, 80),
        contraparte: limparTexto(req.body.contraparte, 100),
        centroCusto: limparTexto(req.body.centroCusto, 80),
        natureza: limparTexto(req.body.natureza, 40),
        statusClassificacao: 'confirmada',
        confianca: 100,
        classificacaoAutomatica: false,
        atualizadoEm: new Date().toISOString()
    }
    salvarJson(arquivos.movimentacoes, movimentacoes)
    if (req.body.aprenderRegra) salvarRegraAprendida(req.usuarioId, movimentacoes[indice])
    registrarAuditoria(req.usuarioId, 'EDITOU', 'movimentacao', {
        id: movimentacoes[indice].id,
        anterior: { categoria: anterior.categoria, subcategoria: anterior.subcategoria, valor: anterior.valor },
        novo: { categoria: movimentacoes[indice].categoria, subcategoria: movimentacoes[indice].subcategoria, valor }
    })
    res.json({ mensagem: 'Movimentação atualizada e classificação confirmada.', movimentacao: movimentacoes[indice] })
})

app.delete('/api/movimentacoes/:id', verificarToken, (req, res) => {
    const movimentacoes = lerJson(arquivos.movimentacoes)
    const encontrada = movimentacoes.find((item) => String(item.id) === String(req.params.id) && String(item.usuarioId) === String(req.usuarioId))
    if (!encontrada) return res.status(404).json({ mensagem: 'Movimentação não encontrada.' })
    salvarJson(arquivos.movimentacoes, movimentacoes.filter((item) => item !== encontrada))
    registrarAuditoria(req.usuarioId, 'EXCLUIU', 'movimentacao', { id: encontrada.id, descricao: encontrada.descricao })
    res.json({ mensagem: 'Movimentação excluída.' })
})

app.get('/api/dashboard', verificarToken, (req, res) => {
    res.json(resumoDashboard(req.usuarioId, filtrosDaRequisicao(req)))
})

app.post('/api/classificar-lote', verificarToken, (req, res) => {
    const linhas = Array.isArray(req.body.linhas) ? req.body.linhas.slice(0, 1500) : []
    if (!linhas.length) return res.status(400).json({ mensagem: 'Nenhuma linha válida foi enviada.' })

    const clienteId = limparTexto(req.body.clienteId, 40)
    const origemPadrao = limparTexto(req.body.origem, 40) || 'arquivo_csv'
    const classificadas = linhas.map((item, indice) => {
        const classificacao = classificarMovimentacao(req.usuarioId, { ...item, clienteId })
        return {
            indice,
            descricao: limparTexto(item.descricao, 160),
            tipo: classificacao.tipo,
            categoria: classificacao.categoria,
            subcategoria: classificacao.subcategoria,
            valor: numero(item.valor),
            data: limparTexto(item.data, 10),
            origem: limparTexto(item.origem, 40) || origemPadrao,
            conta: limparTexto(item.conta, 80),
            contraparte: limparTexto(item.contraparte, 100),
            centroCusto: limparTexto(item.centroCusto, 80),
            natureza: limparTexto(item.natureza, 40),
            clienteId,
            statusClassificacao: classificacao.statusClassificacao,
            confianca: classificacao.confianca,
            classificacaoAutomatica: classificacao.classificacaoAutomatica,
            termoRegra: classificacao.termoRegra
        }
    }).filter((item) => item.descricao && Number.isFinite(item.valor) && item.valor > 0 && item.data)

    const resumo = {
        total: classificadas.length,
        confirmadas: classificadas.filter((item) => item.statusClassificacao === 'confirmada').length,
        sugeridas: classificadas.filter((item) => item.statusClassificacao === 'sugerida').length,
        revisar: classificadas.filter((item) => item.statusClassificacao === 'revisar').length,
        naoIdentificadas: classificadas.filter((item) => item.statusClassificacao === 'nao_identificada').length
    }
    res.json({ linhas: classificadas, resumo })
})

app.post(['/api/importar-lote', '/api/importar-csv'], verificarToken, (req, res) => {
    const linhas = Array.isArray(req.body.linhas) ? req.body.linhas.slice(0, 1500) : []
    if (!linhas.length) return res.status(400).json({ mensagem: 'Nenhuma linha válida foi enviada.' })

    const movimentacoes = lerJson(arquivos.movimentacoes)
    const loteId = `IMP-${Date.now()}`
    let importadas = 0
    let regrasAprendidas = 0

    linhas.forEach((item, indice) => {
        const descricao = limparTexto(item.descricao, 160)
        const valor = numero(item.valor)
        const data = limparTexto(item.data, 10)
        if (!descricao || !Number.isFinite(valor) || valor <= 0 || !data) return

        const classificacao = classificarMovimentacao(req.usuarioId, item)
        const movimento = {
            id: Date.now() + indice + Math.floor(Math.random() * 1000),
            usuarioId: req.usuarioId,
            clienteId: limparTexto(item.clienteId || req.body.clienteId, 40),
            descricao,
            tipo: limparTexto(item.tipo, 30).toLowerCase() || classificacao.tipo,
            categoria: limparTexto(item.categoria, 60) || classificacao.categoria,
            subcategoria: limparTexto(item.subcategoria, 60) || classificacao.subcategoria,
            valor,
            data,
            origem: limparTexto(item.origem || req.body.origem, 40) || 'arquivo_csv',
            conta: limparTexto(item.conta, 80),
            contraparte: limparTexto(item.contraparte, 100),
            centroCusto: limparTexto(item.centroCusto, 80),
            natureza: limparTexto(item.natureza, 40),
            classificacaoAutomatica: Boolean(item.classificacaoAutomatica ?? classificacao.classificacaoAutomatica),
            statusClassificacao: limparTexto(item.statusClassificacao, 30) || classificacao.statusClassificacao,
            confianca: Number(item.confianca ?? classificacao.confianca),
            importacaoLote: loteId,
            criadoEm: new Date().toISOString()
        }
        movimentacoes.push(movimento)
        if (item.aprenderRegra) {
            salvarRegraAprendida(req.usuarioId, movimento)
            regrasAprendidas += 1
        }
        importadas += 1
    })

    salvarJson(arquivos.movimentacoes, movimentacoes)
    registrarAuditoria(req.usuarioId, 'IMPORTOU_ARQUIVO', 'movimentacao', { quantidade: importadas, loteId, regrasAprendidas })
    res.json({ mensagem: `${importadas} movimentações importadas.`, quantidade: importadas, loteId, regrasAprendidas })
})

app.get('/api/regras', verificarToken, exigirRecurso('regras_automaticas'), (req, res) => {
    const clienteId = limparTexto(req.query.clienteId, 40)
    res.json(regrasDoUsuario(req.usuarioId, clienteId))
})

app.post('/api/regras', verificarToken, exigirRecurso('regras_automaticas'), (req, res) => {
    const regra = salvarRegraAprendida(req.usuarioId, req.body)
    if (!regra) return res.status(400).json({ mensagem: 'Informe termo, tipo e categoria.' })
    registrarAuditoria(req.usuarioId, 'CRIOU_REGRA', 'regra', { id: regra.id, termo: regra.termo })
    res.status(201).json({ mensagem: 'Regra inteligente salva.', regra })
})

app.put('/api/regras/:id', verificarToken, exigirRecurso('regras_automaticas'), (req, res) => {
    const regras = lerJson(arquivos.regras)
    const indice = regras.findIndex((item) => String(item.id) === String(req.params.id) && String(item.usuarioId) === String(req.usuarioId))
    if (indice < 0) return res.status(404).json({ mensagem: 'Regra personalizada não encontrada.' })
    regras[indice] = {
        ...regras[indice],
        termo: limparTexto(req.body.termo, 80) || regras[indice].termo,
        tipo: limparTexto(req.body.tipo, 30).toLowerCase() || regras[indice].tipo,
        categoria: limparTexto(req.body.categoria, 60) || regras[indice].categoria,
        subcategoria: limparTexto(req.body.subcategoria, 60),
        clienteId: limparTexto(req.body.clienteId, 40),
        ativa: req.body.ativa !== false,
        atualizadaEm: new Date().toISOString()
    }
    salvarJson(arquivos.regras, regras)
    registrarAuditoria(req.usuarioId, 'EDITOU_REGRA', 'regra', { id: regras[indice].id })
    res.json({ mensagem: 'Regra atualizada.', regra: regras[indice] })
})

app.delete('/api/regras/:id', verificarToken, exigirRecurso('regras_automaticas'), (req, res) => {
    const regras = lerJson(arquivos.regras)
    const encontrada = regras.find((item) => String(item.id) === String(req.params.id) && String(item.usuarioId) === String(req.usuarioId))
    if (!encontrada) return res.status(404).json({ mensagem: 'Regra personalizada não encontrada.' })
    salvarJson(arquivos.regras, regras.filter((item) => item !== encontrada))
    registrarAuditoria(req.usuarioId, 'EXCLUIU_REGRA', 'regra', { id: encontrada.id, termo: encontrada.termo })
    res.json({ mensagem: 'Regra excluída.' })
})

app.get('/api/auditoria', verificarToken, exigirRecurso('auditoria'), (req, res) => {
    const registros = lerJson(arquivos.auditoria)
        .filter((item) => String(item.usuarioId) === String(req.usuarioId))
        .slice(0, 300)
    res.json(registros)
})

app.post('/api/demo/carregar', verificarToken, (req, res) => {
    const existentes = lerJson(arquivos.movimentacoes).filter((item) => String(item.usuarioId) === String(req.usuarioId))
    if (existentes.length >= 10) return res.json({ mensagem: 'A conta já possui dados suficientes para a demonstração.' })

    const clientes = lerJson(arquivos.clientes)
    let cliente = clientes.find((item) => String(item.usuarioId) === String(req.usuarioId))
    if (!cliente) {
        cliente = { id: Date.now(), usuarioId: req.usuarioId, nome: 'Perfil Demonstração', perfilFinanceiro: 'pj', segmento: 'Empresa de serviços', status: 'Ativo', modoVisual: 'barras', criadoEm: new Date().toISOString() }
        clientes.push(cliente)
        salvarJson(arquivos.clientes, clientes)
    }

    const modelos = [
        ['Mensalidade clientes', 'receita', 'Receita', 'Serviços prestados', 5200, 'conta_bancaria', 'Clientes', 'Comercial'],
        ['PIX consultoria', 'receita', 'Receita', 'Consultoria', 1800, 'conta_bancaria', 'Cliente Alfa', 'Comercial'],
        ['Mercado Central', 'pagamento', 'Alimentação', 'Supermercado', 380, 'cartao_credito', 'Mercado Central', 'Administrativo'],
        ['Posto Shell', 'pagamento', 'Transporte', 'Combustível', 290, 'cartao_credito', 'Shell', 'Operações'],
        ['Conta de luz Enel', 'pagamento', 'Moradia', 'Energia', 430, 'conta_bancaria', 'Enel', 'Administrativo'],
        ['Internet empresarial', 'pagamento', 'Moradia', 'Internet', 180, 'conta_bancaria', 'Operadora', 'Tecnologia'],
        ['Software de gestão', 'pagamento', 'Tecnologia', 'SaaS', 260, 'cartao_credito', 'Software Cloud', 'Tecnologia']
    ]
    const movimentacoes = lerJson(arquivos.movimentacoes)
    const hoje = new Date()
    for (let atraso = 5; atraso >= 0; atraso -= 1) {
        const dataMes = new Date(hoje.getFullYear(), hoje.getMonth() - atraso, 1)
        modelos.forEach((modelo, indice) => {
            const dia = String(Math.min(26, 3 + indice * 3)).padStart(2, '0')
            const data = `${dataMes.getFullYear()}-${String(dataMes.getMonth() + 1).padStart(2, '0')}-${dia}`
            const variacao = 1 + ((5 - atraso) * 0.025) + ((indice % 3) * 0.01)
            movimentacoes.push({
                id: Date.now() + atraso * 100 + indice,
                usuarioId: req.usuarioId,
                clienteId: cliente.id,
                descricao: modelo[0], tipo: modelo[1], categoria: modelo[2], subcategoria: modelo[3],
                valor: Math.round(modelo[4] * variacao * 100) / 100,
                data, origem: modelo[5], contraparte: modelo[6], centroCusto: modelo[7],
                natureza: modelo[1] === 'receita' ? 'receita' : 'despesa',
                classificacaoAutomatica: true, statusClassificacao: 'confirmada', confianca: 96,
                criadoEm: new Date().toISOString()
            })
        })
    }
    salvarJson(arquivos.movimentacoes, movimentacoes)

    const mesAtual = new Date().toISOString().slice(0, 7)
    const saldos = lerJson(arquivos.saldos)
    if (!saldos.some((item) => String(item.usuarioId) === String(req.usuarioId) && String(item.clienteId) === String(cliente.id) && item.mes === mesAtual)) {
        saldos.push({ id: Date.now() + 900, usuarioId: req.usuarioId, clienteId: cliente.id, mes: mesAtual, valor: 3200, atualizadoEm: new Date().toISOString() })
        salvarJson(arquivos.saldos, saldos)
    }

    registrarAuditoria(req.usuarioId, 'CARREGOU_DEMONSTRACAO', 'sistema', { clienteId: cliente.id })
    res.json({ mensagem: 'Dados demonstrativos carregados.', clienteId: cliente.id })
})

app.listen(porta, () => {
    console.log(`Syncrypta 4.0.2 disponível em http://localhost:${porta}`)
})
