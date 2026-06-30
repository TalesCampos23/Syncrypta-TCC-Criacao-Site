const API_URL = 'http://127.0.0.1:3000'

const estado = {
    conta: null,
    plano: null,
    movimentacoes: [],
    clientes: [],
    regras: [],
    auditoria: [],
    importLinhas: [],
    importResumo: {},
    contexto: { clienteId: '', mes: new Date().toISOString().slice(0, 7), origem: '' },
    idMovimentacaoEditando: null,
    idClienteEditando: null,
    idRegraEditando: null,
    graficos: {},
    notificacoes: []
}

const icones = {
    dashboard: '<path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"/>',
    wallet: '<path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10H5a3 3 0 0 1-3-3V7"/><path d="M16 14h2"/>',
    upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16v4H4v-4"/>',
    chart: '<path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrowUp: '<path d="m18 15-6-6-6 6"/>',
    arrowDown: '<path d="m6 9 6 6 6-6"/>',
    balance: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-7"/>',
    health: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/><path d="M3.5 12h4l1.5-3 3 6 1.5-3h7"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/>',
    filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    pix: '<path d="m12 2 4 4-4 4-4-4 4-4ZM6 8l4 4-4 4-4-4 4-4Zm12 0 4 4-4 4-4-4 4-4Zm-6 6 4 4-4 4-4-4 4-4Z"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    sparkles: '<path d="m12 3-1.3 3.7L7 8l3.7 1.3L12 13l1.3-3.7L17 8l-3.7-1.3L12 3Z"/><path d="m5 14-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8L5 14ZM19 13l-.8 2.2L16 16l2.2.8L19 19l.8-2.2L22 16l-2.2-.8L19 13Z"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    building: '<path d="M3 21h18M6 21V4h9v17M15 9h3v12M9 8h2M9 12h2M9 16h2"/>',
    receipt: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    bank: '<path d="m3 10 9-6 9 6"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18"/>',
    rules: '<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="14" r="3"/><path d="M18 11v-1M18 18v-1M15.4 12.5l-.9-.5M21.5 16l-.9-.5M15.4 15.5l-.9.5M21.5 12l-.9.5"/>',
    table: '<path d="M3 5h18v14H3zM3 10h18M8 5v14M14 5v14"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'
}

function svgIcon(nome, classe = '') {
    const conteudo = icones[nome] || icones.info
    return `<svg class="ui-icon ${classe}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${conteudo}</svg>`
}

function renderizarIcones() {
    document.querySelectorAll('[data-icon]').forEach((elemento) => {
        elemento.innerHTML = svgIcon(elemento.dataset.icon)
    })
}

function pegarToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token')
}

function pegarUsuarioLocal() {
    try {
        const usuarioSalvo = localStorage.getItem('usuario') || sessionStorage.getItem('usuario')
        return JSON.parse(usuarioSalvo) || null
    } catch (erro) {
        return null
    }
}

function salvarSessao(dados) {
    const usuario = JSON.stringify(dados.usuario)
    localStorage.setItem('token', dados.token)
    localStorage.setItem('usuario', usuario)
    sessionStorage.setItem('token', dados.token)
    sessionStorage.setItem('usuario', usuario)
}

function limparSessao() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')
}

function navegarPara(pagina, substituir = true) {
    const destino = new URL(pagina, window.location.href).href
    if (substituir) window.location.replace(destino)
    else window.location.assign(destino)
}

