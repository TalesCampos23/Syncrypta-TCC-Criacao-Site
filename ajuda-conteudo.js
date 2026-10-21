// ==========================================================
// CONTEÚDO DA AJUDA · Syncrypta 4.9
// Uma lista só de perguntas e respostas. A página ajuda.html mostra todas e o assistente
// (helperbot.js) procura nelas pelas palavras-chave. Mudou uma resposta aqui, muda nos dois.
// - id: vira o endereço da pergunta (ex.: ajuda.html#pix-pessoal), útil para links nos Stories;
// - palavras: termos que o assistente usa para achar a resposta;
// - stories: true quando a pergunta veio da caixinha de dúvidas dos Stories da campanha.
// ==========================================================

const AJUDA_GRUPOS = [
    { id: 'comecar', titulo: 'Primeiros passos', icone: 'sparkles' },
    { id: 'importar', titulo: 'Importar extrato', icone: 'upload' },
    { id: 'pfpj', titulo: 'PF, PJ e dólar', icone: 'briefcase' },
    { id: 'caixa', titulo: 'Seu caixa', icone: 'chart' },
    { id: 'conta', titulo: 'Planos e segurança', icone: 'shield' }
]

const AJUDA_PERGUNTAS = [
    {
        id: 'como-comecar', grupo: 'comecar',
        pergunta: 'Como começo a usar a Syncrypta?',
        resposta: 'Crie sua conta grátis: ela começa no plano Básico, sem nenhum dado. Depois você tem dois caminhos: importar o extrato do banco em <b>Importar e revisar</b> ou lançar entradas e saídas à mão em <b>Movimentações</b>. Pronto: a <b>Visão geral</b> já mostra quanto entrou, quanto saiu e quanto sobrou no mês.',
        palavras: ['comecar', 'comeco', 'primeiro passo', 'primeiros passos', 'iniciar', 'como usar', 'por onde', 'novo', 'nova conta', 'criar conta', 'cadastro'],
        links: [{ texto: 'Criar conta grátis', href: 'cadastro.html' }, { texto: 'Rever o tour', href: 'dashboard.html?tour=1' }]
    },
    {
        id: 'demonstracao', grupo: 'comecar',
        pergunta: 'Posso testar sem criar conta?',
        resposta: 'Pode. Na tela de login, use <b>Acessar demonstração</b>. Você entra numa conta de visita com dados fictícios, só para olhar: nada é salvo e nenhuma cobrança é feita.',
        palavras: ['testar', 'teste', 'demonstracao', 'demo', 'sem conta', 'visita', 'experimentar'],
        links: [{ texto: 'Ir para o login', href: 'login.html' }]
    },
    {
        id: 'planos', grupo: 'comecar',
        pergunta: 'O que muda entre os planos?',
        resposta: '<b>Básico (grátis):</b> visão geral, movimentações, importação em CSV com revisão antes de salvar, exportação em CSV, gráficos e notificações. <b>Profissional (R$ 49,90/mês):</b> tudo do Básico, mais importação de Excel e OFX, regras inteligentes, perfis financeiros, previsão de caixa e relatórios avançados. <b>Empresarial (R$ 99,90/mês):</b> tudo do Profissional, mais auditoria, vários usuários e integrações. Neste projeto o pagamento é simulado: nenhuma cobrança real acontece.',
        palavras: ['plano', 'planos', 'preco', 'precos', 'valor do plano', 'quanto custa', 'basico', 'profissional', 'empresarial', 'gratis', 'assinatura'],
        links: [{ texto: 'Ver planos', href: 'index.html#planos' }]
    },
    {
        id: 'importar-extrato', grupo: 'importar',
        pergunta: 'Como importo meu extrato do banco?',
        resposta: 'No app do banco, baixe o extrato em <b>CSV</b> (no Profissional também vale Excel e OFX). Na Syncrypta, abra <b>Importar e revisar</b> e escolha o arquivo. A Syncrypta sugere uma categoria para cada linha; você confere e confirma. Quer treinar antes? Use o arquivo de teste.',
        palavras: ['importar', 'importacao', 'extrato', 'csv', 'ofx', 'excel', 'xlsx', 'planilha', 'arquivo', 'banco', 'subir'],
        links: [{ texto: 'Importar e revisar', href: 'importacao.html' }, { texto: 'Baixar extrato de teste', href: 'arquivos_teste/extrato_teste.csv' }]
    },
    {
        id: 'sem-csv', grupo: 'importar',
        pergunta: 'Meu banco não exporta CSV. E agora?',
        resposta: 'Você tem três saídas: baixar em OFX ou Excel (aceitos no plano Profissional), montar o arquivo no modelo CSV da Syncrypta (botão na página de importação) ou lançar as movimentações à mão.',
        palavras: ['nao exporta', 'nao tem csv', 'sem csv', 'modelo', 'formato', 'outro formato'],
        links: [{ texto: 'Importar e revisar', href: 'importacao.html' }, { texto: 'Lançar à mão', href: 'movimentacoes.html' }]
    },
    {
        id: 'corrigir-categoria', grupo: 'importar',
        pergunta: 'A categoria veio errada. Como corrijo?',
        resposta: 'Na revisão da importação, troque a categoria antes de confirmar. Depois de salvo, abra a movimentação e edite. A Syncrypta aprende com as correções: elas viram <b>regras inteligentes</b> (plano Profissional) e as próximas importações já vêm certas.',
        palavras: ['errada', 'errou', 'corrigir', 'categoria', 'classificacao', 'classificar', 'regra', 'regras', 'aprender'],
        links: [{ texto: 'Regras inteligentes', href: 'regras.html' }]
    },
    {
        id: 'pix-pessoal', grupo: 'pfpj', stories: true,
        pergunta: 'Posso receber pelo meu Pix pessoal?',
        resposta: 'Pode, mas aí o dinheiro da empresa e o seu ficam misturados e fica difícil saber quanto o negócio realmente ganhou. O ideal é ter uma conta só da empresa. Na Syncrypta, dá para criar um perfil PF e outro PJ (plano Profissional) e lançar cada movimento no perfil certo, assim você vê os dois separados. Para dúvidas sobre impostos, fale com um contador.',
        palavras: ['pix pessoal', 'pix', 'conta pessoal', 'receber', 'misturar', 'misturado', 'mistura'],
        links: [{ texto: 'Lançar uma movimentação', href: 'movimentacoes.html' }]
    },
    {
        id: 'separar-pf-pj', grupo: 'pfpj', stories: true,
        pergunta: 'Como separo PF e PJ na Syncrypta?',
        resposta: 'Na Syncrypta, PF e PJ ficam em <b>perfis financeiros</b> separados (plano Profissional), por exemplo "Minha vida pessoal" (PF) e "Minha empresa" (PJ). Cada movimentação entra no perfil certo, e nos perfis PJ aparecem campos a mais, como quem pagou ou recebeu e o centro de custo. Aí cada perfil tem o seu próprio painel.',
        palavras: ['pf', 'pj', 'pessoa fisica', 'pessoa juridica', 'separar', 'separo', 'mei', 'empresa', 'perfil financeiro', 'perfis'],
        links: [{ texto: 'Perfis financeiros', href: 'clientes.html' }]
    },
    {
        id: 'dolar', grupo: 'pfpj',
        pergunta: 'Recebo em dólar. Como registro?',
        resposta: 'Ao lançar, escolha a moeda <b>USD</b>. Use <b>Buscar PTAX</b> para pegar a cotação oficial do Banco Central daquele dia ou digite a cotação à mão. A Syncrypta guarda o valor em dólar e soma o valor convertido em reais nos totais.',
        palavras: ['dolar', 'usd', 'exterior', 'cotacao', 'ptax', 'cambio', 'moeda', 'estrangeiro', 'gringo'],
        links: [{ texto: 'Movimentações', href: 'movimentacoes.html' }]
    },
    {
        id: 'quanto-sobrou', grupo: 'caixa',
        pergunta: 'Onde vejo quanto sobrou no mês?',
        resposta: 'Na <b>Visão geral</b>: ela mostra o saldo inicial, quanto entrou, quanto saiu e o saldo final do mês, com gráficos e um calendário. Se você estiver logado, também pode perguntar aqui no assistente: "quanto sobrou este mês?".',
        palavras: ['sobrou', 'saldo', 'resultado', 'lucro', 'quanto ganhei', 'quanto gastei', 'visao geral', 'dashboard', 'painel'],
        links: [{ texto: 'Visão geral', href: 'dashboard.html' }]
    },
    {
        id: 'previsao', grupo: 'caixa',
        pergunta: 'O que é a previsão de caixa?',
        resposta: 'É uma projeção dos próximos três meses feita a partir do seu histórico. Ela ajuda a se planejar, mas é uma estimativa: não é uma agenda de contas a vencer.',
        palavras: ['previsao', 'projecao', 'futuro', 'proximos meses', 'planejar'],
        links: [{ texto: 'Visão geral', href: 'dashboard.html' }]
    },
    {
        id: 'buscar-cnpj', grupo: 'caixa',
        pergunta: 'Para que serve a busca por CNPJ?',
        resposta: 'Com só o CNPJ, a Syncrypta busca o nome, a atividade, a cidade e a situação da empresa na base pública da Receita Federal (pela BrasilAPI). Serve para preencher um perfil financeiro ou o campo "quem recebeu ou pagou" sem digitar tudo. O CNPJ não fica salvo e dados de sócios não são trazidos. Aqui no assistente, é só mandar os 14 números.',
        palavras: ['cnpj', 'consultar empresa', 'buscar empresa', 'receita federal', 'brasilapi', 'razao social', 'fornecedor'],
        links: [{ texto: 'Perfis financeiros', href: 'clientes.html' }]
    },
    {
        id: 'contador', grupo: 'conta', stories: true,
        pergunta: 'A Syncrypta substitui meu contador?',
        resposta: 'Não. A Syncrypta organiza o caixa e gera relatórios que você pode levar ao contador. Impostos, emissão de notas fiscais e declarações continuam com ele. Dúvidas fiscais mais específicas, como as que chegam nos Stories, a gente indica um contador parceiro.',
        palavras: ['contador', 'contabilidade', 'imposto', 'impostos', 'nota fiscal', 'notas', 'declaracao', 'fiscal', 'das', 'irpf'],
        links: [{ texto: 'Relatórios mensais', href: 'relatorios.html' }]
    },
    {
        id: 'seguranca', grupo: 'conta',
        pergunta: 'Meus dados estão seguros?',
        resposta: 'A senha é guardada com criptografia (bcrypt), o acesso usa um token que expira (JWT) e há limite de tentativas de login. Os perfis financeiros não guardam CPF, CNPJ nem telefone. Vale lembrar: esta é a versão de TCC, com dados em arquivos no servidor. Para uso real com dinheiro de verdade, ela precisaria de um banco de dados com backup.',
        palavras: ['seguro', 'seguranca', 'dados', 'senha', 'privacidade', 'lgpd', 'vazar', 'proteger'],
        links: []
    },
    {
        id: 'configuracoes', grupo: 'conta',
        pergunta: 'Dá para deixar a Syncrypta do meu jeito?',
        resposta: 'Dá. Em <b>Configurações</b> (no menu lateral ou clicando no seu nome) você aumenta o tamanho do texto, deixa as telas mais compactas, escolhe a cor de destaque, reduz as animações, decide qual página abre depois do login e esconde o balão do assistente. Lá também dá para trocar o nome que aparece e a senha. As preferências ficam salvas na sua conta.',
        palavras: ['configuracao', 'configuracoes', 'personalizar', 'preferencia', 'letra', 'fonte', 'tamanho', 'cor', 'tema', 'senha', 'trocar senha', 'mudar nome', 'compacto', 'animacao'],
        links: [{ texto: 'Abrir Configurações', href: 'configuracoes.html' }]
    },
    {
        id: 'trocar-plano', grupo: 'conta',
        pergunta: 'Como troco de plano?',
        resposta: 'Clique no seu nome no canto superior direito e escolha <b>Ver e trocar plano</b>. Neste projeto o pagamento é simulado: nenhuma cobrança real acontece.',
        palavras: ['trocar plano', 'mudar plano', 'upgrade', 'assinar', 'pagamento', 'pagar', 'cobranca', 'cancelar'],
        links: []
    }
]

