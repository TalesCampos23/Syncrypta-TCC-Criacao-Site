const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const pasta = __dirname
const salvar = (nome, dados) => fs.writeFileSync(path.join(pasta, nome), JSON.stringify(dados, null, 2), 'utf8')

function dataMes(atraso, dia) {
    const hoje = new Date()
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - atraso, dia)
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

async function executar() {
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
        }
    ]

    const clientes = [
        { id: 920001, usuarioId: 900001, nome: 'Alfa Consultoria', perfilFinanceiro: 'pj', segmento: 'Serviços profissionais', status: 'Ativo', modoVisual: 'barras', criadoEm: new Date().toISOString() },
        { id: 920002, usuarioId: 900001, nome: 'Profissional Autônomo Demo', perfilFinanceiro: 'pf', segmento: 'Trabalho por aplicativo', status: 'Ativo', modoVisual: 'rosca', criadoEm: new Date().toISOString() },
        { id: 920003, usuarioId: 900001, nome: 'Studio Horizonte', perfilFinanceiro: 'pj', segmento: 'MEI criativo', status: 'Ativo', modoVisual: 'linhas', criadoEm: new Date().toISOString() },
        { id: 920101, usuarioId: 900002, nome: 'Meu fluxo pessoal', perfilFinanceiro: 'pf', segmento: 'Pessoa física', status: 'Ativo', modoVisual: 'rosca', criadoEm: new Date().toISOString() }
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

    const mesAtual = new Date().toISOString().slice(0, 7)
    const mesPassado = (() => {
        const data = new Date(); data.setMonth(data.getMonth() - 1)
        return data.toISOString().slice(0, 7)
    })()
    const saldos = [
        { id: 950001, usuarioId: 900001, clienteId: 920001, mes: mesAtual, valor: 7400, atualizadoEm: new Date().toISOString() },
        { id: 950002, usuarioId: 900001, clienteId: 920001, mes: mesPassado, valor: 6800, atualizadoEm: new Date().toISOString() },
        { id: 950003, usuarioId: 900001, clienteId: 920002, mes: mesAtual, valor: 900, atualizadoEm: new Date().toISOString() }
    ]

    salvar('usuarios.json', usuarios)
    salvar('clientes.json', clientes)
    salvar('regras.json', regras)
    salvar('movimentacoes.json', movimentacoes)
    salvar('saldos.json', saldos)
    salvar('pagamentos.json', [])
    salvar('auditoria.json', [
        { id: 960001, usuarioId: 900001, acao: 'SEED_DEMO', entidade: 'sistema', detalhes: { versao: '4.0' }, dataHora: new Date().toISOString() }
    ])

    console.log('Dados de demonstração Syncrypta 4.0 criados.')
    console.log('Cliente TCC: thais.demo@syncrypta.local / Syncrypta@2026')
    console.log('Usuário comum: demo@syncrypta.local / Demo@2026')
}

executar().catch((erro) => {
    console.error(erro)
    process.exit(1)
})
