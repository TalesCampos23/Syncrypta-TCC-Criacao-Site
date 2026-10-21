const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const pasta = __dirname
const salvar = (nome, dados) => fs.writeFileSync(path.join(pasta, nome), JSON.stringify(dados, null, 2), 'utf8')

function dataMes(atraso, dia) {
    const hoje = new Date()
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - atraso, dia)
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

// 4.14: a montagem dos dados fictícios virou uma função, para o conta-exemplo.js reaproveitar
// só a parte da Thaís sem apagar os dados existentes.
async function montarDadosDemo() {
    const usuarios = [
        {
            id: 900001,
            nome: 'Thais Calca',
            email: 'thais.demo@syncrypta.local',
            senha: await bcrypt.hash('Syncrypta@2026', 10),
            perfil: 'cliente_tcc',
            plano: 'empresarial',
            acessoTotal: true,
            pagamentoStatus: 'isento',
            criadoEm: new Date().toISOString()
        },
        {
            id: 900002,
            nome: 'Usuário Demonstração',
            email: 'demo@syncrypta.local',
            senha: await bcrypt.hash('Demo@2026', 10),
            perfil: 'usuario',
            plano: 'basico',
            acessoTotal: false,
            pagamentoStatus: 'gratuito',
            criadoEm: new Date().toISOString()
        },
        {
            id: 900099, nome: 'Visita Syncrypta', email: 'visita-demo@syncrypta.local',
            senha: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
            perfil: 'demonstracao', plano: 'basico', acessoTotal: false,
            pagamentoStatus: 'visita', criadoEm: new Date().toISOString()
        }
    ]

    const clientes = [
        { id: 920001, usuarioId: 900001, nome: 'Alfa Consultoria', perfilFinanceiro: 'pj', segmento: 'Serviços profissionais', status: 'Ativo', modoVisual: 'barras', criadoEm: new Date().toISOString() },
        { id: 920002, usuarioId: 900001, nome: 'Profissional Autônomo Demo', perfilFinanceiro: 'pf', segmento: 'Trabalho por aplicativo', status: 'Ativo', modoVisual: 'rosca', criadoEm: new Date().toISOString() },
        { id: 920003, usuarioId: 900001, nome: 'Studio Horizonte', perfilFinanceiro: 'pj', segmento: 'MEI criativo', status: 'Ativo', modoVisual: 'linhas', criadoEm: new Date().toISOString() },
        { id: 920101, usuarioId: 900002, nome: 'Meu fluxo pessoal', perfilFinanceiro: 'pf', segmento: 'Pessoa física', status: 'Ativo', modoVisual: 'rosca', criadoEm: new Date().toISOString() },
        { id: 920901, usuarioId: 900099, nome: 'Rotina pessoal (exemplo)', perfilFinanceiro: 'pf', segmento: 'Pessoa física fictícia', status: 'Ativo', modoVisual: 'rosca', criadoEm: new Date().toISOString() },
        { id: 920902, usuarioId: 900099, nome: 'Loja Luar (exemplo)', perfilFinanceiro: 'pj', segmento: 'Comércio fictício', status: 'Ativo', modoVisual: 'barras', criadoEm: new Date().toISOString() }
    ]

    const regras = [
        { id: 930001, usuarioId: 900001, clienteId: 920001, termo: 'shell', categoria: 'Transporte', subcategoria: 'Combustível', tipo: 'pagamento', confianca: 99, ativa: true },
        { id: 930002, usuarioId: 900001, clienteId: 920001, termo: 'mercado', categoria: 'Alimentação', subcategoria: 'Supermercado', tipo: 'pagamento', confianca: 99, ativa: true },
        { id: 930003, usuarioId: 900001, clienteId: 920001, termo: 'mensalidade', categoria: 'Receita', subcategoria: 'Serviços prestados', tipo: 'receita', confianca: 99, ativa: true },
        { id: 930004, usuarioId: 900001, clienteId: 920002, termo: 'uber repasse', categoria: 'Receita', subcategoria: 'Trabalho por aplicativo', tipo: 'receita', confianca: 99, ativa: true }
    ]

    const modelosEmpresa = [
        ['Mensalidade Cliente Alfa', 'receita', 'Receita', 'Serviços prestados', 4400, 'conta_bancaria', 'Cliente Alfa', 'Comercial', 'Conta principal', 'receita'],
        ['Mensalidade Cliente Beta', 'receita', 'Receita', 'Serviços prestados', 2900, 'conta_bancaria', 'Cliente Beta', 'Comercial', 'Conta principal', 'receita'],
        ['Mercado Central', 'pagamento', 'Alimentação', 'Supermercado', 420, 'cartao_credito', 'Mercado Central', 'Administrativo', 'Cartão corporativo', 'despesa'],
        ['Posto Shell', 'pagamento', 'Transporte', 'Combustível', 350, 'cartao_credito', 'Shell', 'Operações', 'Cartão corporativo', 'custo'],
        ['Conta de luz Enel', 'pagamento', 'Moradia', 'Energia', 510, 'conta_bancaria', 'Enel', 'Administrativo', 'Conta principal', 'despesa'],
        ['Internet empresarial', 'pagamento', 'Moradia', 'Internet', 210, 'conta_bancaria', 'Operadora Demo', 'Tecnologia', 'Conta principal', 'despesa'],
        ['Licença software', 'pagamento', 'Tecnologia', 'SaaS', 330, 'cartao_credito', 'Cloud Software', 'Tecnologia', 'Cartão corporativo', 'despesa'],
        ['DAS MEI', 'pagamento', 'Impostos', 'Tributos', 80, 'conta_bancaria', 'Governo', 'Fiscal', 'Conta principal', 'despesa']
    ]

    const modelosPessoa = [
        ['Uber repasse semanal', 'receita', 'Receita', 'Trabalho por aplicativo', 2850, 'conta_bancaria', 'Aplicativo', '', 'Conta pessoal', 'receita'],
        ['Aluguel apartamento', 'pagamento', 'Moradia', 'Aluguel', 1250, 'conta_bancaria', 'Imobiliária', '', 'Conta pessoal', 'despesa'],
        ['Conta de luz', 'pagamento', 'Moradia', 'Energia', 165, 'conta_bancaria', 'Enel', '', 'Conta pessoal', 'despesa'],
        ['Mercado do bairro', 'pagamento', 'Alimentação', 'Supermercado', 620, 'cartao_credito', 'Mercado', '', 'Cartão pessoal', 'despesa'],
        ['Posto Shell', 'pagamento', 'Transporte', 'Combustível', 780, 'cartao_credito', 'Shell', '', 'Cartão pessoal', 'custo'],
        ['Plano de celular', 'pagamento', 'Serviços', 'Telefonia', 75, 'cartao_credito', 'Operadora', '', 'Cartão pessoal', 'despesa']
    ]

    const movimentacoes = []
    let id = 940000
    for (let atraso = 7; atraso >= 0; atraso -= 1) {
        modelosEmpresa.forEach((modelo, indice) => {
            const variacao = 1 + (7 - atraso) * 0.018 + (indice % 2) * 0.012
            movimentacoes.push({
                id: ++id, usuarioId: 900001, clienteId: 920001,
                descricao: modelo[0], tipo: modelo[1], categoria: modelo[2], subcategoria: modelo[3],
                valor: Math.round(modelo[4] * variacao * 100) / 100, data: dataMes(atraso, Math.min(26, 3 + indice * 3)),
                origem: modelo[5], contraparte: modelo[6], centroCusto: modelo[7], conta: modelo[8], natureza: modelo[9],
                classificacaoAutomatica: true, statusClassificacao: indice === 6 && atraso === 0 ? 'revisar' : 'confirmada',
                confianca: indice === 6 && atraso === 0 ? 78 : 97, criadoEm: new Date().toISOString()
            })
        })
        modelosPessoa.forEach((modelo, indice) => {
            const variacao = 1 + (7 - atraso) * 0.012 + (indice % 3) * 0.008
            movimentacoes.push({
                id: ++id, usuarioId: 900001, clienteId: 920002,
                descricao: modelo[0], tipo: modelo[1], categoria: modelo[2], subcategoria: modelo[3],
                valor: Math.round(modelo[4] * variacao * 100) / 100, data: dataMes(atraso, Math.min(26, 4 + indice * 4)),
                origem: modelo[5], contraparte: modelo[6], centroCusto: modelo[7], conta: modelo[8], natureza: modelo[9],
                classificacaoAutomatica: true, statusClassificacao: 'confirmada', confianca: 96, criadoEm: new Date().toISOString()
            })
        })
    }

    const exemplos = [
        [920901, 'Salário mensal', 'receita', 'Receita', 'Salário', 3700, 'conta_bancaria'],
        [920901, 'Supermercado Horizonte', 'pagamento', 'Alimentação', 'Mercado', 610, 'cartao_credito'],
        [920901, 'Aluguel residencial', 'pagamento', 'Moradia', 'Aluguel', 1180, 'conta_bancaria'],
        [920901, 'Transporte urbano', 'pagamento', 'Transporte', 'Deslocamento', 260, 'cartao_credito'],
        [920902, 'Pedidos da Loja Luar', 'receita', 'Vendas', 'Loja física', 6800, 'conta_bancaria'],
        [920902, 'Vendas pelo aplicativo', 'receita', 'Vendas', 'Delivery', 2450, 'conta_bancaria'],
        [920902, 'Reposição de estoque', 'pagamento', 'Fornecedores', 'Estoque', 2850, 'conta_bancaria'],
        [920902, 'Taxa da plataforma', 'pagamento', 'Operação', 'Aplicativo', 520, 'cartao_credito'],
        [920902, 'Aluguel comercial', 'pagamento', 'Estrutura', 'Ponto comercial', 1350, 'conta_bancaria'],
        [920902, 'Campanha local', 'pagamento', 'Marketing', 'Publicidade', 420, 'cartao_credito']
    ]
    for (let atraso = 7; atraso >= 0; atraso -= 1) {
        exemplos.forEach(([clienteId, descricao, tipo, categoria, subcategoria, base, origem], indice) => {
            movimentacoes.push({
                id: ++id, usuarioId: 900099, clienteId, descricao, tipo, categoria, subcategoria,
                valor: Math.round(base * (1 + (7 - atraso) * 0.012 + indice % 3 * 0.009) * 100) / 100,
                data: dataMes(atraso, Math.min(26, 2 + indice * 2)), origem,
                contraparte: 'Exemplo fictício', conta: clienteId === 920902 ? 'Conta da Loja Luar' : 'Conta pessoal',
                natureza: tipo === 'receita' ? 'receita' : 'despesa',
                statusClassificacao: 'confirmada', confianca: 98, classificacaoAutomatica: true,
                criadoEm: new Date().toISOString()
            })
        })
    }

    const mesAtual = new Date().toISOString().slice(0, 7)
    const mesPassado = (() => {
        const data = new Date(); data.setMonth(data.getMonth() - 1)
        return data.toISOString().slice(0, 7)
    })()
    const saldos = [
        { id: 950001, usuarioId: 900001, clienteId: 920001, mes: mesAtual, valor: 7400, atualizadoEm: new Date().toISOString() },
        { id: 950002, usuarioId: 900001, clienteId: 920001, mes: mesPassado, valor: 6800, atualizadoEm: new Date().toISOString() },
        { id: 950003, usuarioId: 900001, clienteId: 920002, mes: mesAtual, valor: 900, atualizadoEm: new Date().toISOString() },
        { id: 950901, usuarioId: 900099, clienteId: 920901, mes: mesAtual, valor: 1250, atualizadoEm: new Date().toISOString() },
        { id: 950902, usuarioId: 900099, clienteId: 920902, mes: mesAtual, valor: 5600, atualizadoEm: new Date().toISOString() }
    ]

    // 4.12: histórico fictício de ações para a tela de Auditoria não abrir vazia na demonstração.
    const horasAtras = (horas) => new Date(Date.now() - horas * 3600000).toISOString()
    const trilha = (usuarioId, base, perfil, extra = {}) => [
        { id: base + 1, usuarioId, acao: 'EXPORTOU_RELATORIO', entidade: 'relatorio', detalhes: { formato: 'excel', mes: mesAtual, linhas: 38, ...extra }, dataHora: horasAtras(2) },
        { id: base + 2, usuarioId, acao: 'RECLASSIFICOU_LOTE', entidade: 'movimentacao', detalhes: { quantidade: 3, categoria: 'Transporte', subcategoria: 'Combustível', ...extra }, dataHora: horasAtras(5) },
        { id: base + 3, usuarioId, acao: 'IMPORTOU_ARQUIVO', entidade: 'movimentacao', detalhes: { quantidade: 24, regrasAprendidas: 2, ...extra }, dataHora: horasAtras(26) },
        { id: base + 4, usuarioId, acao: 'CRIOU_REGRA', entidade: 'regra', detalhes: { termo: 'posto', ...extra }, dataHora: horasAtras(27) },
        { id: base + 5, usuarioId, acao: 'EDITOU', entidade: 'movimentacao', detalhes: { descricao: 'Mercado Central', ...extra }, dataHora: horasAtras(50) },
        { id: base + 6, usuarioId, acao: 'DEFINIU_SALDO_INICIAL', entidade: 'saldo', detalhes: { mes: mesAtual, valor: 7400, ...extra }, dataHora: horasAtras(74) },
        { id: base + 7, usuarioId, acao: 'EXCLUIU', entidade: 'movimentacao', detalhes: { descricao: 'Lançamento duplicado', ...extra }, dataHora: horasAtras(98) },
        { id: base + 8, usuarioId, acao: 'CRIOU', entidade: 'perfil_financeiro', detalhes: { nome: perfil, ...extra }, dataHora: horasAtras(122) },
        { id: base + 9, usuarioId, acao: 'EXPORTOU_RELATORIO', entidade: 'relatorio', detalhes: { formato: 'csv', mes: mesPassado, linhas: 41, ...extra }, dataHora: horasAtras(146) },
        { id: base + 10, usuarioId, acao: 'SEED_DEMO', entidade: 'sistema', detalhes: { versao: '4.12', ...extra }, dataHora: horasAtras(170) }
    ]
    const auditoria = [
        ...trilha(900001, 960000, 'Alfa Consultoria'),
        ...trilha(900099, 960900, 'Loja Luar (exemplo)', { exemplo: true })
    ].sort((a, b) => b.dataHora.localeCompare(a.dataHora))

    return { usuarios, clientes, regras, movimentacoes, saldos, pagamentos: [], auditoria }
}

// npm run seed: APAGA os dados atuais e grava só os fictícios (use numa cópia de demonstração).
async function executar() {
    const dados = await montarDadosDemo()
    for (const [nome, lista] of Object.entries(dados)) salvar(`${nome}.json`, lista)
    console.log('Dados de demonstração Syncrypta criados.')
    console.log('Cliente TCC: thais.demo@syncrypta.local / Syncrypta@2026')
    console.log('Usuário comum: demo@syncrypta.local / Demo@2026')
    console.log('Visita fictícia: escolha um plano na tela de login.')
}

if (require.main === module) {
    executar().catch((erro) => {
        console.error(erro)
        process.exit(1)
    })
}

module.exports = { montarDadosDemo }