// ==========================================================
// PÁGINA AJUDA (ajuda.html): monta a lista, a busca e os atalhos dos Stories
// ==========================================================
function normalizarAjuda(texto) {
    return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function linksAjudaHtml(links = []) {
    return links.length ? `<div class="ajuda-links">${links.map((link) => `<a class="button button-ghost" href="${link.href}">${escaparHtml(link.texto)}</a>`).join('')}</div>` : ''
}

function renderizarPaginaAjuda() {
    const lista = document.getElementById('ajudaLista')
    if (!lista) return

    // Logado: troca "Entrar / Começar agora" por um atalho para o painel.
    if (pegarToken()) {
        const acoes = document.getElementById('ajudaAcoesTopo')
        if (acoes) acoes.innerHTML = '<a class="button button-primary" href="dashboard.html">Ir para o painel</a>'
    }

    document.getElementById('ajudaGrupos').innerHTML = AJUDA_GRUPOS.map((grupo) => `<a class="ajuda-grupo-chip" href="#grupo-${grupo.id}">${svgIcon(grupo.icone)}<span>${grupo.titulo}</span></a>`).join('')

    document.getElementById('ajudaStories').innerHTML = AJUDA_PERGUNTAS.filter((item) => item.stories).map((item) => `
        <a class="story-card" href="#${item.id}" data-abrir="${item.id}">
            <span class="story-card-tag">Pergunta dos Stories</span>
            <strong>${escaparHtml(item.pergunta)}</strong>
            <span class="story-card-ver">Ver resposta →</span>
        </a>`).join('')

    lista.innerHTML = AJUDA_GRUPOS.map((grupo) => {
        const perguntas = AJUDA_PERGUNTAS.filter((item) => item.grupo === grupo.id)
        return `<div class="ajuda-grupo" id="grupo-${grupo.id}">
            <h2>${svgIcon(grupo.icone)}<span>${grupo.titulo}</span></h2>
            ${perguntas.map((item) => `
                <details class="ajuda-item" id="${item.id}" data-busca="${escaparHtml(normalizarAjuda(`${item.pergunta} ${item.resposta} ${item.palavras.join(' ')}`))}">
                    <summary>${escaparHtml(item.pergunta)}${item.stories ? '<span class="ajuda-tag">Stories</span>' : ''}</summary>
                    <div class="ajuda-resposta"><p>${item.resposta}</p>${linksAjudaHtml(item.links)}</div>
                </details>`).join('')}
        </div>`
    }).join('')

    // Endereço com #pergunta (ex.: vindo de um link nos Stories): abre e mostra a resposta.
    const abrirPeloEndereco = () => {
        const alvo = document.getElementById(decodeURIComponent(location.hash.slice(1)))
        if (alvo?.classList.contains('ajuda-item')) {
            alvo.open = true
            alvo.classList.add('ajuda-destaque')
            setTimeout(() => alvo.classList.remove('ajuda-destaque'), 2200)
            alvo.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }
    window.addEventListener('hashchange', abrirPeloEndereco)
    abrirPeloEndereco()

    // Busca: esconde as perguntas que não têm a palavra digitada.
    document.getElementById('ajudaBusca').addEventListener('input', (evento) => {
        const termo = normalizarAjuda(evento.target.value).trim()
        let encontradas = 0
        document.querySelectorAll('.ajuda-item').forEach((item) => {
            const mostra = !termo || item.dataset.busca.includes(termo)
            item.hidden = !mostra
            if (mostra) encontradas++
            if (termo && mostra) item.open = true
        })
        document.querySelectorAll('.ajuda-grupo').forEach((grupo) => { grupo.hidden = !grupo.querySelector('.ajuda-item:not([hidden])') })
        document.getElementById('ajudaVazio').hidden = encontradas > 0
    })
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.dataset.page === 'ajuda') renderizarPaginaAjuda()
})