async function apiRequest(caminho, opcoes = {}) {
    const headers = { ...(opcoes.headers || {}) }
    const token = pegarToken()

    if (token) headers.Authorization = `Bearer ${token}`
    if (opcoes.body && !(opcoes.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
    }

    try {
        const resposta = await fetch(API_URL + caminho, { ...opcoes, headers })
        let dados = {}

        try {
            dados = await resposta.json()
        } catch (erro) {
            dados = { mensagem: 'Resposta inválida do servidor.' }
        }

        if (resposta.status === 401 && !['/api/login', '/api/cadastro'].includes(caminho)) {
            limparSessao()
            mostrarToast('Sua sessão expirou. Entre novamente.', 'erro')
            if (document.body.dataset.page !== 'login') {
                setTimeout(() => navegarPara('login.html'), 800)
            }
        }

        return { resposta, dados }
    } catch (erro) {
        mostrarToast('Não foi possível conectar ao backend. Confirme se o servidor está ligado.', 'erro')
        return { resposta: { ok: false, status: 0 }, dados: { mensagem: 'Servidor indisponível.' } }
    }
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(data) {
    if (!data) return '—'
    const partes = String(data).slice(0, 10).split('-')
    if (partes.length !== 3) return data
    return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function formatarDataHora(data) {
    if (!data) return '—'
    return new Date(data).toLocaleString('pt-BR')
}

function escaparHtml(texto) {
    return String(texto ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}

function gerarSigla(nome) {
    const partes = String(nome || 'Usuário').trim().split(/\s+/).filter(Boolean)
    if (!partes.length) return 'US'
    if (partes.length === 1) return (partes[0][0] + partes[0].slice(-1)).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function mostrarToast(mensagem, tipo = 'sucesso') {
    let container = document.getElementById('toastContainer')

    if (!container) {
        container = document.createElement('div')
        container.id = 'toastContainer'
        container.className = 'toast-container'
        document.body.appendChild(container)
    }

    const toast = document.createElement('div')
    toast.className = `toast toast-${tipo}`
    const icone = tipo === 'erro' ? 'close' : tipo === 'aviso' ? 'info' : 'check'
    toast.innerHTML = `${svgIcon(icone)}<span>${escaparHtml(mensagem)}</span>`
    container.appendChild(toast)

    requestAnimationFrame(() => toast.classList.add('toast-visivel'))
    setTimeout(() => {
        toast.classList.remove('toast-visivel')
        setTimeout(() => toast.remove(), 250)
    }, 3400)
}

function abrirModal({ titulo, conteudo, largura = '760px' }) {
    fecharModalGeral()
    const modal = document.createElement('div')
    modal.id = 'modalGeral'
    modal.className = 'modal-overlay'
    modal.innerHTML = `
        <div class="modal-shell" style="--modal-width:${largura}">
            <div class="modal-header">
                <div>
                    <span class="eyebrow">Syncrypta</span>
                    <h2>${titulo}</h2>
                </div>
                <button class="icon-button" type="button" onclick="fecharModalGeral()" aria-label="Fechar">${svgIcon('close')}</button>
            </div>
            <div class="modal-body">${conteudo}</div>
        </div>
    `
    modal.addEventListener('click', (evento) => {
        if (evento.target === modal) fecharModalGeral()
    })
    document.body.appendChild(modal)
    document.body.classList.add('modal-aberto')
}

function fecharModalGeral() {
    document.getElementById('modalGeral')?.remove()
    document.body.classList.remove('modal-aberto')
}

function confirmarAcao(mensagem, titulo = 'Confirmar ação') {
    return new Promise((resolver) => {
        const modal = document.createElement('div')
        modal.className = 'modal-overlay'
        modal.id = 'modalConfirmacao'
        modal.innerHTML = `
            <div class="modal-shell modal-confirmacao">
                <div class="confirm-icon">${svgIcon('info')}</div>
                <h2>${escaparHtml(titulo)}</h2>
                <p>${escaparHtml(mensagem)}</p>
                <div class="modal-actions">
                    <button class="button button-ghost" data-confirmar="nao">Cancelar</button>
                    <button class="button button-danger" data-confirmar="sim">Confirmar</button>
                </div>
            </div>
        `

        const finalizar = (valor) => {
            modal.remove()
            document.body.classList.remove('modal-aberto')
            resolver(valor)
        }

        modal.querySelector('[data-confirmar="nao"]').onclick = () => finalizar(false)
        modal.querySelector('[data-confirmar="sim"]').onclick = () => finalizar(true)
        modal.onclick = (evento) => { if (evento.target === modal) finalizar(false) }
        document.body.appendChild(modal)
        document.body.classList.add('modal-aberto')
    })
}

function setCarregando(botao, carregando, texto = 'Processando...') {
    if (!botao) return
    if (carregando) {
        botao.dataset.textoOriginal = botao.innerHTML
        botao.disabled = true
        botao.innerHTML = `<span class="spinner"></span>${texto}`
    } else {
        botao.disabled = false
        botao.innerHTML = botao.dataset.textoOriginal || botao.innerHTML
    }
}

function alternarTema() {
    const escuro = document.documentElement.classList.toggle('tema-escuro')
    localStorage.setItem('temaSyncrypta', escuro ? 'escuro' : 'claro')
    atualizarIconeTema()
}

function atualizarIconeTema() {
    const botao = document.getElementById('themeToggle')
    if (!botao) return
    const escuro = document.documentElement.classList.contains('tema-escuro')
    botao.innerHTML = svgIcon(escuro ? 'sun' : 'moon')
    botao.title = escuro ? 'Usar tema claro' : 'Usar tema escuro'
}

function iniciarTema() {
    if (localStorage.getItem('temaSyncrypta') === 'escuro') {
        document.documentElement.classList.add('tema-escuro')
    }
    atualizarIconeTema()
}

function alternarSidebar() {
    document.body.classList.toggle('sidebar-aberta')
}

function sair() {
    limparSessao()
    navegarPara('index.html')
}

async function carregarConta() {
    const { resposta, dados } = await apiRequest('/api/minha-conta')
    if (!resposta.ok) return null

    estado.conta = dados.usuario
    estado.plano = dados.plano
    localStorage.setItem('usuario', JSON.stringify(dados.usuario))
    atualizarInterfaceConta()
    aplicarPermissoesPlano()
    return dados
}

function atualizarInterfaceConta() {
    const conta = estado.conta || pegarUsuarioLocal()
    if (!conta) return

    document.querySelectorAll('[data-user-name]').forEach((elemento) => elemento.textContent = conta.nome)
    document.querySelectorAll('[data-user-email]').forEach((elemento) => elemento.textContent = conta.email)
    document.querySelectorAll('[data-user-initials]').forEach((elemento) => elemento.textContent = gerarSigla(conta.nome))
    document.querySelectorAll('[data-plan-name]').forEach((elemento) => {
        elemento.textContent = estado.plano?.nome || conta.plano || 'Básico'
    })

    const demoBadge = document.getElementById('demoBadge')
    if (demoBadge) {
        const demo = ['cliente_tcc', 'administrador'].includes(conta.perfil)
        demoBadge.hidden = !demo
    }
}

function aplicarPermissoesPlano() {
    const recursos = estado.plano?.recursos || []
    const perfilDemo = ['cliente_tcc', 'administrador'].includes(estado.conta?.perfil)

    document.querySelectorAll('[data-recurso]').forEach((elemento) => {
        const recurso = elemento.dataset.recurso
        const permitido = recursos.includes(recurso)
        elemento.classList.toggle('recurso-bloqueado', !permitido)
        elemento.dataset.permitido = permitido ? 'true' : 'false'

        if (!permitido && !elemento.dataset.lockBound) {
            elemento.dataset.lockBound = 'true'
            elemento.addEventListener('click', (evento) => {
                if (elemento.dataset.permitido === 'false') {
                    evento.preventDefault()
                    abrirPlanos()
                    mostrarToast('Recurso disponível em um plano superior.', 'aviso')
                }
            })
        }
    })

    const recursoPagina = document.body.dataset.recursoPagina
    if (recursoPagina && !recursos.includes(recursoPagina)) {
        const conteudo = document.querySelector('.page-content')
        if (conteudo) {
            conteudo.innerHTML = `
                <section class="upgrade-state">
                    <div class="upgrade-illustration">${svgIcon('lock')}</div>
                    <span class="eyebrow">Recurso premium</span>
                    <h1>Desbloqueie esta área da Syncrypta</h1>
                    <p>Este módulo faz parte dos planos Profissional ou Empresarial. Compare os planos para liberar a experiência completa.</p>
                    <button class="button button-primary" onclick="abrirPlanos()">${svgIcon('sparkles')} Ver planos</button>
                    ${perfilDemo ? '<p class="helper-text">Sua conta de demonstração pode alternar o plano sem cobrança.</p>' : ''}
                </section>
            `
        }
    }
}

async function protegerPagina() {
    if (!pegarToken()) {
        navegarPara('login.html')
        return false
    }

    const contaCarregada = await carregarConta()
    if (!contaCarregada) {
        limparSessao()
        navegarPara('login.html?erro=sessao')
        return false
    }

    await atualizarNotificacoes()
    return true
}

function planoCardHtml(plano) {
    const recursos = {
        basico: ['Dashboard e movimentações', 'Importação e exportação CSV', 'Gráficos essenciais'],
        profissional: ['Tudo do Básico', 'CSV, Excel, OFX e revisão', 'Perfis, projeção e regras inteligentes'],
        empresarial: ['Tudo do Profissional', 'Centros de custo e auditoria', 'Integrações e suporte prioritário']
    }
    const destaque = plano.id === 'profissional'

    return `
        <article class="pricing-card ${destaque ? 'pricing-featured' : ''}">
            ${destaque ? '<span class="pricing-ribbon">Mais escolhido</span>' : ''}
            <div class="pricing-heading">
                <span class="pricing-kicker">Syncrypta</span>
                <h3>${plano.nome}</h3>
                <p>${plano.destaque}</p>
            </div>
            <div class="pricing-price">
                <strong>${plano.preco === 0 ? 'Grátis' : formatarMoeda(plano.preco)}</strong>
                ${plano.preco === 0 ? '' : '<span>/mês</span>'}
            </div>
            <ul class="pricing-list">
                ${recursos[plano.id].map((item) => `<li>${svgIcon('check')} ${item}</li>`).join('')}
            </ul>
            <button class="button ${destaque ? 'button-light' : 'button-secondary'} button-full" onclick="selecionarPlano('${plano.id}')">
                ${estado.conta?.plano === plano.id ? 'Plano atual' : 'Escolher ' + plano.nome}
            </button>
        </article>
    `
}

async function abrirPlanos() {
    let planos = []
    const { resposta, dados } = await apiRequest('/api/planos')
    if (resposta.ok) planos = dados
    if (!planos.length) return

    abrirModal({
        titulo: 'Escolha a experiência ideal',
        largura: '1040px',
        conteudo: `
            <p class="modal-intro">Alterne a interface e os recursos conforme o plano. Pagamentos nesta versão são apenas demonstrativos.</p>
            <div class="pricing-grid">${planos.map(planoCardHtml).join('')}</div>
        `
    })
}

async function selecionarPlano(planoId) {
    if (estado.conta?.plano === planoId) {
        mostrarToast('Este já é o seu plano atual.', 'aviso')
        return
    }

    const modoDemo = ['cliente_tcc', 'administrador'].includes(estado.conta?.perfil)

    if (modoDemo) {
        const { resposta, dados } = await apiRequest('/api/alternar-plano-demo', {
            method: 'PUT',
            body: JSON.stringify({ plano: planoId })
        })

        if (resposta.ok) {
            fecharModalGeral()
            mostrarToast(dados.mensagem)
            await carregarConta()
            setTimeout(() => window.location.reload(), 450)
        } else {
            mostrarToast(dados.mensagem, 'erro')
        }
        return
    }

    localStorage.setItem('planoSelecionado', planoId)
    window.location.href = `checkout.html?plano=${encodeURIComponent(planoId)}`
}

function mesAtual() {
    return new Date().toISOString().slice(0, 7)
}

function formatarMes(mes) {
    if (!/^\d{4}-\d{2}$/.test(String(mes || ''))) return 'Período atual'
    const [ano, numero] = mes.split('-').map(Number)
    return new Date(ano, numero - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function montarQuery(filtros = {}) {
    const params = new URLSearchParams()
    Object.entries(filtros).forEach(([chave, valor]) => {
        if (valor !== undefined && valor !== null && String(valor) !== '') params.set(chave, valor)
    })
    const texto = params.toString()
    return texto ? `?${texto}` : ''
}

function origemLabel(origem) {
    return ({
        conta_bancaria: 'Conta bancária',
        cartao_credito: 'Cartão de crédito',
        manual: 'Cadastro manual',
        arquivo_csv: 'Arquivo CSV',
        arquivo_excel: 'Planilha Excel',
        arquivo_ofx: 'Arquivo OFX',
        demonstracao: 'Demonstração'
    })[origem] || origem || 'Não informada'
}

function statusClassificacaoBadge(status, confianca = 0) {
    const mapa = {
        confirmada: ['Confirmada', 'success'],
        sugerida: ['Sugerida', 'info'],
        revisar: ['Revisar', 'warning'],
        nao_identificada: ['Não identificada', 'danger']
    }
    const [texto, classe] = mapa[status] || ['Pendente', 'neutral']
    return `<span class="classification-badge classification-${classe}">${texto}${confianca ? ` · ${Math.round(confianca)}%` : ''}</span>`
}

async function carregarPerfisFinanceiros() {
    if (!(estado.plano?.recursos || []).includes('clientes') && !estado.conta?.acessoTotal) {
        estado.clientes = []
        preencherSelectsDePerfil()
        return []
    }
    const { resposta, dados } = await apiRequest('/api/clientes')
    estado.clientes = resposta.ok && Array.isArray(dados) ? dados : []
    preencherSelectsDePerfil()
    return estado.clientes
}

function preencherSelectsDePerfil() {
    const ids = ['contextCliente', 'relatorioCliente', 'movCliente', 'filtroCliente', 'importCliente', 'regraCliente', 'filtroRegraCliente']
    ids.forEach((id) => {
        const select = document.getElementById(id)
        if (!select) return
        const atual = select.value || estado.contexto.clienteId || ''
        const geral = id.startsWith('filtro') || id.startsWith('context') || id.startsWith('relatorio')
        select.innerHTML = `${geral ? '<option value="">Todos os perfis</option>' : '<option value="">Sem perfil específico</option>'}${estado.clientes.map((cliente) => `<option value="${cliente.id}">${escaparHtml(cliente.nome)} · ${cliente.perfilFinanceiro === 'pj' ? 'PJ' : 'PF'}</option>`).join('')}`
        if ([...select.options].some((opcao) => String(opcao.value) === String(atual))) select.value = atual
    })
}

function perfilSelecionado(idSelect) {
    const valor = document.getElementById(idSelect)?.value || ''
    return estado.clientes.find((cliente) => String(cliente.id) === String(valor)) || null
}

function contextoDosControles(prefixo = 'context') {
    return {
        clienteId: document.getElementById(`${prefixo}Cliente`)?.value || '',
        mes: document.getElementById(`${prefixo}Mes`)?.value || '',
        origem: document.getElementById(`${prefixo}Origem`)?.value || ''
    }
}

function configurarControlesContexto(prefixo, callback) {
    const mes = document.getElementById(`${prefixo}Mes`)
    if (mes && !mes.value) mes.value = localStorage.getItem(`syncrypta_${prefixo}_mes`) || mesAtual()
    const cliente = document.getElementById(`${prefixo}Cliente`)
    const origem = document.getElementById(`${prefixo}Origem`)
    ;[cliente, mes, origem].filter(Boolean).forEach((campo) => {
        campo.addEventListener('change', async () => {
            localStorage.setItem(`syncrypta_${prefixo}_${campo.id.endsWith('Mes') ? 'mes' : campo.id.endsWith('Cliente') ? 'cliente' : 'origem'}`, campo.value)
            await callback()
        })
    })
}

async function atualizarNotificacoes(dadosRecebidos = null) {
    const contador = document.getElementById('contadorNotificacoes')
    const resumo = document.getElementById('resumoNotificacoes')
    if (!contador && !resumo) return

    let dados = dadosRecebidos
    if (!dados) {
        const filtros = estado.contexto || {}
        const retorno = await apiRequest('/api/dashboard' + montarQuery(filtros))
        if (!retorno.resposta.ok) return
        dados = retorno.dados
    }

    const notificacoes = []
    const perfil = dados.contexto?.perfilFinanceiro || 'geral'

    if (!dados.movimentacoes.length) {
        notificacoes.push({ tipo: 'info', titulo: 'Comece pelo extrato', texto: 'Importe um CSV, Excel ou OFX para gerar o fluxo de caixa.' })
    }

    const pendentes = (dados.revisao?.revisar || 0) + (dados.revisao?.naoIdentificadas || 0)
    if (pendentes > 0) {
        notificacoes.push({ tipo: 'aviso', titulo: 'Classificações pendentes', texto: `${pendentes} movimentações precisam de revisão.` })
    }

    if (dados.descasamento === 'Crítico') {
        notificacoes.push({ tipo: 'erro', titulo: 'Descasamento crítico', texto: 'O saldo final está negativo no período selecionado.' })
    } else if (dados.descasamento === 'Atenção') {
        notificacoes.push({ tipo: 'aviso', titulo: 'Atenção ao caixa', texto: 'Os pagamentos já consomem mais de 80% dos recebimentos.' })
    }

    if (perfil === 'pf' && dados.projecao?.proximosMeses?.length) {
        const proximo = dados.projecao.proximosMeses[0]
        notificacoes.push({
            tipo: proximo.saldo >= 0 ? 'sucesso' : 'aviso',
            titulo: 'Visibilidade pessoal',
            texto: proximo.saldo >= 0
                ? `Mantendo o histórico, o próximo mês pode fechar em ${formatarMoeda(proximo.saldo)}.`
                : `Para cobrir as contas projetadas, faltariam ${formatarMoeda(Math.abs(proximo.saldo))}.`
        })
    }

    if (perfil === 'pj') {
        const maiorCentro = Object.entries(dados.centrosCusto || {}).sort((a, b) => b[1] - a[1])[0]
        if (maiorCentro) notificacoes.push({ tipo: 'info', titulo: 'Centro de custo em destaque', texto: `${maiorCentro[0]} concentra ${formatarMoeda(maiorCentro[1])}.` })
    }

    if (dados.foraDoPadrao?.length) {
        notificacoes.push({ tipo: 'aviso', titulo: 'Gasto fora do padrão', texto: `${dados.foraDoPadrao[0].descricao} ficou acima da média do período.` })
    }

    if (estado.plano?.id === 'basico') {
        notificacoes.push({ tipo: 'premium', titulo: 'Análise avançada disponível', texto: 'O plano Profissional libera regras, projeções e perfis financeiros.' })
    }

    if (estado.conta?.perfil === 'cliente_tcc') {
        notificacoes.push({ tipo: 'demo', titulo: 'Modo cliente TCC', texto: 'Você pode alternar entre os planos sem cobrança.' })
    }

    estado.notificacoes = notificacoes
    if (contador) contador.textContent = notificacoes.length
    if (resumo) resumo.textContent = notificacoes.length ? `${notificacoes.length} atualizações` : 'Tudo em dia'
}

function abrirNotificacoes() {
    const itens = estado.notificacoes.length
        ? estado.notificacoes.map((item) => `<div class="notification-item notification-${item.tipo}"><div class="notification-icon">${svgIcon(item.tipo === 'premium' ? 'sparkles' : item.tipo === 'erro' ? 'info' : 'bell')}</div><div><strong>${escaparHtml(item.titulo)}</strong><p>${escaparHtml(item.texto)}</p></div></div>`).join('')
        : '<div class="empty-compact">Nenhuma notificação no momento.</div>'
    abrirModal({ titulo: 'Central de notificações', largura: '580px', conteudo: `<div class="notification-list">${itens}</div>` })
}

function preencherAcessoDemo(tipo) {
    const email = document.getElementById('emailLogin')
    const senha = document.getElementById('senhaLogin')
    if (!email || !senha) return
    if (tipo === 'cliente') {
        email.value = 'thais.demo@syncrypta.local'
        senha.value = 'Syncrypta@2026'
    } else {
        email.value = 'demo@syncrypta.local'
        senha.value = 'Demo@2026'
    }
    mostrarToast('Credenciais demonstrativas preenchidas.')
}

async function iniciarLogin() {
    const formulario = document.getElementById('formLogin')
    if (!formulario || formulario.dataset.loginInicializado === 'true') return

    // Recupera uma sessão válida quando o navegador ficou no login após
    // uma atualização ou carregou um arquivo JavaScript antigo do cache.
    if (pegarToken()) {
        const verificacao = await apiRequest('/api/minha-conta')
        if (verificacao.resposta.ok) {
            navegarPara('dashboard.html?v=4.0.2')
            return
        }
        limparSessao()
    }
    formulario.dataset.loginInicializado = 'true'
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault()
        const botao = formulario.querySelector('button[type="submit"]')
        setCarregando(botao, true, 'Entrando...')
        const { resposta, dados } = await apiRequest('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email: document.getElementById('emailLogin').value.trim(), senha: document.getElementById('senhaLogin').value })
        })
        if (resposta.ok) {
            try {
                salvarSessao(dados)

                // Confirma a sessão antes de trocar de página. Assim, qualquer
                // problema de token aparece no login em vez de criar um ciclo.
                const verificacao = await apiRequest('/api/minha-conta')
                if (!verificacao.resposta.ok) {
                    limparSessao()
                    mostrarToast(verificacao.dados.mensagem || 'Não foi possível validar a sessão.', 'erro')
                    setCarregando(botao, false)
                    return
                }

                mostrarToast('Acesso liberado. Preparando seu painel...')
                navegarPara('dashboard.html?v=4.0.2')
            } catch (erro) {
                console.error('Falha ao concluir o login:', erro)
                limparSessao()
                mostrarToast('O login foi aceito, mas o navegador não conseguiu salvar a sessão.', 'erro')
                setCarregando(botao, false)
            }
        } else {
            mostrarToast(dados.mensagem, 'erro')
            setCarregando(botao, false)
        }
    })
}

function iniciarCadastro() {
    const formulario = document.getElementById('formCadastro')
    if (!formulario) return
    const senha = document.getElementById('senhaCadastro')
    const barra = document.getElementById('passwordStrengthBar')
    senha?.addEventListener('input', () => {
        const valor = senha.value
        const nivel = Math.min(100, valor.length * 9 + (/[A-Z]/.test(valor) ? 15 : 0) + (/\d/.test(valor) ? 15 : 0) + (/[^A-Za-z0-9]/.test(valor) ? 15 : 0))
        if (barra) barra.style.width = `${nivel}%`
    })
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault()
        const botao = formulario.querySelector('button[type="submit"]')
        setCarregando(botao, true, 'Criando conta...')
        const { resposta, dados } = await apiRequest('/api/cadastro', {
            method: 'POST',
            body: JSON.stringify({ nome: document.getElementById('nomeCadastro').value.trim(), email: document.getElementById('emailCadastro').value.trim(), senha: senha.value })
        })
        if (resposta.ok) {
            mostrarToast('Conta criada. Agora faça seu login.')
            setTimeout(() => window.location.href = 'login.html', 450)
        } else {
            mostrarToast(dados.mensagem, 'erro')
            setCarregando(botao, false)
        }
    })
}

async function carregarDashboard() {
    const filtros = contextoDosControles('context')
    estado.contexto = filtros
    const { resposta, dados } = await apiRequest('/api/dashboard' + montarQuery(filtros))
    if (!resposta.ok) return

    const ids = {
        saldoInicial: dados.saldoInicial,
        totalRecebido: dados.totalRecebido,
        totalPago: dados.totalPago,
        saldoFinal: dados.saldoFinal
    }
    Object.entries(ids).forEach(([id, valor]) => {
        const elemento = document.getElementById(id)
        if (elemento) elemento.textContent = formatarMoeda(valor)
    })
    document.getElementById('saudeFinanceira').textContent = `${dados.saudeFinanceira}%`
    const progresso = document.getElementById('healthProgress')
    if (progresso) progresso.style.setProperty('--progress', `${dados.saudeFinanceira}%`)
    document.getElementById('projecaoSaldo').textContent = formatarMoeda(dados.projecao.saldoProjetado)
    document.getElementById('projecaoTexto').textContent = dados.contexto.perfilFinanceiro === 'pf'
        ? 'A projeção mostra quanto pode sobrar ou faltar para cobrir as próximas contas.'
        : 'A projeção combina histórico, despesas recorrentes e tendência mensal.'

    const badge = document.getElementById('descasamentoBadge')
    badge.className = `status-badge status-${dados.descasamento.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '-')}`
    badge.textContent = dados.descasamento
    const variacao = Number(dados.comparacao?.variacaoSaldo || 0)
    document.getElementById('comparacaoMes').textContent = dados.comparacao?.mesAnterior
        ? `${variacao >= 0 ? '▲' : '▼'} ${Math.abs(variacao).toFixed(1)}% em relação a ${formatarMes(dados.comparacao.mesAnterior)}.`
        : 'Sem comparação disponível.'

    document.getElementById('reviewConfirmadas').textContent = dados.revisao.confirmadas
    document.getElementById('reviewSugeridas').textContent = dados.revisao.sugeridas
    document.getElementById('reviewPendentes').textContent = dados.revisao.revisar + dados.revisao.naoIdentificadas

    const inputSaldo = document.getElementById('saldoInicialInput')
    if (inputSaldo && document.activeElement !== inputSaldo) inputSaldo.value = Number(dados.saldoInicial || 0).toFixed(2)

    const tabela = document.getElementById('tabelaUltimas')
    tabela.innerHTML = dados.ultimasMovimentacoes.length
        ? dados.ultimasMovimentacoes.map((item) => `<tr><td><div class="table-main"><span class="table-icon">${svgIcon(item.tipo === 'receita' ? 'arrowUp' : 'arrowDown')}</span><div><strong>${escaparHtml(item.descricao)}</strong><small>${escaparHtml(item.contraparte || 'Sem contraparte')}</small></div></div></td><td><strong>${escaparHtml(item.categoria)}</strong><small class="table-subline">${escaparHtml(item.subcategoria || 'A classificar')}</small></td><td>${origemLabel(item.origem)}</td><td class="${item.tipo === 'receita' ? 'value-positive' : 'value-negative'}">${item.tipo === 'receita' ? '+' : '−'} ${formatarMoeda(item.valor)}</td><td>${formatarData(item.data)}</td><td>${statusClassificacaoBadge(item.statusClassificacao, item.confianca)}</td></tr>`).join('')
        : linhaVazia(6, 'Nenhuma movimentação no contexto selecionado.')

    renderizarProjecao(dados.projecao)
    renderizarOutliers(dados.foraDoPadrao, 'outlierList')
    criarGraficosDashboard(dados)
    await atualizarNotificacoes(dados)
}

function renderizarProjecao(projecao) {
    const linha = document.getElementById('projectionTimeline')
    if (linha) {
        linha.innerHTML = projecao?.proximosMeses?.length
            ? projecao.proximosMeses.map((item) => `<article class="projection-month"><span>${formatarMes(item.mes)}</span><strong class="${item.saldo >= 0 ? 'value-positive' : 'value-negative'}">${formatarMoeda(item.saldo)}</strong><small>Receitas ${formatarMoeda(item.recebimentos)} · Pagamentos ${formatarMoeda(item.pagamentos)}</small></article>`).join('')
            : '<div class="empty-compact">Histórico insuficiente para projeção.</div>'
    }
    const recorrentes = document.getElementById('recurringList')
    if (recorrentes) {
        recorrentes.innerHTML = projecao?.recorrentes?.length
            ? `<h4>Despesas recorrentes identificadas</h4>${projecao.recorrentes.map((item) => `<div class="recurring-item"><span>${escaparHtml(item.descricao)}</span><strong>${formatarMoeda(item.media)}</strong></div>`).join('')}`
            : ''
    }
}

function renderizarOutliers(itens, alvoId) {
    const alvo = document.getElementById(alvoId)
    if (!alvo) return
    alvo.innerHTML = itens?.length
        ? itens.map((item) => `<div class="notification-item notification-aviso"><div class="notification-icon">${svgIcon('trend')}</div><div><strong>${escaparHtml(item.descricao)}</strong><p>${formatarMoeda(item.valor)} · ${escaparHtml(item.categoria)} / ${escaparHtml(item.subcategoria || 'A classificar')}</p></div></div>`).join('')
        : '<div class="empty-compact">Nenhum gasto fora do padrão foi detectado.</div>'
}

function criarGraficosDashboard(dados) {
    if (!window.Chart) return
    Object.values(estado.graficos).forEach((grafico) => grafico?.destroy?.())
    estado.graficos = {}

    const tipoFluxo = document.getElementById('chartTypeSelector')?.value || localStorage.getItem('syncrypta_chart_fluxo') || 'bar'
    const tipoCategoria = document.getElementById('categoryChartType')?.value || localStorage.getItem('syncrypta_chart_categoria') || 'doughnut'
    const fluxoCanvas = document.getElementById('graficoFluxoMensal')
    const categoriaCanvas = document.getElementById('graficoCategorias')

    if (fluxoCanvas) {
        estado.graficos.fluxo = new Chart(fluxoCanvas, {
            type: tipoFluxo,
            data: {
                labels: dados.meses.map((item) => formatarMes(item.mes).replace(' de ', '/')),
                datasets: [
                    { label: 'Recebimentos', data: dados.meses.map((item) => item.receitas), backgroundColor: 'rgba(25, 183, 145, .72)', borderColor: '#19b791', borderWidth: 2, borderRadius: 8, tension: .35 },
                    { label: 'Pagamentos', data: dados.meses.map((item) => item.pagamentos), backgroundColor: 'rgba(239, 91, 103, .72)', borderColor: '#ef5b67', borderWidth: 2, borderRadius: 8, tension: .35 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { usePointStyle: true } } }, scales: { y: { beginAtZero: true } } }
        })
    }

    if (categoriaCanvas) {
        const entradas = Object.entries(dados.categoriasDespesas || {}).sort((a, b) => b[1] - a[1])
        estado.graficos.categorias = new Chart(categoriaCanvas, {
            type: tipoCategoria,
            data: { labels: entradas.map(([nome]) => nome), datasets: [{ data: entradas.map(([, valor]) => valor), backgroundColor: ['#08b8d8', '#7259ff', '#19b791', '#f7a928', '#ef5b67', '#4e79ff', '#8c9bab'], borderWidth: 0, borderRadius: tipoCategoria === 'bar' ? 8 : 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: tipoCategoria === 'bar' ? 'top' : 'bottom', labels: { usePointStyle: true } } }, scales: tipoCategoria === 'bar' ? { y: { beginAtZero: true } } : {} }
        })
    }
}

async function salvarSaldoInicial() {
    const filtros = contextoDosControles('context')
    if (!filtros.mes) {
        mostrarToast('Escolha o mês antes de definir o saldo inicial.', 'aviso')
        return
    }
    const valor = Number(document.getElementById('saldoInicialInput').value)
    if (!Number.isFinite(valor)) {
        mostrarToast('Informe um saldo inicial válido.', 'aviso')
        return
    }
    const { resposta, dados } = await apiRequest('/api/saldo-inicial', { method: 'PUT', body: JSON.stringify({ clienteId: filtros.clienteId, mes: filtros.mes, valor }) })
    if (resposta.ok) {
        mostrarToast(dados.mensagem)
        await carregarDashboard()
    } else mostrarToast(dados.mensagem, 'erro')
}

async function carregarDadosDemo() {
    const { resposta, dados } = await apiRequest('/api/demo/carregar', { method: 'POST' })
    if (resposta.ok) {
        mostrarToast(dados.mensagem)
        await carregarPerfisFinanceiros()
        if (dados.clienteId && document.getElementById('contextCliente')) document.getElementById('contextCliente').value = dados.clienteId
        await carregarDashboard()
    } else mostrarToast(dados.mensagem, 'erro')
}

function tipoBadge(tipo) {
    return tipo === 'receita' ? '<span class="type-badge type-income">Receita</span>' : '<span class="type-badge type-expense">Pagamento</span>'
}

function linhaVazia(colunas, mensagem) {
    return `<tr><td colspan="${colunas}"><div class="table-empty">${svgIcon('file')}<span>${escaparHtml(mensagem)}</span></div></td></tr>`
}

async function carregarMovimentacoes() {
    const filtros = {
        clienteId: document.getElementById('filtroCliente')?.value || '',
        mes: document.getElementById('filtroMes')?.value || '',
        origem: document.getElementById('filtroOrigem')?.value || '',
        tipo: document.getElementById('filtroTipo')?.value || '',
        status: document.getElementById('filtroStatus')?.value || ''
    }
    const { resposta, dados } = await apiRequest('/api/movimentacoes' + montarQuery(filtros))
    if (!resposta.ok) return
    estado.movimentacoes = dados
    renderizarMovimentacoes()
}

function renderizarMovimentacoes() {
    const tabela = document.getElementById('tabelaMovimentacoes')
    if (!tabela) return
    const busca = normalizarBusca(document.getElementById('buscaMovimentacao')?.value)
    const ordenacao = document.getElementById('ordenacaoMovimentacao')?.value || 'recentes'
    let lista = estado.movimentacoes.filter((item) => normalizarBusca(`${item.descricao} ${item.categoria} ${item.subcategoria} ${item.contraparte}`).includes(busca))
    lista = [...lista].sort((a, b) => {
        if (ordenacao === 'antigas') return String(a.data).localeCompare(String(b.data))
        if (ordenacao === 'maior') return Number(b.valor) - Number(a.valor)
        if (ordenacao === 'menor') return Number(a.valor) - Number(b.valor)
        return String(b.data).localeCompare(String(a.data))
    })
    document.getElementById('contadorMovimentacoes').textContent = `${lista.length} lançamento${lista.length === 1 ? '' : 's'}`
    tabela.innerHTML = lista.length ? lista.map((item) => {
        const cliente = estado.clientes.find((c) => String(c.id) === String(item.clienteId))
        return `<tr><td><div class="table-main"><span class="table-icon">${svgIcon(item.tipo === 'receita' ? 'arrowUp' : 'arrowDown')}</span><div><strong>${escaparHtml(item.descricao)}</strong><small>${escaparHtml(item.contraparte || item.conta || 'Sem detalhe')}</small></div></div></td><td><strong>${escaparHtml(item.categoria)}</strong><small class="table-subline">${escaparHtml(item.subcategoria || 'A classificar')}</small></td><td>${origemLabel(item.origem)}</td><td>${escaparHtml(cliente?.nome || 'Geral')}</td><td class="${item.tipo === 'receita' ? 'value-positive' : 'value-negative'}">${formatarMoeda(item.valor)}</td><td>${statusClassificacaoBadge(item.statusClassificacao, item.confianca)}</td><td><div class="table-actions"><button class="icon-button" onclick="editarMovimentacao('${item.id}')" title="Editar">${svgIcon('edit')}</button><button class="icon-button danger" onclick="excluirMovimentacao('${item.id}')" title="Excluir">${svgIcon('trash')}</button></div></td></tr>`
    }).join('') : linhaVazia(7, 'Nenhuma movimentação encontrada.')
}

function normalizarBusca(valor) {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function atualizarCamposPerfilMovimentacao() {
    const cliente = perfilSelecionado('movCliente')
    const pj = cliente?.perfilFinanceiro === 'pj'
    const container = document.getElementById('pjFields')
    if (container) container.classList.toggle('pj-fields-visible', pj)
}

function iniciarFormularioMovimentacao() {
    const formulario = document.getElementById('formMovimentacao')
    if (!formulario) return
    document.getElementById('data').value = new Date().toISOString().slice(0, 10)
    document.getElementById('movCliente')?.addEventListener('change', atualizarCamposPerfilMovimentacao)
    atualizarCamposPerfilMovimentacao()

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault()
        const payload = {
            clienteId: document.getElementById('movCliente').value,
            descricao: document.getElementById('descricao').value.trim(),
            tipo: document.getElementById('tipo').value,
            categoria: document.getElementById('categoria').value.trim(),
            subcategoria: document.getElementById('subcategoria').value.trim(),
            valor: document.getElementById('valor').value,
            data: document.getElementById('data').value,
            origem: document.getElementById('origem').value,
            conta: document.getElementById('conta').value.trim(),
            contraparte: document.getElementById('contraparte').value.trim(),
            centroCusto: document.getElementById('centroCusto').value.trim(),
            natureza: document.getElementById('natureza').value,
            aprenderRegra: document.getElementById('aprenderRegra').checked
        }
        const id = estado.idMovimentacaoEditando
        const { resposta, dados } = await apiRequest(id ? `/api/movimentacoes/${id}` : '/api/movimentacoes', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) })
        if (resposta.ok) {
            mostrarToast(dados.mensagem)
            cancelarEdicaoMovimentacao()
            await carregarMovimentacoes()
            await atualizarNotificacoes()
        } else mostrarToast(dados.mensagem, 'erro')
    })

    ;['buscaMovimentacao'].forEach((id) => document.getElementById(id)?.addEventListener('input', renderizarMovimentacoes))
    ;['filtroCliente', 'filtroMes', 'filtroOrigem', 'filtroTipo', 'filtroStatus'].forEach((id) => document.getElementById(id)?.addEventListener('change', carregarMovimentacoes))
    document.getElementById('ordenacaoMovimentacao')?.addEventListener('change', renderizarMovimentacoes)
}

function editarMovimentacao(id) {
    const item = estado.movimentacoes.find((mov) => String(mov.id) === String(id))
    if (!item) return
    estado.idMovimentacaoEditando = id
    const valores = {
        movCliente: item.clienteId || '', descricao: item.descricao, tipo: item.tipo, categoria: item.categoria,
        subcategoria: item.subcategoria || '', valor: item.valor, data: item.data, origem: item.origem || 'manual',
        conta: item.conta || '', contraparte: item.contraparte || '', centroCusto: item.centroCusto || '', natureza: item.natureza || ''
    }
    Object.entries(valores).forEach(([idCampo, valor]) => {
        const campo = document.getElementById(idCampo)
        if (campo) campo.value = valor
    })
    atualizarCamposPerfilMovimentacao()
    document.getElementById('movementFormTitle').textContent = 'Editar e confirmar classificação'
    document.getElementById('movementSubmitText').textContent = 'Salvar e confirmar'
    document.getElementById('cancelMovementEdit').hidden = false
    document.getElementById('movementFormCard').scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function cancelarEdicaoMovimentacao() {
    estado.idMovimentacaoEditando = null
    const formulario = document.getElementById('formMovimentacao')
    formulario?.reset()
    if (document.getElementById('data')) document.getElementById('data').value = new Date().toISOString().slice(0, 10)
    document.getElementById('movementFormTitle').textContent = 'Novo lançamento'
    document.getElementById('movementSubmitText').textContent = 'Adicionar lançamento'
    document.getElementById('cancelMovementEdit').hidden = true
    atualizarCamposPerfilMovimentacao()
}

async function excluirMovimentacao(id) {
    const confirmado = await confirmarAcao('Esta movimentação será removida do fluxo e dos relatórios.', 'Excluir movimentação')
    if (!confirmado) return
    const { resposta, dados } = await apiRequest(`/api/movimentacoes/${id}`, { method: 'DELETE' })
    if (resposta.ok) {
        mostrarToast(dados.mensagem)
        await carregarMovimentacoes()
    } else mostrarToast(dados.mensagem, 'erro')
}

function detectarDelimitador(linha) {
    return (linha.match(/;/g) || []).length > (linha.match(/,/g) || []).length ? ';' : ','
}

function separarCsv(linha, delimitador) {
    const colunas = []
    let atual = ''
    let entreAspas = false
    for (let i = 0; i < linha.length; i += 1) {
        const caractere = linha[i]
        if (caractere === '"') entreAspas = !entreAspas
        else if (caractere === delimitador && !entreAspas) { colunas.push(atual.trim()); atual = '' }
        else atual += caractere
    }
    colunas.push(atual.trim())
    return colunas.map((item) => item.replace(/^"|"$/g, ''))
}

function normalizarCabecalho(texto) {
    return normalizarBusca(texto).replace(/\s+/g, '')
}

function linhasParaObjetos(linhas) {
    if (!linhas.length) return []
    const cabecalhos = linhas[0].map(normalizarCabecalho)
    const localizar = (nomes) => cabecalhos.findIndex((cab) => nomes.includes(cab))
    const indices = {
        descricao: localizar(['descricao', 'historico', 'memo', 'nome']), tipo: localizar(['tipo', 'natureza']), categoria: localizar(['categoria']),
        subcategoria: localizar(['subcategoria', 'subclasse']), valor: localizar(['valor', 'amount', 'trnamt']), data: localizar(['data', 'dtposted']),
        contraparte: localizar(['contraparte', 'fornecedor', 'cliente']), centroCusto: localizar(['centrodecusto', 'centrocusto']), conta: localizar(['conta']), origem: localizar(['origem'])
    }
    if (indices.descricao < 0 || indices.valor < 0 || indices.data < 0) throw new Error('O arquivo precisa ter Descricao, Valor e Data.')
    return linhas.slice(1).map((colunas) => ({
        descricao: colunas[indices.descricao] || '', tipo: indices.tipo >= 0 ? colunas[indices.tipo] : '', categoria: indices.categoria >= 0 ? colunas[indices.categoria] : '',
        subcategoria: indices.subcategoria >= 0 ? colunas[indices.subcategoria] : '', valor: colunas[indices.valor] || '', data: normalizarDataImportada(colunas[indices.data]),
        contraparte: indices.contraparte >= 0 ? colunas[indices.contraparte] : '', centroCusto: indices.centroCusto >= 0 ? colunas[indices.centroCusto] : '',
        conta: indices.conta >= 0 ? colunas[indices.conta] : '', origem: indices.origem >= 0 ? colunas[indices.origem] : ''
    })).filter((item) => item.descricao && item.valor && item.data)
}

function normalizarDataImportada(valor) {
    if (typeof valor === 'number' || /^\d+(\.\d+)?$/.test(String(valor || ''))) {
        const numeroData = Number(valor)
        if (numeroData > 20000 && numeroData < 80000) {
            const data = new Date(Date.UTC(1899, 11, 30) + numeroData * 86400000)
            return data.toISOString().slice(0, 10)
        }
    }
    const texto = String(valor || '').trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10)
    if (/^\d{8}/.test(texto)) return `${texto.slice(0, 4)}-${texto.slice(4, 6)}-${texto.slice(6, 8)}`
    const partes = texto.split(/[\/.-]/)
    if (partes.length === 3 && partes[2].length === 4) return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`
    return texto.slice(0, 10)
}

function parseCsv(texto) {
    const linhas = String(texto || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter((linha) => linha.trim())
    if (linhas.length < 2) throw new Error('O CSV precisa de cabeçalho e ao menos uma linha.')
    const delimitador = detectarDelimitador(linhas[0])
    return linhasParaObjetos(linhas.map((linha) => separarCsv(linha, delimitador)))
}

function parseOfx(texto) {
    const blocos = String(texto || '').match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || String(texto || '').split('<STMTTRN>').slice(1)
    const valorTag = (bloco, tag) => {
        const achou = bloco.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i'))
        return achou ? achou[1].trim() : ''
    }
    return blocos.map((bloco) => {
        const valorOriginal = Number(valorTag(bloco, 'TRNAMT').replace(',', '.'))
        const descricao = valorTag(bloco, 'NAME') || valorTag(bloco, 'MEMO') || 'Movimentação OFX'
        return { descricao, tipo: valorOriginal >= 0 ? 'receita' : 'pagamento', valor: Math.abs(valorOriginal), data: normalizarDataImportada(valorTag(bloco, 'DTPOSTED')), contraparte: valorTag(bloco, 'NAME'), origem: 'arquivo_ofx' }
    }).filter((item) => item.descricao && Number.isFinite(item.valor) && item.data)
}

function encontrarEocd(view) {
    for (let i = view.byteLength - 22; i >= Math.max(0, view.byteLength - 65557); i -= 1) {
        if (view.getUint32(i, true) === 0x06054b50) return i
    }
    throw new Error('Arquivo XLSX inválido.')
}

async function extrairZip(arrayBuffer) {
    const view = new DataView(arrayBuffer)
    const eocd = encontrarEocd(view)
    const total = view.getUint16(eocd + 10, true)
    let offset = view.getUint32(eocd + 16, true)
    const decoder = new TextDecoder('utf-8')
    const arquivos = {}
    for (let i = 0; i < total; i += 1) {
        if (view.getUint32(offset, true) !== 0x02014b50) break
        const metodo = view.getUint16(offset + 10, true)
        const tamanhoComprimido = view.getUint32(offset + 20, true)
        const nomeLen = view.getUint16(offset + 28, true)
        const extraLen = view.getUint16(offset + 30, true)
        const comentarioLen = view.getUint16(offset + 32, true)
        const localOffset = view.getUint32(offset + 42, true)
        const nome = decoder.decode(new Uint8Array(arrayBuffer, offset + 46, nomeLen))
        if (['xl/sharedStrings.xml', 'xl/worksheets/sheet1.xml'].includes(nome)) {
            const localNomeLen = view.getUint16(localOffset + 26, true)
            const localExtraLen = view.getUint16(localOffset + 28, true)
            const inicio = localOffset + 30 + localNomeLen + localExtraLen
            const compactado = arrayBuffer.slice(inicio, inicio + tamanhoComprimido)
            let dados
            if (metodo === 0) dados = compactado
            else if (metodo === 8 && typeof DecompressionStream !== 'undefined') {
                const stream = new Blob([compactado]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
                dados = await new Response(stream).arrayBuffer()
            } else throw new Error('Seu navegador não suporta a descompactação deste XLSX.')
            arquivos[nome] = decoder.decode(dados)
        }
        offset += 46 + nomeLen + extraLen + comentarioLen
    }
    return arquivos
}

function colunaParaIndice(referencia) {
    const letras = String(referencia || '').match(/[A-Z]+/)?.[0] || 'A'
    return letras.split('').reduce((valor, letra) => valor * 26 + letra.charCodeAt(0) - 64, 0) - 1
}

async function parseXlsx(arrayBuffer) {
    const arquivos = await extrairZip(arrayBuffer)
    if (!arquivos['xl/worksheets/sheet1.xml']) throw new Error('A primeira planilha do Excel não foi encontrada.')
    const parser = new DOMParser()
    const compartilhadas = arquivos['xl/sharedStrings.xml']
        ? [...parser.parseFromString(arquivos['xl/sharedStrings.xml'], 'text/xml').querySelectorAll('si')].map((si) => [...si.querySelectorAll('t')].map((t) => t.textContent).join(''))
        : []
    const documento = parser.parseFromString(arquivos['xl/worksheets/sheet1.xml'], 'text/xml')
    const linhas = [...documento.querySelectorAll('row')].map((row) => {
        const colunas = []
        row.querySelectorAll('c').forEach((cell) => {
            const indice = colunaParaIndice(cell.getAttribute('r'))
            const tipo = cell.getAttribute('t')
            const valorBruto = cell.querySelector('v')?.textContent ?? cell.querySelector('t')?.textContent ?? ''
            colunas[indice] = tipo === 's' ? compartilhadas[Number(valorBruto)] || '' : valorBruto
        })
        return colunas.map((item) => item ?? '')
    })
    return linhasParaObjetos(linhas)
}

async function processarArquivoFinanceiro(arquivo) {
    if (!arquivo) return
    const extensao = arquivo.name.split('.').pop().toLowerCase()
    try {
        let linhas = []
        let origemArquivo = 'arquivo_csv'
        if (extensao === 'csv') linhas = parseCsv(await arquivo.text())
        else if (extensao === 'ofx') { linhas = parseOfx(await arquivo.text()); origemArquivo = 'arquivo_ofx' }
        else if (extensao === 'xlsx') { linhas = await parseXlsx(await arquivo.arrayBuffer()); origemArquivo = 'arquivo_excel' }
        else throw new Error('Formato não suportado. Use CSV, XLSX ou OFX.')

        const origemEscolhida = document.getElementById('importOrigem')?.value || origemArquivo
        linhas = linhas.map((item) => ({ ...item, origem: item.origem || origemEscolhida }))
        const { resposta, dados } = await apiRequest('/api/classificar-lote', {
            method: 'POST',
            body: JSON.stringify({ linhas, clienteId: document.getElementById('importCliente')?.value || '', origem: origemEscolhida })
        })
        if (!resposta.ok) throw new Error(dados.mensagem)
        estado.importLinhas = dados.linhas
        estado.importResumo = dados.resumo
        document.getElementById('csvFileName').textContent = arquivo.name
        document.getElementById('csvFileMeta').textContent = `${dados.linhas.length} linhas válidas · ${(arquivo.size / 1024).toFixed(1)} KB`
        document.getElementById('csvSelected').hidden = false
        renderizarReviewImportacao()
        mostrarToast('Arquivo lido. Revise as classificações antes de importar.')
    } catch (erro) {
        mostrarToast(erro.message || 'Não foi possível ler o arquivo.', 'erro')
    }
}

function renderizarReviewImportacao() {
    const resumo = estado.importResumo || {}
    const bloco = document.getElementById('importReviewSummary')
    if (bloco) bloco.hidden = !estado.importLinhas.length
    const valores = { importTotal: resumo.total || 0, importConfirmed: resumo.confirmadas || 0, importSuggested: resumo.sugeridas || 0, importReview: resumo.revisar || 0, importUnknown: resumo.naoIdentificadas || 0 }
    Object.entries(valores).forEach(([id, valor]) => { const el = document.getElementById(id); if (el) el.textContent = valor })

    const tabela = document.getElementById('csvPreviewBody')
    tabela.innerHTML = estado.importLinhas.length ? estado.importLinhas.map((item, indice) => `<tr data-import-row="${indice}"><td><input class="table-input wide" data-campo="descricao" value="${escaparHtml(item.descricao)}"></td><td><select class="table-input" data-campo="tipo"><option value="receita" ${item.tipo === 'receita' ? 'selected' : ''}>Receita</option><option value="pagamento" ${item.tipo !== 'receita' ? 'selected' : ''}>Pagamento</option></select></td><td><input class="table-input" data-campo="categoria" value="${escaparHtml(item.categoria)}"></td><td><input class="table-input" data-campo="subcategoria" value="${escaparHtml(item.subcategoria)}"></td><td><input class="table-input money" data-campo="valor" value="${item.valor}"></td><td><input class="table-input date" type="date" data-campo="data" value="${item.data}"></td><td>${statusClassificacaoBadge(item.statusClassificacao, item.confianca)}<button class="mini-confirm" onclick="confirmarLinhaImportacao(${indice})">Confirmar</button></td><td><input type="checkbox" data-campo="aprenderRegra" ${item.aprenderRegra ? 'checked' : ''}></td></tr>`).join('') : linhaVazia(8, 'Selecione um arquivo para iniciar a revisão.')
    document.getElementById('importCsvButton').disabled = !estado.importLinhas.length
    document.getElementById('confirmAllButton').disabled = !estado.importLinhas.length
}

function sincronizarLinhasImportacao() {
    document.querySelectorAll('[data-import-row]').forEach((linha) => {
        const indice = Number(linha.dataset.importRow)
        const item = estado.importLinhas[indice]
        if (!item) return
        linha.querySelectorAll('[data-campo]').forEach((campo) => {
            item[campo.dataset.campo] = campo.type === 'checkbox' ? campo.checked : campo.value
        })
    })
}

function confirmarLinhaImportacao(indice) {
    sincronizarLinhasImportacao()
    const item = estado.importLinhas[indice]
    if (!item) return
    item.statusClassificacao = 'confirmada'
    item.confianca = 100
    renderizarReviewImportacao()
}

function confirmarTodasClassificacoes() {
    sincronizarLinhasImportacao()
    estado.importLinhas.forEach((item) => { item.statusClassificacao = 'confirmada'; item.confianca = 100 })
    estado.importResumo = { total: estado.importLinhas.length, confirmadas: estado.importLinhas.length, sugeridas: 0, revisar: 0, naoIdentificadas: 0 }
    renderizarReviewImportacao()
    mostrarToast('Todas as classificações foram confirmadas.')
}

function iniciarImportacao() {
    const input = document.getElementById('arquivoCsv')
    const dropzone = document.getElementById('csvDropzone')
    if (!input || !dropzone) return
    input.addEventListener('change', () => processarArquivoFinanceiro(input.files[0]))
    ;['dragenter', 'dragover'].forEach((evento) => dropzone.addEventListener(evento, (e) => { e.preventDefault(); dropzone.classList.add('drag-active') }))
    ;['dragleave', 'drop'].forEach((evento) => dropzone.addEventListener(evento, (e) => { e.preventDefault(); dropzone.classList.remove('drag-active') }))
    dropzone.addEventListener('drop', (evento) => processarArquivoFinanceiro(evento.dataTransfer.files[0]))
}

async function importarCsv() {
    sincronizarLinhasImportacao()
    if (!estado.importLinhas.length) return mostrarToast('Selecione e revise um arquivo.', 'aviso')
    const pendentes = estado.importLinhas.filter((item) => item.statusClassificacao !== 'confirmada').length
    if (pendentes) {
        const continuar = await confirmarAcao(`${pendentes} linhas ainda estão sugeridas ou pendentes. Deseja importar assim mesmo?`, 'Importar com pendências')
        if (!continuar) return
    }
    const botao = document.getElementById('importCsvButton')
    setCarregando(botao, true, 'Importando...')
    const { resposta, dados } = await apiRequest('/api/importar-lote', {
        method: 'POST',
        body: JSON.stringify({ linhas: estado.importLinhas, clienteId: document.getElementById('importCliente')?.value || '', origem: document.getElementById('importOrigem')?.value || '' })
    })
    if (resposta.ok) {
        mostrarToast(`${dados.mensagem}${dados.regrasAprendidas ? ` ${dados.regrasAprendidas} regra(s) aprendida(s).` : ''}`)
        setTimeout(() => window.location.href = 'dashboard.html', 650)
    } else {
        mostrarToast(dados.mensagem, 'erro')
        setCarregando(botao, false)
    }
}

function baixarModeloCsv() {
    const conteudo = 'Descricao,Tipo,Categoria,Subcategoria,Valor,Data,Contraparte,CentroCusto,Conta\nMensalidade Cliente,receita,Receita,Serviços prestados,1200,2026-06-01,Cliente Alfa,Comercial,Conta principal\nPosto Shell,pagamento,Transporte,Combustível,150,2026-06-02,Shell,Operações,Cartão corporativo\n'
    baixarArquivo(conteudo, 'modelo-syncrypta-4.csv', 'text/csv;charset=utf-8')
}

function baixarArquivo(conteudo, nome, tipo) {
    const blob = conteudo instanceof Blob ? conteudo : new Blob(['\uFEFF', conteudo], { type: tipo })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nome
    link.click()
    URL.revokeObjectURL(url)
}

async function carregarRelatorio() {
    const filtros = contextoDosControles('relatorio')
    const { resposta, dados } = await apiRequest('/api/dashboard' + montarQuery(filtros))
    if (!resposta.ok) return
    document.getElementById('relatorioSaldoInicial').textContent = formatarMoeda(dados.saldoInicial)
    document.getElementById('relatorioRecebido').textContent = formatarMoeda(dados.totalRecebido)
    document.getElementById('relatorioPago').textContent = formatarMoeda(dados.totalPago)
    document.getElementById('relatorioSaldo').textContent = formatarMoeda(dados.saldoFinal)
    const variacao = Number(dados.comparacao?.variacaoSaldo || 0)
    document.getElementById('relatorioVariacao').textContent = `${variacao >= 0 ? '+' : ''}${variacao.toFixed(1)}%`
    document.getElementById('relatorioMesAnterior').textContent = dados.comparacao?.mesAnterior ? `vs. ${formatarMes(dados.comparacao.mesAnterior)}` : 'Sem referência'
    document.getElementById('managerInsight').textContent = dados.saldoFinal < 0
        ? `O fluxo fecha negativo em ${formatarMoeda(Math.abs(dados.saldoFinal))}. Revise as maiores categorias e despesas recorrentes.`
        : dados.contexto.perfilFinanceiro === 'pf'
            ? `O período fecha com ${formatarMoeda(dados.saldoFinal)}. A projeção ajuda a decidir se novas compras cabem no orçamento.`
            : `O caixa fecha positivo em ${formatarMoeda(dados.saldoFinal)}, com saúde financeira de ${dados.saudeFinanceira}% e ${dados.revisao.revisar + dados.revisao.naoIdentificadas} itens pendentes de revisão.`

    preencherTabelaValores('relatorioCategorias', dados.categoriasDespesas, true)
    preencherTabelaValores('relatorioSubcategorias', dados.subcategoriasDespesas, false)
    const proj = document.getElementById('relatorioProjecoes')
    proj.innerHTML = dados.projecao.proximosMeses.map((item) => `<article class="projection-month"><span>${formatarMes(item.mes)}</span><strong class="${item.saldo >= 0 ? 'value-positive' : 'value-negative'}">${formatarMoeda(item.saldo)}</strong><small>Receitas ${formatarMoeda(item.recebimentos)} · Pagamentos ${formatarMoeda(item.pagamentos)}</small></article>`).join('')
    renderizarOutliers(dados.foraDoPadrao, 'relatorioOutliers')
    document.getElementById('relatorioMovimentacoes').innerHTML = dados.movimentacoes.length ? [...dados.movimentacoes].reverse().map((item) => `<tr><td>${formatarData(item.data)}</td><td>${escaparHtml(item.descricao)}</td><td>${tipoBadge(item.tipo)}</td><td>${escaparHtml(item.categoria)} / ${escaparHtml(item.subcategoria || 'A classificar')}</td><td>${origemLabel(item.origem)}</td><td>${formatarMoeda(item.valor)}</td></tr>`).join('') : linhaVazia(6, 'Nenhuma movimentação no período.')
    estado.relatorioAtual = dados
}

function preencherTabelaValores(id, objeto, comProgresso) {
    const tbody = document.getElementById(id)
    const entradas = Object.entries(objeto || {}).sort((a, b) => b[1] - a[1])
    const total = entradas.reduce((s, [, valor]) => s + Number(valor), 0)
    if (!tbody) return
    tbody.innerHTML = entradas.length ? entradas.map(([nome, valor]) => comProgresso
        ? `<tr><td><span class="category-pill">${escaparHtml(nome)}</span></td><td>${formatarMoeda(valor)}</td><td><div class="progress-line"><span style="width:${total ? valor / total * 100 : 0}%"></span></div></td><td>${total ? (valor / total * 100).toFixed(1) : 0}%</td></tr>`
        : `<tr><td>${escaparHtml(nome)}</td><td>${formatarMoeda(valor)}</td></tr>`).join('') : linhaVazia(comProgresso ? 4 : 2, 'Sem dados para o período.')
}

async function exportarCsv() {
    const filtros = contextoDosControles('relatorio')
    const { resposta, dados } = await apiRequest('/api/movimentacoes' + montarQuery(filtros))
    if (!resposta.ok) return
    const csv = ['Data,Descricao,Tipo,Categoria,Subcategoria,Origem,Conta,Contraparte,CentroCusto,Natureza,Valor', ...dados.map((item) => [item.data, item.descricao, item.tipo, item.categoria, item.subcategoria, origemLabel(item.origem), item.conta, item.contraparte, item.centroCusto, item.natureza, item.valor].map((valor) => `"${String(valor || '').replaceAll('"', '""')}"`).join(','))].join('\n')
    baixarArquivo(csv, `relatorio-syncrypta-${filtros.mes || new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8')
}

async function exportarExcel() {
    const filtros = contextoDosControles('relatorio')
    const { resposta, dados } = await apiRequest('/api/movimentacoes' + montarQuery(filtros))
    if (!resposta.ok) return
    const linhas = dados.map((item) => `<tr><td>${escaparHtml(item.data)}</td><td>${escaparHtml(item.descricao)}</td><td>${escaparHtml(item.tipo)}</td><td>${escaparHtml(item.categoria)}</td><td>${escaparHtml(item.subcategoria || '')}</td><td>${escaparHtml(origemLabel(item.origem))}</td><td>${escaparHtml(item.conta || '')}</td><td>${escaparHtml(item.contraparte || '')}</td><td>${escaparHtml(item.centroCusto || '')}</td><td>${escaparHtml(item.natureza || '')}</td><td>${Number(item.valor)}</td></tr>`).join('')
    const html = `<html><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Subcategoria</th><th>Origem</th><th>Conta</th><th>Contraparte</th><th>Centro de custo</th><th>Natureza</th><th>Valor</th></tr></thead><tbody>${linhas}</tbody></table></body></html>`
    baixarArquivo(html, `relatorio-syncrypta-${filtros.mes || new Date().toISOString().slice(0, 10)}.xls`, 'application/vnd.ms-excel;charset=utf-8')
    mostrarToast('Planilha Excel gerada.')
}

function imprimirRelatorio() { window.print() }

async function carregarClientes() {
    const { resposta, dados } = await apiRequest('/api/clientes')
    if (!resposta.ok) return
    estado.clientes = dados
    preencherSelectsDePerfil()
    renderizarClientes()
}

function renderizarClientes() {
    const tabela = document.getElementById('tabelaClientes')
    if (!tabela) return
    const busca = normalizarBusca(document.getElementById('buscaCliente')?.value)
    const status = document.getElementById('filtroStatusCliente')?.value || ''
    const lista = estado.clientes.filter((item) => (!status || item.status === status) && normalizarBusca(`${item.nome} ${item.segmento}`).includes(busca))
    document.getElementById('clientesTotal').textContent = estado.clientes.length
    document.getElementById('clientesAtivos').textContent = estado.clientes.filter((item) => item.status === 'Ativo').length
    tabela.innerHTML = lista.length ? lista.map((item) => `<tr><td><div class="table-main"><span class="user-avatar small">${gerarSigla(item.nome)}</span><div><strong>${escaparHtml(item.nome)}</strong><small>Identificação interna</small></div></div></td><td><span class="type-badge ${item.perfilFinanceiro === 'pj' ? 'type-business' : 'type-personal'}">${item.perfilFinanceiro === 'pj' ? 'Pessoa jurídica' : 'Pessoa física'}</span></td><td>${escaparHtml(item.segmento || 'Não informado')}</td><td>${escaparHtml(item.modoVisual || 'barras')}</td><td><span class="status-dot ${item.status === 'Ativo' ? 'status-ok' : 'status-muted'}">${escaparHtml(item.status)}</span></td><td><div class="table-actions"><button class="icon-button" onclick="editarCliente('${item.id}')">${svgIcon('edit')}</button><button class="icon-button danger" onclick="excluirCliente('${item.id}')">${svgIcon('trash')}</button></div></td></tr>`).join('') : linhaVazia(6, 'Nenhum perfil cadastrado.')
}

function iniciarFormularioCliente() {
    const formulario = document.getElementById('formCliente')
    if (!formulario) return
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault()
        const payload = { nome: document.getElementById('clienteNome').value.trim(), perfilFinanceiro: document.getElementById('clientePerfil').value, segmento: document.getElementById('clienteSegmento').value.trim(), modoVisual: document.getElementById('clienteModoVisual').value, status: document.getElementById('clienteStatus').value }
        const id = estado.idClienteEditando
        const { resposta, dados } = await apiRequest(id ? `/api/clientes/${id}` : '/api/clientes', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) })
        if (resposta.ok) { mostrarToast(dados.mensagem); cancelarEdicaoCliente(); await carregarClientes() } else mostrarToast(dados.mensagem, 'erro')
    })
    document.getElementById('buscaCliente')?.addEventListener('input', renderizarClientes)
    document.getElementById('filtroStatusCliente')?.addEventListener('change', renderizarClientes)
}

function editarCliente(id) {
    const item = estado.clientes.find((cliente) => String(cliente.id) === String(id))
    if (!item) return
    estado.idClienteEditando = id
    document.getElementById('clienteNome').value = item.nome
    document.getElementById('clientePerfil').value = item.perfilFinanceiro
    document.getElementById('clienteSegmento').value = item.segmento || ''
    document.getElementById('clienteModoVisual').value = item.modoVisual || 'barras'
    document.getElementById('clienteStatus').value = item.status
    document.getElementById('clienteFormTitle').textContent = 'Editar perfil financeiro'
    document.getElementById('clienteSubmitText').textContent = 'Salvar alterações'
    document.getElementById('cancelClienteEdit').hidden = false
    document.getElementById('clienteFormCard').scrollIntoView({ behavior: 'smooth' })
}

function cancelarEdicaoCliente() {
    estado.idClienteEditando = null
    document.getElementById('formCliente')?.reset()
    document.getElementById('clienteFormTitle').textContent = 'Cadastrar perfil financeiro'
    document.getElementById('clienteSubmitText').textContent = 'Adicionar perfil'
    document.getElementById('cancelClienteEdit').hidden = true
}

async function excluirCliente(id) {
    const confirmado = await confirmarAcao('O perfil será removido. As movimentações existentes não serão apagadas.', 'Excluir perfil financeiro')
    if (!confirmado) return
    const { resposta, dados } = await apiRequest(`/api/clientes/${id}`, { method: 'DELETE' })
    if (resposta.ok) { mostrarToast(dados.mensagem); await carregarClientes() } else mostrarToast(dados.mensagem, 'erro')
}

async function carregarRegras() {
    const clienteId = document.getElementById('filtroRegraCliente')?.value || ''
    const { resposta, dados } = await apiRequest('/api/regras' + montarQuery({ clienteId }))
    if (!resposta.ok) return
    estado.regras = dados
    renderizarRegras()
}

function renderizarRegras() {
    const grid = document.getElementById('rulesGrid')
    if (!grid) return
    const busca = normalizarBusca(document.getElementById('buscaRegra')?.value)
    const lista = estado.regras.filter((item) => normalizarBusca(`${item.termo} ${item.categoria} ${item.subcategoria}`).includes(busca))
    grid.innerHTML = lista.length ? lista.map((item) => {
        const cliente = estado.clientes.find((c) => String(c.id) === String(item.clienteId))
        return `<article class="rule-card ${item.personalizada ? 'rule-custom' : 'rule-default'}"><div class="rule-card-top"><span class="rule-icon">${svgIcon('sparkles')}</span><span class="classification-badge ${item.personalizada ? 'classification-success' : 'classification-info'}">${item.personalizada ? 'Personalizada' : 'Padrão'}</span></div><h3>Contém “${escaparHtml(item.termo)}”</h3><p>${tipoBadge(item.tipo)} <strong>${escaparHtml(item.categoria)}</strong> / ${escaparHtml(item.subcategoria || 'A classificar')}</p><small>${cliente ? `Perfil: ${escaparHtml(cliente.nome)}` : 'Aplicação geral'} · confiança ${item.confianca || 90}%</small>${item.personalizada ? `<div class="rule-actions"><button class="button button-ghost" onclick="editarRegra('${item.id}')">Editar</button><button class="button button-danger" onclick="excluirRegra('${item.id}')">Excluir</button></div>` : ''}</article>`
    }).join('') : '<div class="empty-compact">Nenhuma regra encontrada.</div>'
}

function iniciarFormularioRegra() {
    const formulario = document.getElementById('formRegra')
    if (!formulario) return
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault()
        const payload = { termo: document.getElementById('regraTermo').value.trim(), clienteId: document.getElementById('regraCliente').value, tipo: document.getElementById('regraTipo').value, categoria: document.getElementById('regraCategoria').value.trim(), subcategoria: document.getElementById('regraSubcategoria').value.trim() }
        const id = estado.idRegraEditando
        const { resposta, dados } = await apiRequest(id ? `/api/regras/${id}` : '/api/regras', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) })
        if (resposta.ok) { mostrarToast(dados.mensagem); cancelarEdicaoRegra(); await carregarRegras() } else mostrarToast(dados.mensagem, 'erro')
    })
    document.getElementById('buscaRegra')?.addEventListener('input', renderizarRegras)
    document.getElementById('filtroRegraCliente')?.addEventListener('change', carregarRegras)
}

function editarRegra(id) {
    const item = estado.regras.find((regra) => String(regra.id) === String(id))
    if (!item || !item.personalizada) return
    estado.idRegraEditando = id
    document.getElementById('regraTermo').value = item.termo
    document.getElementById('regraCliente').value = item.clienteId || ''
    document.getElementById('regraTipo').value = item.tipo
    document.getElementById('regraCategoria').value = item.categoria
    document.getElementById('regraSubcategoria').value = item.subcategoria || ''
    document.getElementById('ruleFormTitle').textContent = 'Editar regra automática'
    document.getElementById('ruleSubmitText').textContent = 'Salvar alterações'
    document.getElementById('cancelRuleEdit').hidden = false
    document.getElementById('ruleFormCard').scrollIntoView({ behavior: 'smooth' })
}

function cancelarEdicaoRegra() {
    estado.idRegraEditando = null
    document.getElementById('formRegra')?.reset()
    document.getElementById('ruleFormTitle').textContent = 'Nova regra automática'
    document.getElementById('ruleSubmitText').textContent = 'Salvar regra'
    document.getElementById('cancelRuleEdit').hidden = true
}

async function excluirRegra(id) {
    const confirmado = await confirmarAcao('A classificação automática deixará de usar esta regra personalizada.', 'Excluir regra')
    if (!confirmado) return
    const { resposta, dados } = await apiRequest(`/api/regras/${id}`, { method: 'DELETE' })
    if (resposta.ok) { mostrarToast(dados.mensagem); await carregarRegras() } else mostrarToast(dados.mensagem, 'erro')
}

async function carregarAuditoria() {
    const { resposta, dados } = await apiRequest('/api/auditoria')
    if (!resposta.ok) return
    estado.auditoria = dados
    document.getElementById('auditTotal').textContent = dados.length
    document.getElementById('auditLast').textContent = dados[0] ? formatarDataHora(dados[0].dataHora) : '—'
    document.getElementById('tabelaAuditoria').innerHTML = dados.length ? dados.map((item) => `<tr><td>${formatarDataHora(item.dataHora)}</td><td><span class="category-pill">${escaparHtml(item.acao)}</span></td><td>${escaparHtml(item.entidade)}</td><td><code class="audit-details">${escaparHtml(JSON.stringify(item.detalhes || {}))}</code></td></tr>`).join('') : linhaVazia(4, 'Nenhum evento de auditoria.')
}

function iniciarCheckout() {
    const parametros = new URLSearchParams(window.location.search)
    const idPlano = parametros.get('plano') || localStorage.getItem('planoSelecionado') || 'profissional'
    localStorage.setItem('planoSelecionado', idPlano)
    apiRequest('/api/planos').then(({ resposta, dados }) => {
        if (!resposta.ok) return
        const plano = dados.find((item) => item.id === idPlano) || dados[1]
        document.getElementById('checkoutPlanName').textContent = `Syncrypta ${plano.nome}`
        document.getElementById('checkoutPlanPrice').textContent = plano.preco === 0 ? 'Grátis' : formatarMoeda(plano.preco)
        document.getElementById('checkoutPlanCycle').textContent = plano.preco === 0 ? 'sem cobrança' : 'por mês'
        const valor = plano.preco === 0 ? 'R$ 0,00' : formatarMoeda(plano.preco)
        document.getElementById('checkoutSubtotal').textContent = valor
        document.getElementById('checkoutTotal').textContent = valor
    })
    document.querySelectorAll('[data-payment-method]').forEach((botao) => botao.addEventListener('click', () => {
        document.querySelectorAll('[data-payment-method]').forEach((item) => item.classList.remove('selected'))
        botao.classList.add('selected')
        document.getElementById('formaPagamento').value = botao.dataset.paymentMethod
        document.getElementById('pixInfo').hidden = botao.dataset.paymentMethod !== 'pix'
        document.getElementById('cardInfo').hidden = botao.dataset.paymentMethod !== 'cartao'
    }))
}

async function simularPagamento() {
    const plano = localStorage.getItem('planoSelecionado')
    const formaPagamento = document.getElementById('formaPagamento').value
    if (!plano || !formaPagamento) return mostrarToast('Escolha PIX ou cartão para continuar.', 'aviso')
    const botao = document.getElementById('payButton')
    setCarregando(botao, true, 'Confirmando...')
    const { resposta, dados } = await apiRequest('/api/pagamento-simulado', { method: 'POST', body: JSON.stringify({ plano, formaPagamento }) })
    if (resposta.ok) abrirModal({ titulo: 'Plano ativado com sucesso', largura: '520px', conteudo: `<div class="payment-success"><div class="success-ring">${svgIcon('check')}</div><h3>Pagamento demonstrativo aprovado</h3><p>Nenhuma cobrança real foi realizada. O plano já está liberado.</p><button class="button button-primary button-full" onclick="window.location.href='dashboard.html'">Ir para o dashboard</button></div>` })
    else { mostrarToast(dados.mensagem, 'erro'); setCarregando(botao, false) }
}

function iniciarPesquisaGlobal() {
    const campo = document.getElementById('globalSearch')
    if (!campo) return
    campo.addEventListener('input', () => {
        const pagina = document.body.dataset.page
        const mapa = { movimentacoes: 'buscaMovimentacao', clientes: 'buscaCliente', regras: 'buscaRegra' }
        const destino = document.getElementById(mapa[pagina])
        if (destino) {
            destino.value = campo.value
            if (pagina === 'movimentacoes') renderizarMovimentacoes()
            if (pagina === 'clientes') renderizarClientes()
            if (pagina === 'regras') renderizarRegras()
        }
    })
}

let paginaInicializada = false

async function iniciarPagina() {
    if (paginaInicializada) return
    paginaInicializada = true

    renderizarIcones()
    iniciarLogin()
    iniciarCadastro()

    try {
        iniciarTema()
    } catch (erro) {
        console.warn('Não foi possível carregar a preferência de tema.', erro)
    }
    const pagina = document.body.dataset.page
    const protegidas = ['dashboard', 'movimentacoes', 'importacao', 'relatorios', 'clientes', 'regras', 'auditoria', 'checkout']
    if (protegidas.includes(pagina)) {
        const protegida = await protegerPagina()
        if (!protegida) return
        await carregarPerfisFinanceiros()
        iniciarPesquisaGlobal()
    }

    if (pagina === 'dashboard') {
        const contextoCliente = document.getElementById('contextCliente')
        if (contextoCliente && !contextoCliente.value && estado.clientes.length) contextoCliente.value = localStorage.getItem('syncrypta_context_cliente') || estado.clientes[0].id
        document.getElementById('contextMes').value = localStorage.getItem('syncrypta_context_mes') || mesAtual()
        configurarControlesContexto('context', carregarDashboard)
        document.getElementById('chartTypeSelector').value = localStorage.getItem('syncrypta_chart_fluxo') || 'bar'
        document.getElementById('categoryChartType').value = localStorage.getItem('syncrypta_chart_categoria') || 'doughnut'
        document.getElementById('chartTypeSelector').addEventListener('change', () => { localStorage.setItem('syncrypta_chart_fluxo', document.getElementById('chartTypeSelector').value); carregarDashboard() })
        document.getElementById('categoryChartType').addEventListener('change', () => { localStorage.setItem('syncrypta_chart_categoria', document.getElementById('categoryChartType').value); carregarDashboard() })
        await carregarDashboard()
    }
    if (pagina === 'movimentacoes') {
        document.getElementById('filtroMes').value = mesAtual()
        iniciarFormularioMovimentacao()
        await carregarMovimentacoes()
    }
    if (pagina === 'importacao') {
        iniciarImportacao()
        renderizarReviewImportacao()
    }
    if (pagina === 'relatorios') {
        document.getElementById('relatorioMes').value = mesAtual()
        configurarControlesContexto('relatorio', carregarRelatorio)
        await carregarRelatorio()
    }
    if (pagina === 'clientes' && ((estado.plano?.recursos || []).includes('clientes') || estado.conta?.acessoTotal)) {
        iniciarFormularioCliente()
        await carregarClientes()
    }
    if (pagina === 'regras' && ((estado.plano?.recursos || []).includes('regras_automaticas') || estado.conta?.acessoTotal)) {
        iniciarFormularioRegra()
        await carregarRegras()
    }
    if (pagina === 'auditoria' && ((estado.plano?.recursos || []).includes('auditoria') || estado.conta?.acessoTotal)) await carregarAuditoria()
    if (pagina === 'checkout') iniciarCheckout()
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarPagina, { once: true })
} else {
    iniciarPagina()
}
