// Onde está a API:
// - site publicado (ex.: https://syncrypta.onrender.com): a API está no mesmo endereço;
// - aberto pelo Live Server (porta 5500) ou direto do arquivo: a API está na porta 3000 do computador.
const API_URL = (() => {
    const { protocol, hostname, port, origin } = window.location
    if (protocol === 'file:') return 'http://127.0.0.1:3000'
    const local = hostname === 'localhost' || hostname === '127.0.0.1' || /^192\.168\.|^10\./.test(hostname)
    if (local && port !== '3000') return `${protocol}//${hostname}:3000`
    return origin
})()

// ==========================================================
// PREFERÊNCIAS DE APARÊNCIA E USO (4.13) · página Configurações
// Ficam salvas na conta (servidor) e com uma cópia neste navegador, para aplicar logo
// que a página abre, sem "piscar". Cada preferência vira uma classe no <html>, e o CSS
// (novidades-4-9.css) faz o resto: fonte maior, modo compacto, destaque roxo etc.
// ==========================================================
const CHAVE_PREFERENCIAS = 'syncrypta_preferencias'
const PAGINAS_INICIAIS = ['dashboard', 'movimentacoes', 'importacao', 'relatorios']

function preferenciasLocais() {
    try { return JSON.parse(localStorage.getItem(CHAVE_PREFERENCIAS) || '{}') || {} } catch (erro) { return {} }
}

function aplicarPreferencias(p = preferenciasLocais()) {
    const raiz = document.documentElement
    raiz.classList.toggle('pref-fonte-grande', p.fonte === 'grande')
    raiz.classList.toggle('pref-compacta', p.densidade === 'compacta')
    raiz.classList.toggle('pref-destaque-roxo', p.destaque === 'roxo')
    raiz.classList.toggle('pref-sem-animacao', p.animacoes === false)
    raiz.classList.toggle('pref-sem-assistente', p.assistente === false)
}

function guardarPreferencias(p, { grafico = false } = {}) {
    try {
        localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(p))
        if (grafico && p.graficoPadrao) localStorage.setItem('syncrypta_chart_fluxo', p.graficoPadrao)
    } catch (erro) { /* sem armazenamento: aplica só nesta página */ }
    aplicarPreferencias(p)
}

function paginaInicialDe(p) {
    return `${PAGINAS_INICIAIS.includes(p?.paginaInicial) ? p.paginaInicial : 'dashboard'}.html`
}

aplicarPreferencias()

// Menu da página inicial no celular: fecha ao tocar num link (antes era um script dentro do index.html).
document.querySelectorAll('.landing-mobile-nav a').forEach((link) => {
    link.addEventListener('click', () => { const menu = link.closest('details'); if (menu) menu.open = false })
})

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
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
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

    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    fuel: '<path d="M4 7h10v12H4z"/><path d="M14 10h3.5a2.5 2.5 0 0 1 0 5H14"/><path d="M7 4V3h6v4"/><path d="M7 17h3"/><path d="M18 7h2v10h-2"/><path d="M8 10h4"/>',
    market: '<path d="M6 8h12l-1 11H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M9 13h6"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-7h6v7"/>',
    train: '<rect x="5" y="3" width="14" height="15" rx="2"/><path d="M8 19l-2 2M16 19l2 2M8 8h8M9 12h6"/>',
    coffee: '<path d="M5 7h10a3 3 0 0 1 0 6H5z"/><path d="M15 9h2a3 3 0 0 1 0 6h-2"/><path d="M8 17v2M12 17v2"/>',
    restaurant: '<path d="M7 3v8M10 3v8M13 3v8"/><path d="M7 11h6v2a3 3 0 0 1-6 0v-2Z"/><path d="M17 3v18M15 3h4"/><path d="M18 8h-2"/>',
    cart: '<circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/><path d="M3 4h2l2.2 9.2A2 2 0 0 0 9.1 15H17a2 2 0 0 0 2-1.6L20 7H6.2"/>',
    bolt: '<path d="M13 2 5 13h5l-1 9 8-11h-5l1-9Z"/>',
    briefcase: '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M3 12h18"/>',
    cashbox: '<path d="M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M12 12v6M9 15h6"/>',
    car: '<path d="M5 16V9l2.5-4h9L19 9v7"/><path d="M7 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 9h10"/><path d="M8 16h8"/>',
    calendarIcon: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M8 14h3v3H8z"/>'

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
function formatarValorLancamento(item) {
    const original = item.moeda === 'USD' && Number(item.valorOriginal) > 0
        ? `<small class="currency-origin">${Number(item.valorOriginal).toLocaleString('pt-BR', { style: 'currency', currency: 'USD' })} × ${Number(item.cotacaoBrl).toLocaleString('pt-BR', { maximumFractionDigits: 5 })}</small>` : ''
    return `${formatarMoeda(item.valor)}${original}`
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
        if (evento.target.closest('[aria-label="Fechar"]') || evento.target === modal) fecharModalGeral()
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
    document.documentElement.classList.add('tema-escuro')
    localStorage.setItem('temaSyncrypta', 'escuro')
    atualizarIconeTema()
}

function atualizarIconeTema() {
    const botao = document.getElementById('themeToggle')
    if (!botao) return
    const escuro = document.documentElement.classList.contains('tema-escuro')
    const icone = botao.querySelector('[data-icon]')
    if (icone) icone.innerHTML = svgIcon(escuro ? 'sun' : 'moon')
    botao.title = escuro ? 'Usar tema claro' : 'Usar tema escuro'
    botao.setAttribute('aria-label', botao.title)
}

function iniciarTema() {
    document.documentElement.classList.add('tema-escuro')
    localStorage.setItem('temaSyncrypta', 'escuro')
    atualizarIconeTema()
}

function alternarSidebar() {

    const desktop = window.innerWidth > 900

    if (desktop) {
        const recolhido = document.body.classList.toggle('sidebar-colapsada')
        document.body.classList.remove('sidebar-aberta')

        const botao = document.getElementById('sidebarToggle')
        if (botao) {
            botao.setAttribute('aria-label', recolhido ? 'Expandir menu' : 'Recolher menu')
            botao.title = recolhido ? 'Expandir menu' : 'Recolher menu'
        }
        return
    }

    document.body.classList.toggle('sidebar-aberta')
    document.body.classList.remove('sidebar-colapsada')

    const botao = document.getElementById('sidebarToggle')
    if (botao) {
        botao.setAttribute('aria-label', 'Recolher menu')
        botao.title = 'Recolher menu'
    }

}

function sair() {
    limparSessao()
    navegarPara('login.html')
}

async function carregarConta() {
    const { resposta, dados } = await apiRequest('/api/minha-conta')
    if (!resposta.ok) return null

    estado.conta = dados.usuario
    estado.plano = dados.plano
    localStorage.setItem('usuario', JSON.stringify(dados.usuario))
    // Preferências salvas na conta valem em qualquer computador (visita e cliente guardam só no navegador).
    if (dados.usuario.preferencias && !['demonstracao', 'portal_cliente'].includes(dados.usuario.perfil)) guardarPreferencias(dados.usuario.preferencias)
    atualizarInterfaceConta()
    aplicarPermissoesPlano()
    return dados
}

function atualizarInterfaceConta() {
    const conta = estado.conta || pegarUsuarioLocal()
    if (!conta) return

    const master = conta.perfil === 'cliente_tcc' && conta.acessoTotal === true
    const botaoPlanos = document.getElementById('accountPlans')
    if (botaoPlanos) botaoPlanos.hidden = master || conta.perfil === 'portal_cliente'
    document.body.classList.toggle('portal-cliente', conta.perfil === 'portal_cliente')
    document.body.classList.toggle('modo-demo-publico', conta.perfil === 'demonstracao')
    if (conta.perfil === 'demonstracao') {
        const textoPlano = document.querySelector('#accountPlans span:nth-child(2)')
        if (textoPlano) textoPlano.textContent = 'Trocar plano de exemplo'
        const conteudo = document.querySelector('.page-content')
        if (conteudo && !conteudo.querySelector('.demo-session-note')) {
            conteudo.insertAdjacentHTML('afterbegin', '<div class="demo-session-note"><strong>AMBIENTE DE VISITA</strong><span>Dados fictícios · Somente leitura · Nenhuma cobrança · Planos no menu do perfil</span></div>')
        }
    }
    document.querySelectorAll('[data-user-name]').forEach((elemento) => elemento.textContent = conta.nome)
    document.querySelectorAll('[data-user-email]').forEach((elemento) => elemento.textContent = conta.email)
    document.querySelectorAll('[data-user-initials]').forEach((elemento) => elemento.textContent = gerarSigla(conta.nome))
    document.querySelectorAll('[data-plan-name]').forEach((elemento) => {
        elemento.textContent = master ? 'Acesso completo' : (estado.plano?.nome || conta.plano || 'Básico')
    })

    const demoBadge = document.getElementById('demoBadge')
    if (demoBadge) {
        const demo = ['cliente_tcc', 'administrador'].includes(conta.perfil)
        demoBadge.hidden = !demo
    }
}

function aplicarPermissoesPlano() {
    const recursos = estado.plano?.recursos || []
    const perfilDemo = estado.conta?.perfil === 'cliente_tcc'
    const master = perfilDemo && estado.conta?.acessoTotal === true
    const visita = estado.conta?.perfil === 'demonstracao'
    const portal = estado.conta?.perfil === 'portal_cliente'
    document.querySelectorAll('#accountPlans').forEach((elemento) => { elemento.hidden = portal || master })

    document.querySelectorAll('[data-recurso]').forEach((elemento) => {
        const recurso = elemento.dataset.recurso
        const permitido = master || (recurso === 'clientes' ? (!portal && recursos.includes('clientes')) : (!portal && recursos.includes(recurso)))
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
    if (recursoPagina && (recursoPagina === 'clientes' ? (portal || !recursos.includes('clientes')) : portal || !recursos.includes(recursoPagina))) {
        const conteudo = document.querySelector('.page-content')
        if (conteudo) {
            conteudo.innerHTML = `
                <section class="upgrade-state">
                    <div class="upgrade-illustration">${svgIcon('lock')}</div>
                    <span class="eyebrow">Recurso premium</span>
                    <h1>Desbloqueie esta área da Syncrypta</h1>
                    <p>Este módulo faz parte dos planos Profissional ou Empresarial. Compare os planos para liberar a experiência completa.</p>
                    <button class="button button-primary" onclick="abrirPlanos()">${svgIcon('sparkles')} Ver planos</button>
                    ${(perfilDemo || visita) ? '<p class="helper-text">Você pode alternar os planos de exemplo sem cobrança.</p>' : ''}
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

    if (estado.conta?.perfil === 'portal_cliente' && ['importacao', 'clientes', 'regras', 'auditoria', 'checkout'].includes(document.body.dataset.page)) { navegarPara('dashboard.html'); return false }
    if (estado.conta?.perfil === 'demonstracao' && document.body.dataset.page === 'checkout') { navegarPara('dashboard.html'); return false }
    iniciarMenusTopo()
    await atualizarNotificacoes()
    return true
}

function planoCardHtml(plano) {
    const recursos = {
        basico: ['Dashboard e movimentações', 'Importação CSV com revisão', 'Gráficos essenciais'],
        profissional: ['Tudo do Básico', 'Importação de Excel e OFX', 'Perfis, projeção e regras inteligentes'],
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
                ${estado.conta?.plano === plano.id ? 'Plano atual' : estado.conta?.perfil === 'demonstracao' ? 'Visualizar ' + plano.nome : 'Escolher ' + plano.nome}
            </button>
        </article>
    `
}

async function abrirPlanos() {
    if (estado.conta?.perfil === 'cliente_tcc' && estado.conta?.acessoTotal === true) return
    let planos = []
    const { resposta, dados } = await apiRequest('/api/planos')
    if (resposta.ok) planos = dados
    if (!planos.length) return

    abrirModal({
        titulo: 'Escolha a experiência ideal',
        largura: '1040px',
        conteudo: `
            <p class="modal-intro">${estado.conta?.perfil === 'demonstracao' ? 'Escolha outra visão da demonstração. Os dados são fictícios e permanecem em modo de leitura.' : 'Compare os recursos disponíveis em cada plano. Pagamentos nesta versão são apenas demonstrativos.'}</p>
            <div class="pricing-grid">${planos.map(planoCardHtml).join('')}</div>
        `
    })
}

async function selecionarPlano(planoId) {
    if (estado.conta?.plano === planoId) {
        mostrarToast('Este já é o seu plano atual.', 'aviso')
        return
    }

    if (estado.conta?.perfil === 'demonstracao') {
        const { resposta, dados } = await apiRequest('/api/demo/acesso', {
            method: 'POST', body: JSON.stringify({ plano: planoId })
        })
        if (!resposta.ok) return mostrarToast(dados.mensagem, 'erro')
        salvarSessao(dados)
        window.location.href = 'dashboard.html'
        return
    }

    const modoDemo = estado.conta?.perfil === 'cliente_tcc'

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

// Modificado para incluir tooltip
function statusClassificacaoBadge(status, confianca = 0) {
    const mapa = {
        confirmada:     ['Confirmada', 'success'],
        sugerida:       ['Sugerida', 'info'],
        revisar:        ['Revisar', 'warning'],
        nao_identificada: ['Não identificada', 'danger']
    }
    const [texto, classe] = mapa[status] || ['Pendente', 'neutral']
    
    let tooltip = "";
    if (confianca >= 70) tooltip = "Baseado em classificações semelhantes anteriores.";
    else if (confianca >= 30) tooltip = "Baixa similaridade com histórico. Revise manualmente.";
    else tooltip = "Sem correspondência no histórico. Classifique manualmente.";

    return `<span class="classification-badge classification-${classe}" data-tooltip="${tooltip}">${texto}${confianca ? ` · ${Math.round(confianca)}%` : ''}</span>`
}

async function carregarPerfisFinanceiros() {
    if (!(estado.plano?.recursos || []).includes('clientes') && !estado.conta?.acessoTotal && estado.conta?.perfil !== 'portal_cliente') {
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
    const master = estado.conta?.perfil === 'cliente_tcc' && estado.conta?.acessoTotal === true
    ids.forEach((id) => {
        const select = document.getElementById(id)
        if (!select) return
        const atual = select.value || estado.contexto.clienteId || ''
        const geral = (id.startsWith('filtro') || id.startsWith('context') || id.startsWith('relatorio')) && estado.conta?.perfil !== 'portal_cliente'
        select.innerHTML = `${geral && !master ? '<option value="">Todos os perfis</option>' : geral ? '' : estado.conta?.perfil === 'portal_cliente' ? '' : '<option value="">Sem perfil específico</option>'}${estado.clientes.map((cliente) => `<option value="${cliente.id}">${escaparHtml(cliente.nome)} · ${cliente.perfilFinanceiro === 'pj' ? 'PJ' : 'PF'}</option>`).join('')}`
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

function fecharMenusTopo() {
    for (const [panelId, buttonId] of [['notificationPanel', 'notificationToggle'], ['accountMenu', 'accountToggle']]) {
        const painel = document.getElementById(panelId)
        if (painel) painel.hidden = true
        document.getElementById(buttonId)?.setAttribute('aria-expanded', 'false')
    }
}

function iniciarMenusTopo() {
    if (!document.getElementById('accountToggle')) return
    document.addEventListener('pointerdown', (evento) => {
        if (!evento.target.closest('.topbar-popover-wrap')) fecharMenusTopo()
    })
    document.addEventListener('keydown', (evento) => {
        if (evento.key !== 'Escape') return
        const aberto = !document.getElementById('accountMenu').hidden ? 'accountToggle' : !document.getElementById('notificationPanel').hidden ? 'notificationToggle' : null
        if (aberto) { fecharMenusTopo(); document.getElementById(aberto).focus() }
    })
}

function alternarMenuConta() {
    const painel = document.getElementById('accountMenu')
    if (!painel) return
    const abrir = painel.hidden
    fecharMenusTopo()
    painel.hidden = !abrir
    document.getElementById('accountToggle').setAttribute('aria-expanded', String(abrir))
}

function chaveNotificacoesLidas() {
    return `syncrypta_notificacoes_lidas_${estado.conta?.id || 'anonimo'}`
}

function idsNotificacoesLidas() {
    try { return new Set(JSON.parse(localStorage.getItem(chaveNotificacoesLidas()) || '[]')) }
    catch { return new Set() }
}

function renderizarNotificacoes() {
    const lista = document.getElementById('listaNotificacoes')
    if (!lista) return
    const lidas = idsNotificacoesLidas()
    const pendentes = estado.notificacoes.filter((item) => !lidas.has(item.id)).length
    const contador = document.getElementById('contadorNotificacoes')
    if (contador) { contador.textContent = String(pendentes); contador.hidden = pendentes === 0 }
    const resumo = document.getElementById('resumoNotificacoes')
    if (resumo) resumo.textContent = estado.notificacoes.length ? `${pendentes} novas · ${estado.notificacoes.length} no período` : 'Nenhum aviso para o período selecionado.'
    lista.innerHTML = estado.notificacoes.length
        ? estado.notificacoes.map((item) => `<a class="popover-notification notification-${escaparHtml(item.tipo)} ${lidas.has(item.id) ? '' : 'is-unread'}" href="${escaparHtml(item.destino)}"><span class="popover-notification-icon">${svgIcon(item.tipo === 'erro' ? 'info' : 'bell')}</span><span><strong>${escaparHtml(item.titulo)}</strong><small>${escaparHtml(item.texto)}</small></span>${svgIcon('chevron')}</a>`).join('')
        : '<div class="popover-empty">Tudo em dia por aqui.</div>'
}

async function atualizarNotificacoes() {
    if (!document.getElementById('listaNotificacoes')) return
    const { resposta, dados } = await apiRequest('/api/notificacoes' + montarQuery(estado.contexto || {}))
    if (!resposta.ok) {
        document.getElementById('resumoNotificacoes').textContent = 'Não foi possível carregar os avisos.'
        return
    }
    estado.notificacoes = Array.isArray(dados.notificacoes) ? dados.notificacoes : []
    renderizarNotificacoes()
}

async function abrirNotificacoes() {
    const painel = document.getElementById('notificationPanel')
    if (!painel) return
    const abrir = painel.hidden
    fecharMenusTopo()
    if (!abrir) return
    painel.hidden = false
    document.getElementById('notificationToggle').setAttribute('aria-expanded', 'true')
    await atualizarNotificacoes()
    if (painel.hidden) return
    const lidas = idsNotificacoesLidas()
    estado.notificacoes.forEach((item) => lidas.add(item.id))
    localStorage.setItem(chaveNotificacoesLidas(), JSON.stringify([...lidas].slice(-100)))
    renderizarNotificacoes()
}

function preencherAcessoDemo(tipo) {
    const email = document.getElementById('emailLogin')
    const senha = document.getElementById('senhaLogin')
    if (!email || !senha) return
    if (tipo !== 'usuario') return
    email.value = 'demo@syncrypta.local'
    senha.value = 'Demo@2026'
    mostrarToast('Credenciais demonstrativas preenchidas.')
}

async function entrarDemonstracao(plano, botao) {
    if (botao) setCarregando(botao, true)
    const { resposta, dados } = await apiRequest('/api/demo/acesso', {
        method: 'POST', body: JSON.stringify({ plano })
    })
    if (botao) setCarregando(botao, false)
    if (!resposta.ok) return mostrarToast(dados.mensagem, 'erro')
    localStorage.removeItem('syncrypta_context_cliente')
    localStorage.removeItem('syncrypta_context_mes')
    salvarSessao(dados)
    navegarPara('dashboard.html')
}

async function configurarBotaoGoogle(botao, status) {
    if (!botao) return
    const config = window.SYNCRYPTA_FIREBASE_CONFIG
    if (config?.apiKey && config?.authDomain && config?.projectId && config?.appId) {
        const { resposta, dados } = await apiRequest('/api/firebase/config')
        if (!resposta.ok || !dados.habilitado || dados.projectId !== config.projectId) {
            if (status) status.textContent = 'Confira FIREBASE_PROJECT_ID no backend: deve ser igual ao projectId em firebase-config.js.'
            return
        }
        try {
            const { iniciarAcessoFirebase } = await import('./firebase-login.mjs?v=4.7.1')
            await iniciarAcessoFirebase({ botao, config, apiUrl: API_URL, salvarSessao, limparSessao, navegarPara, mostrarToast })
            botao.disabled = false
            if (status) status.textContent = 'Escolha uma conta na janela do Google. Seu primeiro acesso cria um plano Básico vazio.'
        } catch (erro) {
            if (status) status.textContent = 'Não foi possível carregar o Firebase. Confira sua conexão e a configuração.'
            console.error('Firebase:', erro)
        }
        return
    }
    const { resposta, dados } = await apiRequest('/api/google/config')
    botao.disabled = !(resposta.ok && dados.habilitado)
    if (resposta.ok && dados.habilitado) {
        botao.addEventListener('click', () => { location.href = API_URL + '/api/google/iniciar' })
        if (status) status.textContent = 'Escolha sua conta Google. No primeiro acesso, seu plano Básico começará vazio.'
    } else if (status) {
        status.textContent = 'Configure Firebase ou Google OAuth para ativar o acesso com Google.'
    }
}

async function iniciarLogin() {
    const formulario = document.getElementById('formLogin')
    if (!formulario || formulario.dataset.loginInicializado === 'true') return
    const fragmento = new URLSearchParams(location.hash.slice(1))
    if (fragmento.has('google_token')) {
        const token = fragmento.get('google_token')
        history.replaceState(null, '', location.pathname + location.search)
        salvarSessao({ token, usuario: {} })
        const { resposta, dados } = await apiRequest('/api/minha-conta')
        if (resposta.ok) { if (dados.usuario?.preferencias) guardarPreferencias(dados.usuario.preferencias); return navegarPara(paginaInicialDe(dados.usuario?.preferencias)) }
        limparSessao()
    } else if (fragmento.has('google_error')) {
        history.replaceState(null, '', location.pathname + location.search)
        mostrarToast(fragmento.get('google_error'), 'erro')
    } else if (fragmento.has('google_cadastro')) {
        history.replaceState(null, '', location.pathname + location.search)
        limparSessao()
        mostrarToast('Conta Básica criada. Agora entre pelo mesmo botão usado no cadastro.')
    }
    configurarBotaoGoogle(document.getElementById('loginGoogle'), document.getElementById('estadoProvedores'))

    // Recupera uma sessão válida quando o navegador ficou no login após
    // uma atualização ou carregou um arquivo JavaScript antigo do cache.
    if (pegarToken()) {
        const verificacao = await apiRequest('/api/minha-conta')
        if (verificacao.resposta.ok) {
            navegarPara(paginaInicialDe(verificacao.dados.usuario?.preferencias))
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
                const preferencias = verificacao.dados.usuario?.preferencias
                if (preferencias) guardarPreferencias(preferencias, { grafico: true })
                navegarPara(paginaInicialDe(preferencias))
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

async function iniciarPainelGoogle() {
    const painel = document.getElementById('painelGoogle')
    if (!painel || !['cliente_tcc', 'portal_cliente', 'usuario'].includes(estado.conta?.perfil)) return
    const { resposta, dados } = await apiRequest('/api/google/config')
    if (!resposta.ok || !dados.habilitado) return
    painel.hidden = false
    const portal = estado.conta.perfil === 'portal_cliente'
    const master = estado.conta.perfil === 'cliente_tcc'
    const titulo = document.getElementById('estadoGoogle')
    const conectar = document.getElementById('conectarGoogle')
    const sincronizar = document.getElementById('sincronizarGoogle')
    conectar.textContent = master ? 'Vincular Google e Drive' : 'Vincular meu Google'
    if (!master) {
        const vinculo = await apiRequest('/api/google/minha-vinculacao')
        titulo.textContent = vinculo.dados.vinculado ? 'Google vinculado a esta conta.' : 'Vincule a mesma conta Google deste e-mail para entrar por ela.'
        document.getElementById('detalheGoogle').textContent = portal ? 'Seu acesso é somente leitura e mostra apenas os dados deste perfil.' : 'Se você criou a conta pelo Google, o vínculo já está ativo. Seus lançamentos ficam nesta conta.'
        conectar.hidden = Boolean(vinculo.dados.vinculado)
    } else {
        const status = await apiRequest('/api/google/status')
        if (status.resposta.ok) {
            titulo.textContent = status.dados.conectado ? `Conectado: ${status.dados.email}` : 'Conecte a conta master para salvar os dados no Drive.'
            sincronizar.hidden = !status.dados.conectado
            document.getElementById('detalheGoogle').textContent = status.dados.erro ? `Última tentativa falhou: ${status.dados.erro}` : status.dados.ultimaSincronizacao ? `Última cópia: ${formatarDataHora(status.dados.ultimaSincronizacao)}.` : 'As alterações do master serão copiadas após a vinculação.'
        }
    }
    conectar.onclick = async () => {
        const respostaConexao = await apiRequest(master ? '/api/google/conectar' : '/api/google/vincular', { method: 'POST' })
        if (respostaConexao.resposta.ok) location.href = respostaConexao.dados.url
        else mostrarToast(respostaConexao.dados.mensagem || 'Não foi possível conectar.', 'erro')
    }
    sincronizar.onclick = async () => {
        sincronizar.disabled = true
        const r = await apiRequest('/api/google/sincronizar', { method: 'POST' })
        mostrarToast(r.dados.mensagem || 'Não foi possível salvar.', r.resposta.ok ? 'sucesso' : 'erro')
        sincronizar.disabled = false
        if (r.resposta.ok) iniciarPainelGoogle()
    }
}

function iniciarCadastro() {
    const formulario = document.getElementById('formCadastro')
    if (!formulario) return
    configurarBotaoGoogle(document.getElementById('cadastroGoogle'), document.getElementById('estadoCadastroGoogle'))
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


// Tabela detalhada e exportações compartilham exatamente a mesma seleção.
function filtrarDadosRelatorio(dados) {
    const campo = (id) => document.getElementById(id)?.value || ''
    const busca = normalizarBusca(campo('relBusca'))
    return (Array.isArray(dados) ? dados : dados?.movimentacoes || []).filter((item) =>
        (!campo('relTipo') || item.tipo === campo('relTipo')) &&
        (!campo('relCategoria') || item.categoria === campo('relCategoria')) &&
        (!campo('relStatus') || item.statusClassificacao === campo('relStatus')) &&
        (!campo('relInicio') || item.data >= campo('relInicio')) &&
        (!campo('relFim') || item.data <= campo('relFim')) &&
        (!busca || normalizarBusca(item.descricao).includes(busca)))
}
function renderizarFiltroRelatorio() {
    const todos = estado.relatorioAtual?.movimentacoes || []
    const seletor = document.getElementById('relCategoria')
    if (seletor) {
        const valor = seletor.value
        seletor.innerHTML = '<option value="">Todas as categorias</option>' + [...new Set(todos.map((m) => m.categoria))].sort().map((c) => `<option value="${escaparHtml(c)}">${escaparHtml(c)}</option>`).join('')
        seletor.value = valor
    }
    const lista = filtrarDadosRelatorio(todos).reverse()
    document.getElementById('relContagem').textContent = `${lista.length} lançamento(s)`
    document.getElementById('relatorioMovimentacoes').innerHTML = lista.length ? lista.map((item) => `<tr><td>${formatarData(item.data)}</td><td>${escaparHtml(item.descricao)}</td><td>${tipoBadge(item.tipo)}</td><td>${escaparHtml(item.categoria)} / ${escaparHtml(item.subcategoria || 'A classificar')}</td><td>${origemLabel(item.origem)}</td><td class="${item.tipo === 'receita' ? 'value-positive' : 'value-negative'}">${item.tipo === 'receita' ? '+' : '−'} ${formatarValorLancamento(item)}</td></tr>`).join('') : linhaVazia(6, 'Nenhuma movimentação com esses filtros.')
}
function abrirCategoriaRelatorio(e) {
    const linha = e.target.closest('[data-categoria]')
    if (linha && estado.relatorioAtual) abrirModalCategoria(linha.dataset.categoria, estado.relatorioAtual)
}
async function criarAcessoCliente(id) {
    const item = estado.clientes.find((c) => String(c.id) === String(id))
    if (!item) return
    abrirModal({ titulo: `Acesso de ${escaparHtml(item.nome)}`, largura: '520px', conteudo: `<p>Esta conta poderá ver somente os dados deste perfil.</p><form id="formAcesso" class="form-grid"><label class="input-group">E-mail do cliente<input required type="email" class="input" name="email" autocomplete="off"></label><label class="input-group">Senha inicial (12 caracteres ou mais)<input required minlength="12" type="password" class="input" name="senha" autocomplete="new-password"></label><div class="modal-actions"><button type="button" class="button button-ghost" onclick="fecharModalGeral()">Cancelar</button><button class="button button-primary">Criar acesso</button></div></form>` })
    document.getElementById('formAcesso').onsubmit = async (e) => {
        e.preventDefault()
        const form = new FormData(e.target)
        const { resposta, dados } = await apiRequest(`/api/clientes/${id}/acesso`, { method: 'POST', body: JSON.stringify({ email: form.get('email'), senha: form.get('senha') }) })
        mostrarToast(dados.mensagem, resposta.ok ? 'sucesso' : 'erro')
        if (resposta.ok) fecharModalGeral()
    }
}

function abrirPerfilFinanceiro(id) {
    localStorage.setItem('syncrypta_context_cliente', String(id))
    window.location.href = 'dashboard.html'
}

// Conversão de referência: o câmbio é informado pelo usuário; dados armazenados permanecem em BRL.
function iniciarConversor() {
    document.getElementById('formConversor')?.addEventListener('input', () => {
        const dolares = Number(document.getElementById('valorDolar').value)
        const taxa = Number(document.getElementById('cotacaoDolar').value)
        document.getElementById('resultadoConversao').textContent = dolares >= 0 && taxa > 0 ? formatarMoeda(dolares * taxa) : 'Informe valor e cotação válidos'
    })
}

let calendarioDados = null
let inicioSelecao = null
function renderizarCalendario(dados) {
    calendarioDados = dados
    const alvo = document.getElementById('diasCalendario')
    if (!alvo) return
    const modo = document.getElementById('modoCalendario').value
    const seletorPrevisao = document.getElementById('mesPrevisaoCalendario')
    if (seletorPrevisao) {
        const escolhido = seletorPrevisao.value
        seletorPrevisao.innerHTML = (dados.projecao?.proximosMeses || []).map((item) => `<option value="${item.mes}">${formatarMes(item.mes)}</option>`).join('')
        if ([...seletorPrevisao.options].some((option) => option.value === escolhido)) seletorPrevisao.value = escolhido
        seletorPrevisao.disabled = modo !== 'previsao'
    }
    const mes = modo === 'previsao' ? seletorPrevisao?.value || dados.projecao?.proximosMeses?.[0]?.mes || mesAtual() : dados.contexto.mes || mesAtual()
    const [ano, numeroMes] = mes.split('-').map(Number)
    const ultimo = new Date(ano, numeroMes, 0).getDate()
    const primeiro = new Date(ano, numeroMes - 1, 1).getDay()
    const intervalo = Array.from({ length: ultimo }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`)
    const proj = dados.projecao?.proximosMeses?.find((item) => item.mes === mes)
    alvo.innerHTML = '<span class="cal-vazio"></span>'.repeat(primeiro) + intervalo.map((dia, i) => {
        const movimentos = (dados.movimentacoes || []).filter((m) => m.data === dia)
        const real = movimentos.reduce((s, m) => s + Number(m.valor) * (m.tipo === 'receita' ? 1 : -1), 0)
        const previsto = Number(proj?.saldo || 0) / ultimo
        const valor = modo === 'real' ? real : previsto
        return `<button type="button" class="cal-dia ${valor < 0 ? 'cal-negativo' : valor > 0 ? 'cal-positivo' : ''}" data-dia="${dia}" aria-label="${formatarData(dia)}, ${modo === 'real' ? 'real' : 'previsão'} ${formatarMoeda(valor)}"><strong>${i + 1}</strong><small>${valor ? formatarMoeda(valor) : '—'}</small></button>`
    }).join('')
    document.getElementById('tituloCalendario').textContent = `${formatarMes(mes)} · ${modo === 'real' ? 'Lançamentos reais' : 'Estimativa mensal distribuída por dia, sem datas de vencimento'}`
}
function iniciarCalendario() {
    const alvo = document.getElementById('diasCalendario')
    if (!alvo) return
    document.getElementById('modoCalendario').addEventListener('change', () => renderizarCalendario(calendarioDados))
    document.getElementById('mesPrevisaoCalendario')?.addEventListener('change', () => renderizarCalendario(calendarioDados))
    alvo.addEventListener('click', (e) => { const dia = e.target.closest('[data-dia]'); if (e.detail === 0 && dia) { marcarDias(dia.dataset.dia, dia.dataset.dia); detalharDias(dia.dataset.dia, dia.dataset.dia) } })
    alvo.addEventListener('pointerdown', (e) => {
        const dia = e.target.closest('[data-dia]')
        if (!dia) return
        inicioSelecao = dia.dataset.dia
        alvo.setPointerCapture(e.pointerId)
        marcarDias(inicioSelecao, inicioSelecao)
    })
    alvo.addEventListener('pointermove', (e) => {
        if (!inicioSelecao) return
        const dia = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-dia]')
        if (dia && alvo.contains(dia)) marcarDias(inicioSelecao, dia.dataset.dia)
    })
    alvo.addEventListener('pointerup', (e) => {
        if (!inicioSelecao) return
        const dia = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-dia]')
        const fim = dia && alvo.contains(dia) ? dia.dataset.dia : inicioSelecao
        marcarDias(inicioSelecao, fim)
        detalharDias(inicioSelecao, fim)
        inicioSelecao = null
    })
    alvo.addEventListener('pointercancel', () => { inicioSelecao = null })
}
function marcarDias(inicio, fim) {
    const [de, ate] = [inicio, fim].sort()
    document.querySelectorAll('#diasCalendario [data-dia]').forEach((d) => d.classList.toggle('cal-selecionado', d.dataset.dia >= de && d.dataset.dia <= ate))
}
function detalharDias(inicio, fim) {
    const [de, ate] = [inicio, fim].sort()
    const modo = document.getElementById('modoCalendario').value
    const movimentos = (calendarioDados?.movimentacoes || []).filter((m) => m.data >= de && m.data <= ate)
    const dias = Math.round((new Date(ate + 'T12:00:00') - new Date(de + 'T12:00:00')) / 86400000) + 1
    const mes = modo === 'previsao' ? document.getElementById('mesPrevisaoCalendario')?.value : calendarioDados.contexto.mes || mesAtual()
    const proj = calendarioDados?.projecao?.proximosMeses?.find((item) => item.mes === mes)
    const quantidade = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5)), 0).getDate()
    abrirModal({ titulo: `${modo === 'real' ? 'Realizado' : 'Previsão'} · ${formatarData(de)} a ${formatarData(ate)}`, conteudo: modo === 'real' ? `<p>${movimentos.length} movimentações · total ${formatarMoeda(movimentos.reduce((s, m) => s + Number(m.valor) * (m.tipo === 'receita' ? 1 : -1), 0))}</p><div class="table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead><tbody>${movimentos.map((m) => `<tr><td>${formatarData(m.data)}</td><td>${escaparHtml(m.descricao)}</td><td>${escaparHtml(m.categoria)}</td><td class="${m.tipo === 'receita' ? 'value-positive' : 'value-negative'}">${m.tipo === 'receita' ? '+' : '−'} ${formatarValorLancamento(m)}</td></tr>`).join('') || linhaVazia(4, 'Sem lançamentos nesses dias.')}</tbody></table></div>` : `<p>Estimativa ilustrativa de ${dias} dia(s), dividindo o total mensal igualmente. Não representa datas de vencimento.</p><p>Recebimentos: <strong class="value-positive">${formatarMoeda(Number(proj?.recebimentos || 0) * dias / quantidade)}</strong> · Pagamentos: <strong class="value-negative">${formatarMoeda(Number(proj?.pagamentos || 0) * dias / quantidade)}</strong></p><strong>Resultado previsto: ${formatarMoeda(Number(proj?.saldo || 0) * dias / quantidade)}</strong>` })
}

// ==========================================================
// DASHBOARD
// ==========================================================

async function carregarDashboard() {
    const filtros = contextoDosControles('context')
    const filtroGraficos = { status: document.getElementById('chartStatus')?.value || '', categoria: document.getElementById('chartCategoria')?.value || '' }
    estado.contexto = filtros
    const { resposta, dados } = await apiRequest('/api/dashboard' + montarQuery(filtros))
    if (!resposta.ok) return
    estado.ultimoDashboard = dados
    const seletorCategoria = document.getElementById('chartCategoria')
    if (seletorCategoria) {
        const atual = seletorCategoria.value
        seletorCategoria.innerHTML = '<option value="">Todas as categorias</option>' + [...new Set(dados.movimentacoes.map((item) => item.categoria).filter(Boolean))].sort().map((categoria) => `<option value="${escaparHtml(categoria)}">${escaparHtml(categoria)}</option>`).join('')
        seletorCategoria.value = atual
        filtroGraficos.categoria = seletorCategoria.value
    }
    const resumoCliente = document.getElementById('resumoMeuPerfil')
    if (resumoCliente && estado.conta?.perfil === 'portal_cliente') {
        resumoCliente.hidden = false
        const categoria = Object.entries(dados.categoriasDespesas || {}).sort((a, b) => b[1] - a[1])[0]
        const anterior = Number(dados.comparacao?.saldoAnterior || 0)
        resumoCliente.innerHTML = `<span class="eyebrow">MEU PERFIL · ${escaparHtml(dados.contexto.clienteNome)}</span><h2>Como está meu resultado?</h2><div class="portal-performance-grid"><div><small>Recebimentos</small><strong class="value-positive">${formatarMoeda(dados.totalRecebido)}</strong></div><div><small>Pagamentos</small><strong class="value-negative">${formatarMoeda(dados.totalPago)}</strong></div><div><small>Resultado do período</small><strong class="${dados.saldoFinal >= 0 ? 'value-positive' : 'value-negative'}">${formatarMoeda(dados.saldoFinal)}</strong></div><div><small>Comparação</small><strong class="${dados.saldoFinal - anterior >= 0 ? 'value-positive' : 'value-negative'}">${anterior ? `${dados.saldoFinal >= anterior ? '▲' : '▼'} ${formatarMoeda(Math.abs(dados.saldoFinal - anterior))}` : 'Sem base anterior'}</strong></div></div><p>${categoria ? `Maior categoria de pagamentos: ${escaparHtml(categoria[0])} (${formatarMoeda(categoria[1])}).` : 'Ainda não há pagamentos classificados neste período.'}</p>`
    }

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
    document.getElementById('saldoFinal')?.classList.toggle('value-negative', dados.saldoFinal < 0)
    document.getElementById('saldoFinal')?.classList.toggle('value-positive', dados.saldoFinal >= 0)
    document.getElementById('projecaoSaldo')?.classList.toggle('value-negative', dados.projecao.saldoProjetado < 0)
    document.getElementById('projecaoSaldo')?.classList.toggle('value-positive', dados.projecao.saldoProjetado >= 0)
    document.getElementById('comparacaoMes')?.classList.toggle('value-negative', variacao < 0)
    document.getElementById('comparacaoMes')?.classList.toggle('value-positive', variacao >= 0)
    document.getElementById('comparacaoMes').textContent = dados.comparacao?.mesAnterior && dados.movimentacoes.length
        ?`${variacao >= 0 ? '▲' : '▼'} ${Math.abs(variacao).toFixed(1)}% em relação a ${formatarMes(dados.comparacao.mesAnterior)}.`
        : 'Sem comparação disponível.'

    document.getElementById('reviewConfirmadas').textContent = dados.revisao.confirmadas
    document.getElementById('reviewSugeridas').textContent = dados.revisao.sugeridas
    document.getElementById('reviewPendentes').textContent = dados.revisao.revisar + dados.revisao.naoIdentificadas

    // ===== KPIs dinâmicos (Correção do bug) =====
    const clientesAtivos = estado.clientes ? estado.clientes.filter(c => c.status === 'Ativo').length : 0;
    const totalMovimentacoes = dados.movimentacoes.length || 0;
    const confirmadas = dados.movimentacoes.filter(m => m.statusClassificacao === 'confirmada').length || 0;
    const taxaClassificacao = totalMovimentacoes > 0 ? Math.round(confirmadas / totalMovimentacoes * 100) : 0;
    const totalConfirmadas = confirmadas;

    document.getElementById('kpiClientesAtivos').textContent = clientesAtivos;
    document.getElementById('kpiMovimentacoes').textContent = totalMovimentacoes.toLocaleString('pt-BR');
    document.getElementById('kpiClassificacao').textContent = `${taxaClassificacao}%`;
    document.getElementById('kpiEconomia').textContent = totalConfirmadas.toLocaleString('pt-BR');
    // =========================================

    const inputSaldo = document.getElementById('saldoInicialInput')
    if (inputSaldo && document.activeElement !== inputSaldo) inputSaldo.value = Number(dados.saldoInicial || 0).toFixed(2)

    const tabela = document.getElementById('tabelaUltimas')
    tabela.innerHTML = dados.ultimasMovimentacoes.length
        ? dados.ultimasMovimentacoes.map((item) => `<tr><td><div class="table-main"><span class="table-icon">${svgIcon(item.tipo === 'receita' ? 'arrowUp' : 'arrowDown')}</span><div><strong>${escaparHtml(item.descricao)}</strong><small>${escaparHtml(item.contraparte || 'Sem contraparte')}</small></div></div></td><td><strong>${escaparHtml(item.categoria)}</strong><small class="table-subline">${escaparHtml(item.subcategoria || 'A classificar')}</small></td><td>${origemLabel(item.origem)}</td><td class="${item.tipo === 'receita' ? 'value-positive' : 'value-negative'}">${item.tipo === 'receita' ? '+' : '−'} ${formatarValorLancamento(item)}</td><td>${formatarData(item.data)}</td><td>${statusClassificacaoBadge(item.statusClassificacao, item.confianca)}</td></tr>`).join('')
        : linhaVazia(6, 'Nenhuma movimentação no contexto selecionado.')

    renderizarCalendario(dados)
    const carteira = document.querySelector('.portfolio-section')
    if (carteira) carteira.hidden = !['cliente_tcc', 'demonstracao'].includes(estado.conta?.perfil)
    if (['cliente_tcc', 'demonstracao'].includes(estado.conta?.perfil)) await renderizarCarteiraClientes(filtros.mes)
    renderizarProjecao(dados.projecao)
    renderizarOutliers(dados.foraDoPadrao, 'outlierList')
    if (filtroGraficos.status || filtroGraficos.categoria) {
        const filtrado = await apiRequest('/api/dashboard' + montarQuery({ ...filtros, ...filtroGraficos }))
        criarGraficosDashboard(filtrado.resposta.ok ? filtrado.dados : dados)
    } else criarGraficosDashboard(dados)
    await atualizarNotificacoes(dados)
}


async function renderizarCarteiraClientes(mes) {
    const grade = document.querySelector('.portfolio-grid')
    const resumo = document.querySelector('.portfolio-summary')
    if (!grade || !resumo) return
    const resultados = await Promise.all(estado.clientes.map(async (cliente) => {
        const { resposta, dados } = await apiRequest('/api/dashboard' + montarQuery({ clienteId: cliente.id, mes }))
        return resposta.ok ? { cliente, dados } : null
    }))
    const lista = resultados.filter(Boolean)
    grade.innerHTML = lista.length ? lista.map(({ cliente, dados }) => {
        const situacao = dados.saldoFinal < 0 ? 'Crítico' : dados.saudeFinanceira < 55 ? 'Atenção' : 'Saudável'
        const classe = situacao === 'Crítico' ? 'critical' : situacao === 'Atenção' ? 'attention' : 'healthy'
        const tipo = cliente.perfilFinanceiro === 'pf' ? 'personal' : 'business'
        return `<article class="portfolio-client ${classe} ${tipo}"><div class="client-top"><span class="client-badge">${svgIcon('building')}</span><strong>${escaparHtml(cliente.nome)}</strong></div><small>${situacao} · ${formatarMoeda(dados.saldoFinal)}</small></article>`
    }).join('') : estado.conta?.perfil === 'demonstracao'
        ? '<p>Os perfis de exemplo aparecem nos planos Profissional e Empresarial.</p>'
        : '<p>Cadastre perfis para acompanhar a carteira.</p>'
    const contagem = { 'Saudáveis': 0, 'Em atenção': 0, 'Críticos': 0 }
    lista.forEach(({ dados }) => { if (dados.saldoFinal < 0) contagem['Críticos']++; else if (dados.saudeFinanceira < 55) contagem['Em atenção']++; else contagem['Saudáveis']++ })
    resumo.innerHTML = Object.entries({ Clientes: lista.length, ...contagem }).map(([nome, numero]) => `<article><span>${nome}</span><strong>${numero}</strong></article>`).join('')
}

function renderizarProjecao(projecao) {
    const linha = document.getElementById('projectionTimeline')
    if (linha) {
        linha.innerHTML = projecao?.proximosMeses?.length
            ? projecao.proximosMeses.map((item) => `<article class="projection-month"><span>${formatarMes(item.mes)}</span><strong class="${item.saldo >= 0 ? 'value-positive' : 'value-negative'}">${formatarMoeda(item.saldo)}</strong><small>Receitas ${formatarMoeda(item.recebimentos)}</small><small>Pagamentos ${formatarMoeda(item.pagamentos)}</small></article>`).join('')
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
        ? itens.map((item) => `<div class="notification-item notification-aviso"><div class="notification-icon">${svgIcon('trend')}</div><div><strong>${escaparHtml(item.descricao)}</strong><p>${formatarValorLancamento(item)} · ${escaparHtml(item.categoria)} / ${escaparHtml(item.subcategoria || 'A classificar')}</p></div></div>`).join('')
        : '<div class="empty-compact">Nenhum gasto fora do padrão foi detectado.</div>'
}

function criarGraficosDashboard(dados) {
    if (!window.Chart) return
    Object.values(estado.graficos).forEach((grafico) => grafico?.destroy?.())
    estado.graficos = {}

    const tipoFluxo = document.getElementById('chartTypeSelector')?.value || localStorage.getItem('syncrypta_chart_fluxo') || 'bar'

    const tipoCategoriaRadio = document.querySelector('input[name="categoryChartType"]:checked')
    const tipoCategoria = tipoCategoriaRadio?.value || localStorage.getItem('syncrypta_chart_categoria') || 'bar'

    const fluxoCanvas = document.getElementById('graficoFluxoMensal')
    const categoriaCanvas = document.getElementById('graficoCategorias')

    const grade = 'rgba(121, 222, 244, .13)'
    const corTexto = '#a3ccf8'
    const formatoCurto = (valor) => Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(valor)
    const estiloDica = {
        backgroundColor: '#102641', borderColor: 'rgba(74, 210, 240, .48)', borderWidth: 1,
        titleColor: '#ffffff', bodyColor: '#d5e3f3', padding: 12,
        callbacks: { label: (item) => `${item.dataset.label || 'Valor'}: ${formatarMoeda(typeof item.parsed === 'number' ? item.parsed : item.chart.options.indexAxis === 'y' ? item.parsed.x : item.parsed.y)}` }
    }
    const brilho = {
        id: 'brilhoSyncrypta',
        beforeDatasetDraw(chart, args) { chart.ctx.save(); chart.ctx.shadowColor = args.index === 0 ? 'rgba(0, 209, 255, .32)' : 'rgba(177, 76, 255, .28)'; chart.ctx.shadowBlur = 16 },
        afterDatasetDraw(chart) { chart.ctx.restore() }
    }
    const gradiente = (canvas, topo, base) => {
        const contexto = canvas.getContext('2d')
        const cor = contexto.createLinearGradient(0, 0, 0, 340)
        cor.addColorStop(0, topo)
        cor.addColorStop(1, base)
        return cor
    }
    // Gráfico sem dados fica recolhido, com um aviso curto, em vez de um bloco vazio grande.
    const recolherGrafico = (canvas, vazio, mensagem) => {
        const painel = canvas?.closest('.chart-panel')
        if (!painel) return
        painel.classList.toggle('chart-empty', vazio)
        let aviso = painel.querySelector('.chart-empty-note')
        if (vazio && !aviso) {
            aviso = document.createElement('div')
            aviso.className = 'chart-empty-note'
            painel.appendChild(aviso)
        }
        if (aviso) aviso.textContent = vazio ? mensagem : ''
    }
    const mesesComDados = dados.meses.filter((item) => item.receitas || item.pagamentos)
    const resumoFluxo = document.getElementById('fluxoChartResumo')
    if (resumoFluxo) resumoFluxo.textContent = mesesComDados.length
        ? `${mesesComDados.length} ${mesesComDados.length === 1 ? 'mês' : 'meses'} com dados · ${formatarMoeda(dados.meses.reduce((soma, item) => soma + item.receitas - item.pagamentos, 0))} líquido`
        : 'Sem histórico para este perfil'
    recolherGrafico(fluxoCanvas, !mesesComDados.length, 'Ainda não há movimentações nos últimos meses. O gráfico aparece assim que você lançar ou importar a primeira.')
    const navMeses = document.getElementById('fluxoMonthLinks')
    if (navMeses) {
        navMeses.innerHTML = dados.meses.map((item) => `<button type="button" class="chart-month-link" data-mes="${item.mes}" aria-label="Ver movimentações de ${formatarMes(item.mes)}">${formatarMes(item.mes)}</button>`).join('')
        navMeses.querySelectorAll('button').forEach((botao) => botao.addEventListener('click', () => abrirDetalheMes(botao.dataset.mes, dados.contexto)))
    }

    if (fluxoCanvas) {
        const areaVerde = gradiente(fluxoCanvas, 'rgba(0, 209, 255, .96)', 'rgba(10, 107, 129, .65)')
        const areaVermelha = gradiente(fluxoCanvas, 'rgba(177, 76, 255, .98)', 'rgba(108, 15, 179, .66)')
        estado.graficos.fluxo = new Chart(fluxoCanvas, {
            type: tipoFluxo,
            data: {
                labels: dados.meses.map((item) => formatarMes(item.mes).replace(' de ', '/')),
                datasets: [
                    { label: 'Recebimentos', data: dados.meses.map((item) => item.receitas), backgroundColor: areaVerde, borderColor: '#00d1ff', borderWidth: 2.5, borderRadius: 9, maxBarThickness: 32, pointBackgroundColor: '#00d1ff', pointRadius: 4, pointHoverRadius: 7, tension: .36, fill: tipoFluxo === 'line' },
                    { label: 'Pagamentos', data: dados.meses.map((item) => item.pagamentos), backgroundColor: areaVermelha, borderColor: '#b14cff', borderWidth: 2.5, borderRadius: 9, maxBarThickness: 32, pointBackgroundColor: '#b14cff', pointRadius: 4, pointHoverRadius: 7, tension: .36, fill: tipoFluxo === 'line' }
                ]
            },
            plugins: [brilho],
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { labels: { color: '#e6f2ff', usePointStyle: true, boxWidth: 8, padding: 18 } }, tooltip: estiloDica },
                scales: {
                    y: { beginAtZero: true, grid: { color: grade, drawTicks: false }, border: { display: false }, ticks: { color: corTexto, padding: 10, callback: formatoCurto } },
                    x: { grid: { display: false }, border: { display: false }, ticks: { color: corTexto, maxRotation: 0 } }
                },
                onClick: (evento, pontos) => { if (pontos.length) abrirDetalheMes(dados.meses[pontos[0].index].mes, dados.contexto) },
                onHover: (evento, pontos) => { if (evento.native?.target) evento.native.target.style.cursor = pontos.length ? 'pointer' : 'default' }
            }
        })
    }

    if (categoriaCanvas) {
        const entradas = Object.entries(dados.categoriasDespesas || {}).sort((a, b) => b[1] - a[1])
        const resumo = document.getElementById('categoriaChartResumo')
        if (resumo) resumo.textContent = entradas.length ? `${entradas.length} ${entradas.length === 1 ? 'categoria' : 'categorias'} · ${formatarMoeda(entradas.reduce((soma, [, valor]) => soma + valor, 0))}` : 'Nenhuma despesa no período'
        recolherGrafico(categoriaCanvas, !entradas.length, 'Nenhum pagamento neste período. Os gastos por categoria aparecem aqui quando houver despesas.')
        const altura = categoriaCanvas.parentElement
        if (altura) altura.style.height = tipoCategoria === 'bar' ? `${Math.min(430, Math.max(260, entradas.length * 42))}px` : '310px'
        // Paleta oficial: ciano, azul, roxo, roxo claro, cinza médio e variações claras
        const cores = ['#00D1FF', '#007BFF', '#7B3DFF', '#B14CFF', '#8A9BB0', '#66E3FF', '#5AA8FF', '#A37BFF']
        estado.graficos.categorias = new Chart(categoriaCanvas, {
            type: tipoCategoria,
            data: { labels: entradas.map(([nome]) => nome), datasets: [{ label: 'Gastos', data: entradas.map(([, valor]) => valor), backgroundColor: entradas.map((_, indice) => cores[indice % cores.length]), borderColor: '#0d2038', borderWidth: tipoCategoria === 'bar' ? 0 : 2, borderRadius: tipoCategoria === 'bar' ? 8 : 0, maxBarThickness: 22, hoverOffset: 9 }] },
            options: {
                responsive: true, maintainAspectRatio: false, indexAxis: tipoCategoria === 'bar' ? 'y' : 'x',
                plugins: { tooltip: estiloDica, legend: { display: tipoCategoria !== 'bar', position: 'bottom', labels: { color: corTexto, usePointStyle: true, boxWidth: 8, padding: 12 } } },
                scales: tipoCategoria === 'bar' ? {
                    x: { beginAtZero: true, grid: { color: grade }, border: { display: false }, ticks: { color: corTexto, callback: formatoCurto } },
                    y: { grid: { display: false }, border: { display: false }, ticks: { color: corTexto, callback: (valor) => String(entradas[valor]?.[0] || '').slice(0, 17) } }
                } : {},
                onClick: (evento, elementos) => {
                    if (!elementos.length) return
                    const [nomeCategoria] = entradas[elementos[0].index]
                    abrirModalCategoria(nomeCategoria, dados)
                },
                onHover: (evento, elementos) => {
                    evento.native.target.style.cursor = elementos.length ? 'pointer' : 'default'
                }
            }
        })
    }
}

async function abrirDetalheMes(mes, contexto) {
    if (!/^\d{4}-\d{2}$/.test(mes)) return
    const filtros = { clienteId: contexto.clienteId, origem: contexto.origem, status: document.getElementById('chartStatus')?.value || '', categoria: document.getElementById('chartCategoria')?.value || '', mes }
    const { resposta, dados } = await apiRequest('/api/dashboard' + montarQuery(filtros))
    if (!resposta.ok) return mostrarToast('Não foi possível abrir as movimentações deste mês.', 'erro')
    abrirModal({
        titulo: `Movimentações de ${formatarMes(mes)}`,
        conteudo: `<div class="drawer-summary"><span>Recebimentos ${formatarMoeda(dados.totalRecebido)} · Pagamentos ${formatarMoeda(dados.totalPago)}</span><strong class="${dados.saldoFinal >= 0 ? 'value-positive' : 'value-negative'}">Saldo ${formatarMoeda(dados.saldoFinal)}</strong></div>
            <div class="table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead><tbody>
            ${dados.movimentacoes.length ? dados.movimentacoes.map((item) => `<tr><td>${formatarData(item.data)}</td><td>${escaparHtml(item.descricao)}</td><td>${escaparHtml(item.categoria)}</td><td class="${item.tipo === 'receita' ? 'value-positive' : 'value-negative'}">${item.tipo === 'receita' ? '+' : '−'} ${formatarValorLancamento(item)}</td></tr>`).join('') : linhaVazia(4, 'Nenhuma movimentação neste mês.')}</tbody></table></div>`
    })
}

function abrirModalCategoria(nomeCategoria, dados) {
    const movimentacoes = (dados.movimentacoes || []).filter((item) => item.categoria === nomeCategoria && item.tipo !== 'receita')
    const total = movimentacoes.reduce((soma, item) => soma + Number(item.valor), 0)

    const subcategorias = {}
    movimentacoes.forEach((item) => {
        const chave = item.subcategoria || 'A classificar'
        subcategorias[chave] = (subcategorias[chave] || 0) + Number(item.valor)
    })
    const entradasSub = Object.entries(subcategorias).sort((a, b) => b[1] - a[1])

    abrirModal({
        titulo: `Gastos com ${escaparHtml(nomeCategoria)}`,
        conteudo: `
            <div class="drawer-summary">
                <span>Total no período</span>
                <strong>${formatarMoeda(total)}</strong>
            </div>
            <div class="drawer-history">
                <h4>Subcategorias</h4>
                ${entradasSub.length ? entradasSub.map(([nome, valor]) => `<div class="drawer-history-item"><span class="history-dot"></span><div><strong>${escaparHtml(nome)}</strong><small>${formatarMoeda(valor)} · ${total ? (valor / total * 100).toFixed(1) : 0}%</small></div></div>`).join('') : '<div class="empty-compact">Sem subcategorias registradas.</div>'}
            </div>
            <div class="table-wrap">
                <table class="data-table">
                    <thead><tr><th>Data</th><th>Descrição</th><th>Subcategoria</th><th>Valor</th></tr></thead>
                    <tbody>
                        ${movimentacoes.length ? [...movimentacoes].sort((a, b) => String(b.data).localeCompare(String(a.data))).map((item) => `<tr><td>${formatarData(item.data)}</td><td>${escaparHtml(item.descricao)}</td><td>${escaparHtml(item.subcategoria || 'A classificar')}</td><td>${formatarValorLancamento(item)}</td></tr>`).join('') : linhaVazia(4, 'Nenhuma movimentação encontrada para esta categoria.')}
                    </tbody>
                </table>
            </div>
        `
    })
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

// ==========================================================
// MOVIMENTAÇÕES
// ==========================================================

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
    const resumo = document.getElementById('movimentacoesResumo')
    if (resumo) {
        const confirmadas = lista.filter((item) => item.statusClassificacao === 'confirmada').length
        const pendentes = lista.filter((item) => ['revisar', 'nao_identificada'].includes(item.statusClassificacao)).length
        const saldo = lista.reduce((total, item) => total + Number(item.valor || 0) * (item.tipo === 'receita' ? 1 : -1), 0)
        resumo.innerHTML = [
            { titulo: 'Saldo do recorte', valor: formatarMoeda(saldo), detalhe: `${lista.length} lançamentos filtrados`, classe: saldo >= 0 ? 'value-positive' : 'value-negative' },
            { titulo: 'Classificadas', valor: String(confirmadas), detalhe: 'Confirmações neste recorte', classe: 'value-positive' },
            { titulo: 'Precisam de revisão', valor: String(pendentes), detalhe: 'Classificações pendentes', classe: pendentes ? 'value-negative' : '' }
        ].map((item) => `<article class="live-summary-card"><span>${item.titulo}</span><strong class="${item.classe}">${item.valor}</strong><small>${item.detalhe}</small></article>`).join('')
    }
    tabela.innerHTML = lista.length ? lista.map((item) => {
        const cliente = estado.clientes.find((c) => String(c.id) === String(item.clienteId))

        return `<tr data-mov-id="${item.id}" tabindex="0">
        <td><input type="checkbox" class="bulk-checkbox" data-id="${item.id}" onclick="event.stopPropagation()"></td>
        <td><div class="table-main"><span class="table-icon">${svgIcon(item.tipo === 'receita' ? 'arrowUp' : 'arrowDown')}</span><div><strong>${escaparHtml(item.descricao)}</strong><small>${escaparHtml(item.contraparte || item.conta || 'Sem detalhe')}</small></div></div></td>
        <td><strong>${escaparHtml(item.categoria)}</strong><small class="table-subline">${escaparHtml(item.subcategoria || 'A classificar')}</small></td>
        <td>${origemLabel(item.origem)}</td>
        <td>${escaparHtml(cliente?.nome || 'Geral')}</td>
        <td class="${item.tipo === 'receita' ? 'value-positive' : 'value-negative'}">${formatarValorLancamento(item)}</td>
        <td>${statusClassificacaoBadge(item.statusClassificacao, item.confianca)}</td>
        <td><div class="table-actions"><button class="icon-button" onclick="event.stopPropagation(); editarMovimentacao('${item.id}')" title="Editar">${svgIcon('edit')}</button><button class="icon-button danger" onclick="event.stopPropagation(); excluirMovimentacao('${item.id}')" title="Excluir">${svgIcon('trash')}</button></div></td>
        </tr>`
    }).join('') : linhaVazia(8, 'Nenhuma movimentação encontrada.')

    tabela.querySelectorAll('tr[data-mov-id]').forEach((linha) => {
        linha.addEventListener('click', () => abrirDrawerMovimentacao(linha.dataset.movId))
        linha.addEventListener('keydown', (evento) => {
            if (evento.key === 'Enter' || evento.key === ' ') {
                evento.preventDefault()
                abrirDrawerMovimentacao(linha.dataset.movId)
            }
        })
    })
    
    // Atualizar barra de bulk actions
    renderizarBulkActions();
}

function renderizarBulkActions() {
    const checkboxes = document.querySelectorAll('.bulk-checkbox');
    const selecionados = document.querySelectorAll('.bulk-checkbox:checked').length;
    const bar = document.getElementById('bulkActionsBar');
    if(!bar) return;
    document.getElementById('bulkDelete').disabled = selecionados === 0;
    document.getElementById('bulkReclassify').disabled = selecionados === 0;
    bar.style.display = checkboxes.length > 0 ? 'block' : 'none';
}

function abrirDrawerMovimentacao(id) {
    const item = estado.movimentacoes.find((mov) => String(mov.id) === String(id))
    const backdrop = document.getElementById('drawerMovimentacaoBackdrop')
    const content = document.getElementById('drawerMovimentacaoContent')
    const titulo = document.getElementById('drawerMovimentacaoTitulo')
    if (!item || !backdrop || !content || !titulo) return

    const cliente = estado.clientes.find((c) => String(c.id) === String(item.clienteId))
    const valor = Number(item.valor || 0)
    titulo.textContent = item.descricao
    content.innerHTML = `
        <div class="drawer-summary">
            <span class="eyebrow">${item.tipo === 'receita' ? 'Receita' : 'Pagamento'}</span>
            <strong class="${item.tipo === 'receita' ? 'value-positive' : 'value-negative'}">${item.tipo === 'receita' ? '+' : '-'} ${formatarMoeda(valor)}</strong>
            ${item.moeda === 'USD' ? `<small>Original: ${Number(item.valorOriginal).toLocaleString('pt-BR', { style: 'currency', currency: 'USD' })} · Cotação informada: ${Number(item.cotacaoBrl).toLocaleString('pt-BR', { maximumFractionDigits: 5 })} BRL/USD</small>` : ''}
            <small>${escaparHtml(item.categoria)} / ${escaparHtml(item.subcategoria || 'A classificar')}</small>
        </div>
        <div class="drawer-grid">
            <article class="drawer-card"><span>Perfil</span><strong>${escaparHtml(cliente?.nome || 'Geral')}</strong></article>
            <article class="drawer-card"><span>Data</span><strong>${formatarData(item.data)}</strong></article>
            <article class="drawer-card"><span>Origem</span><strong>${escaparHtml(origemLabel(item.origem))}</strong></article>
            <article class="drawer-card"><span>Confiança</span><strong>${item.confianca || 0}%</strong></article>
            <article class="drawer-card"><span>Categoria</span><strong>${escaparHtml(item.categoria)}</strong></article>
            <article class="drawer-card"><span>Subcategoria</span><strong>${escaparHtml(item.subcategoria || 'A classificar')}</strong></article>
        </div>
        <div class="drawer-history">
            <h4>Histórico</h4>
            <div class="drawer-history-item"><span class="history-dot"></span><div><strong>Classificação atual</strong><small>${escaparHtml(item.statusClassificacao || 'confirmada')} · ${item.confianca || 0}% de confiança</small></div></div>
            <div class="drawer-history-item"><span class="history-dot"></span><div><strong>Conta / contraparte</strong><small>${escaparHtml(item.conta || item.contraparte || 'Não informado')}</small></div></div>
            <div class="drawer-history-item"><span class="history-dot"></span><div><strong>Observações</strong><small>${escaparHtml(item.observacoes || 'Sem observações adicionais.')}</small></div></div>
        </div>
    `
    backdrop.hidden = false
}

function fecharDrawerMovimentacao() {
    const backdrop = document.getElementById('drawerMovimentacaoBackdrop')
    if (backdrop) backdrop.hidden = true

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
    const moeda = document.getElementById('moedaMovimentacao')
    const cotacao = document.getElementById('cotacaoMovimentacao')
    const atualizarMoeda = () => {
        const usd = moeda.value === 'USD'
        document.getElementById('camposDolar').hidden = !usd
        cotacao.required = usd
        const original = Number(document.getElementById('valor').value)
        const taxa = Number(cotacao.value)
        document.getElementById('previsaoConversao').textContent = usd && original > 0 && taxa > 0
            ? `${formatarMoeda(original * taxa)} nos totais em reais · Cotação informada` : 'Informe a cotação usada; o valor em BRL entra nos totais.'
    }
    moeda.addEventListener('change', atualizarMoeda)
    cotacao.addEventListener('input', atualizarMoeda)
    document.getElementById('valor').addEventListener('input', atualizarMoeda)
    document.getElementById('buscarCotacao').addEventListener('click', async () => {
        const data = document.getElementById('data').value
        const { resposta, dados } = await apiRequest('/api/cotacao-usd' + montarQuery({ data }))
        if (!resposta.ok) return mostrarToast(dados.mensagem || 'Cotação indisponível.', 'erro')
        cotacao.value = dados.cotacaoBrl
        atualizarMoeda()
        mostrarToast(`PTAX venda de ${formatarData(String(dados.dataCotacao).slice(0, 10))}. Confirme a cotação antes de salvar.`)
    })

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault()
        const payload = {
            clienteId: document.getElementById('movCliente').value,
            descricao: document.getElementById('descricao').value.trim(),
            tipo: document.getElementById('tipo').value,
            categoria: document.getElementById('categoria').value.trim(),
            subcategoria: document.getElementById('subcategoria').value.trim(),
            valor: document.getElementById('valor').value,
            moeda: moeda.value,
            cotacaoBrl: cotacao.value,
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
    
    // Eventos para Ações em Lote
    document.getElementById('selectAllBulk').addEventListener('change', function() {
        document.querySelectorAll('.bulk-checkbox').forEach(cb => cb.checked = this.checked);
        renderizarBulkActions();
    });

    document.getElementById('tabelaMovimentacoes').addEventListener('change', function(e) {
        if(e.target.classList.contains('bulk-checkbox')) {
            renderizarBulkActions();
        }
    });

    document.getElementById('bulkDelete').addEventListener('click', async () => {
        const ids = Array.from(document.querySelectorAll('.bulk-checkbox:checked')).map(cb => cb.dataset.id);
        if(ids.length === 0) return;
        const confirmado = await confirmarAcao(`Excluir ${ids.length} movimentações? Esta ação não pode ser desfeita.`, 'Excluir em lote');
        if(!confirmado) return;
        for (const id of ids) {
            await apiRequest(`/api/movimentacoes/${id}`, { method: 'DELETE' });
        }
        mostrarToast(`${ids.length} movimentações excluídas.`);
        await carregarMovimentacoes();
    });

    document.getElementById('bulkReclassify').addEventListener('click', () => {
        const ids = Array.from(document.querySelectorAll('.bulk-checkbox:checked')).map(cb => cb.dataset.id);
        if(ids.length === 0) return;
        abrirModal({ titulo: `Reclassificar ${ids.length} movimentações`, conteudo: `<form id="formReclassificar" class="form-grid"><label class="input-group">Categoria<input class="input" name="categoria" required maxlength="100"></label><label class="input-group">Subcategoria<input class="input" name="subcategoria" maxlength="100"></label><div class="modal-actions"><button type="button" class="button button-ghost" onclick="fecharModalGeral()">Cancelar</button><button type="submit" class="button button-primary">Aplicar classificação</button></div></form>` })
        document.getElementById('formReclassificar').onsubmit = async (evento) => {
            evento.preventDefault()
            const form = new FormData(evento.currentTarget)
            const { resposta, dados } = await apiRequest('/api/movimentacoes/reclassificar-lote', { method: 'POST', body: JSON.stringify({ ids, categoria: form.get('categoria'), subcategoria: form.get('subcategoria') }) })
            mostrarToast(dados.mensagem, resposta.ok ? 'sucesso' : 'erro')
            if (resposta.ok) { fecharModalGeral(); await carregarMovimentacoes() }
        }
    });
}

function editarMovimentacao(id) {
    const item = estado.movimentacoes.find((mov) => String(mov.id) === String(id))
    if (!item) return
    estado.idMovimentacaoEditando = id
    const valores = {
        movCliente: item.clienteId || '', descricao: item.descricao, tipo: item.tipo, categoria: item.categoria,
        subcategoria: item.subcategoria || '', valor: item.moeda === 'USD' ? item.valorOriginal : item.valor, moedaMovimentacao: item.moeda || 'BRL', cotacaoMovimentacao: item.cotacaoBrl || '', data: item.data, origem: item.origem || 'manual',
        conta: item.conta || '', contraparte: item.contraparte || '', centroCusto: item.centroCusto || '', natureza: item.natureza || ''
    }
    Object.entries(valores).forEach(([idCampo, valor]) => {
        const campo = document.getElementById(idCampo)
        if (campo) campo.value = valor
    })
    atualizarCamposPerfilMovimentacao()
    document.getElementById('moedaMovimentacao').dispatchEvent(new Event('change'))
    document.getElementById('movementFormTitle').textContent = 'Editar e confirmar classificação'
    document.getElementById('movementSubmitText').textContent = 'Salvar e confirmar'
    document.getElementById('cancelMovementEdit').hidden = false
    document.getElementById('movementFormCard').scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function cancelarEdicaoMovimentacao() {
    estado.idMovimentacaoEditando = null
    const formulario = document.getElementById('formMovimentacao')
    formulario?.reset()
    document.getElementById('moedaMovimentacao')?.dispatchEvent(new Event('change'))
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

// ==========================================================
// IMPORTAÇÃO E CENTRAL DE REVISÃO
// ==========================================================

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
        const repetidas = dados.resumo?.duplicadas || 0
        mostrarToast(repetidas
            ? `Arquivo lido. ${repetidas} ${repetidas === 1 ? 'linha já está' : 'linhas já estão'} na Syncrypta e não ${repetidas === 1 ? 'será importada' : 'serão importadas'} de novo.`
            : 'Arquivo lido. Revise as classificações antes de importar.', repetidas ? 'aviso' : 'sucesso')
    } catch (erro) {
        mostrarToast(erro.message || 'Não foi possível ler o arquivo.', 'erro')
    }
}

function renderizarReviewImportacao() {
    // 4.14: a página não abre mais com 3 linhas inventadas fingindo um arquivo. Antes, quem clicava em
    // "Importar" sem escolher nada salvava esses dados falsos na conta. Para ver um exemplo, há o botão
    // "Usar extrato de exemplo", que passa o arquivo de teste pelo mesmo caminho de um arquivo real.
    const resumo = estado.importResumo || {}
    const bloco = document.getElementById('importReviewSummary')
    if (bloco) bloco.hidden = !estado.importLinhas.length
    const valores = { importTotal: resumo.total || 0, importConfirmed: resumo.confirmadas || 0, importSuggested: resumo.sugeridas || 0, importReview: resumo.revisar || 0, importUnknown: resumo.naoIdentificadas || 0 }
    Object.entries(valores).forEach(([id, valor]) => { const el = document.getElementById(id); if (el) el.textContent = valor })

    const tabela = document.getElementById('csvPreviewBody')
    tabela.innerHTML = estado.importLinhas.length ? estado.importLinhas.map((item, indice) => `<tr data-import-row="${indice}" class="${item.duplicada && !item.importarDuplicada ? 'linha-repetida' : ''}"><td><input class="table-input wide" data-campo="descricao" value="${escaparHtml(item.descricao)}"></td><td><select class="table-input" data-campo="tipo"><option value="receita" ${item.tipo === 'receita' ? 'selected' : ''}>Receita</option><option value="pagamento" ${item.tipo !== 'receita' ? 'selected' : ''}>Pagamento</option></select></td><td><input class="table-input" data-campo="categoria" value="${escaparHtml(item.categoria)}"></td><td><input class="table-input" data-campo="subcategoria" value="${escaparHtml(item.subcategoria)}"></td><td><input class="table-input money" data-campo="valor" value="${item.valor}"></td><td><input class="table-input date" type="date" data-campo="data" value="${item.data}"></td><td>${statusClassificacaoBadge(item.statusClassificacao, item.confianca)}<button class="mini-confirm" onclick="confirmarLinhaImportacao(${indice})">Confirmar</button>${item.duplicada ? `<label class="linha-duplicada"><span>Já está na Syncrypta</span><input type="checkbox" data-campo="importarDuplicada" ${item.importarDuplicada ? 'checked' : ''}> importar mesmo assim</label>` : ''}</td><td><input type="checkbox" data-campo="aprenderRegra" ${item.aprenderRegra ? 'checked' : ''}></td></tr>`).join('') : linhaVazia(8, 'Selecione um arquivo para iniciar a revisão.')
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

// 4.14: carrega o extrato de teste (arquivos_teste/extrato_teste.csv) como se a pessoa tivesse escolhido o arquivo.
async function carregarExtratoExemplo() {
    try {
        const resposta = await fetch('arquivos_teste/extrato_teste.csv')
        if (!resposta.ok) throw new Error()
        const arquivo = new File([await resposta.blob()], 'extrato_teste.csv', { type: 'text/csv' })
        await processarArquivoFinanceiro(arquivo)
        document.getElementById('csvFileMeta').textContent += ' · exemplo com dados fictícios'
    } catch (erro) {
        mostrarToast('Não encontrei o extrato de exemplo (pasta arquivos_teste).', 'erro')
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

// ==========================================================
// RELATÓRIOS
// ==========================================================

async function carregarRelatorio() {
    const filtros = contextoDosControles('relatorio')
    const { resposta, dados } = await apiRequest('/api/dashboard' + montarQuery(filtros))
    if (!resposta.ok) return
    document.getElementById('relatorioSaldoInicial').textContent = formatarMoeda(dados.saldoInicial)
    document.getElementById('relatorioRecebido').textContent = formatarMoeda(dados.totalRecebido)
    document.getElementById('relatorioPago').textContent = formatarMoeda(dados.totalPago)
    document.getElementById('relatorioSaldo').textContent = formatarMoeda(dados.saldoFinal)
    const variacao = Number(dados.comparacao?.variacaoSaldo || 0)
    const temAnterior = Number(dados.comparacao?.saldoAnterior || 0) !== 0
    document.getElementById('relatorioVariacao').textContent = temAnterior ? `${variacao >= 0 ? '+' : ''}${variacao.toFixed(1)}%` : '—'
    document.getElementById('relatorioMesAnterior').textContent = temAnterior ? `vs. ${formatarMes(dados.comparacao.mesAnterior)}` : 'Sem base para comparar'
    document.getElementById('managerInsight').textContent = !dados.movimentacoes.length
        ? 'Não há lançamentos neste contexto; selecione outro mês ou perfil para gerar a análise.'
        : dados.saldoFinal < 0
        ? `O fluxo fecha negativo em ${formatarMoeda(Math.abs(dados.saldoFinal))}. Revise as maiores categorias e despesas recorrentes.`
        : dados.contexto.perfilFinanceiro === 'pf'
            ? `O período fecha com ${formatarMoeda(dados.saldoFinal)}. A projeção ajuda a decidir se novas compras cabem no orçamento.`
            : `O caixa fecha positivo em ${formatarMoeda(dados.saldoFinal)}, com saúde financeira de ${dados.saudeFinanceira}% e ${dados.revisao.revisar + dados.revisao.naoIdentificadas} itens pendentes de revisão.`

    preencherTabelaValores('relatorioCategorias', dados.categoriasDespesas, true)
    preencherTabelaValores('relatorioSubcategorias', dados.subcategoriasDespesas, false)
    const proj = document.getElementById('relatorioProjecoes')
    proj.innerHTML = dados.projecao.proximosMeses.map((item) => `<article class="projection-month"><span>${formatarMes(item.mes)}</span><strong class="${item.saldo >= 0 ? 'value-positive' : 'value-negative'}">${formatarMoeda(item.saldo)}</strong><small>Receitas ${formatarMoeda(item.recebimentos)}</small><small>Pagamentos ${formatarMoeda(item.pagamentos)}</small></article>`).join('')
    renderizarOutliers(dados.foraDoPadrao, 'relatorioOutliers')
    const destaque = document.getElementById('relatorioDestaques')
    if (destaque) {
        const itens = []
        if (!dados.movimentacoes.length) itens.push({ titulo: 'Sem lançamentos', detalhe: 'Ainda não há resultados neste período.', tipo: 'neutral', icone: 'file' })
        else {
            itens.push({ titulo: dados.saldoFinal >= 0 ? 'Saldo positivo' : 'Saldo negativo', detalhe: `Saldo do período: ${formatarMoeda(dados.saldoFinal)}.`, tipo: dados.saldoFinal >= 0 ? 'positive' : 'warning', icone: 'balance' })
            if (temAnterior) itens.push({ titulo: variacao >= 0 ? 'Saldo em alta' : 'Saldo em queda', detalhe: `${Math.abs(variacao).toFixed(1)}% em relação a ${formatarMes(dados.comparacao.mesAnterior)}.`, tipo: variacao >= 0 ? 'positive' : 'warning', icone: 'trend' })
            const pendentes = dados.revisao.revisar + dados.revisao.naoIdentificadas
            if (pendentes) itens.push({ titulo: 'Classificações pendentes', detalhe: `${pendentes} lançamentos aguardam revisão.`, tipo: 'warning', icone: 'info' })
            const maiorGasto = Object.entries(dados.categoriasDespesas).sort((a, b) => b[1] - a[1])[0]
            if (maiorGasto) itens.push({ titulo: 'Maior despesa por categoria', detalhe: `${maiorGasto[0]}: ${formatarMoeda(maiorGasto[1])}.`, tipo: 'neutral', icone: 'chart' })
        }
        destaque.innerHTML = itens.map((item) => `<article class="manager-highlight ${item.tipo}"><span class="highlight-icon">${svgIcon(item.icone)}</span><div><strong>${escaparHtml(item.titulo)}</strong><small>${escaparHtml(item.detalhe)}</small></div></article>`).join('')
    }
    estado.relatorioAtual = dados
    renderizarFiltroRelatorio()
    document.getElementById('relatorioSaldo')?.classList.toggle('value-negative', dados.saldoFinal < 0)
    document.getElementById('relatorioSaldo')?.classList.toggle('value-positive', dados.saldoFinal >= 0)
}

function preencherTabelaValores(id, objeto, comProgresso) {
    const tbody = document.getElementById(id)
    const entradas = Object.entries(objeto || {}).sort((a, b) => b[1] - a[1])
    const total = entradas.reduce((s, [, valor]) => s + Number(valor), 0)
    if (!tbody) return
    tbody.innerHTML = entradas.length ? entradas.map(([nome, valor]) => comProgresso
        ? `<tr class="categoria-clicavel" tabindex="0" data-categoria="${escaparHtml(nome)}"><td><span class="category-pill">${escaparHtml(nome)}</span></td><td>${formatarMoeda(valor)}</td><td><div class="progress-line"><span style="width:${total ? valor / total * 100 : 0}%"></span></div></td><td>${total ? (valor / total * 100).toFixed(1) : 0}%</td></tr>`
        : `<tr><td>${escaparHtml(nome)}</td><td>${formatarMoeda(valor)}</td></tr>`).join('') : linhaVazia(comProgresso ? 4 : 2, 'Sem dados para o período.')
}

async function exportarCsv() {
    const filtros = contextoDosControles('relatorio')
    const { resposta, dados } = await apiRequest('/api/movimentacoes' + montarQuery(filtros))
    if (!resposta.ok) return
    const csv = ['Data,Descricao,Tipo,Categoria,Subcategoria,Origem,Conta,Contraparte,CentroCusto,Natureza,Moeda,ValorOriginal,CotacaoBRL,ValorBRL', ...filtrarDadosRelatorio(dados).map((item) => [item.data, item.descricao, item.tipo, item.categoria, item.subcategoria, origemLabel(item.origem), item.conta, item.contraparte, item.centroCusto, item.natureza, item.moeda || 'BRL', item.valorOriginal ?? item.valor, item.cotacaoBrl || 1, item.valor].map((valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`).join(','))].join('\n')
    baixarArquivo(csv, `relatorio-syncrypta-${filtros.mes || new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8')
    registrarExportacao('csv', filtros.mes, filtrarDadosRelatorio(dados).length)
}

async function exportarExcel() {
    const filtros = contextoDosControles('relatorio')
    const { resposta, dados } = await apiRequest('/api/movimentacoes' + montarQuery(filtros))
    if (!resposta.ok) return
    const linhas = filtrarDadosRelatorio(dados).map((item) => `<tr><td>${escaparHtml(item.data)}</td><td>${escaparHtml(item.descricao)}</td><td>${escaparHtml(item.tipo)}</td><td>${escaparHtml(item.categoria)}</td><td>${escaparHtml(item.subcategoria || '')}</td><td>${escaparHtml(origemLabel(item.origem))}</td><td>${escaparHtml(item.conta || '')}</td><td>${escaparHtml(item.contraparte || '')}</td><td>${escaparHtml(item.centroCusto || '')}</td><td>${escaparHtml(item.natureza || '')}</td><td>${item.moeda || 'BRL'}</td><td>${Number(item.valorOriginal ?? item.valor)}</td><td>${Number(item.cotacaoBrl || 1)}</td><td>${Number(item.valor)}</td></tr>`).join('')
    const html = `<html><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Subcategoria</th><th>Origem</th><th>Conta</th><th>Contraparte</th><th>Centro de custo</th><th>Natureza</th><th>Moeda</th><th>Valor original</th><th>Cotação BRL</th><th>Valor em BRL</th></tr></thead><tbody>${linhas}</tbody></table></body></html>`
    baixarArquivo(html, `relatorio-syncrypta-${filtros.mes || new Date().toISOString().slice(0, 10)}.xls`, 'application/vnd.ms-excel;charset=utf-8')
    mostrarToast('Planilha Excel gerada.')
    registrarExportacao('excel', filtros.mes, filtrarDadosRelatorio(dados).length)
}

// 4.12: anota a exportação na auditoria (na visita de demonstração o servidor recusa, e tudo bem).
function registrarExportacao(formato, mes, linhas) {
    if (estado.conta?.perfil === 'demonstracao') return
    apiRequest('/api/auditoria/exportacao', { method: 'POST', body: JSON.stringify({ formato, mes: mes || '', linhas }) })
}

function imprimirRelatorio() { window.print() }

// ==========================================================
// PERFIS FINANCEIROS
// ==========================================================

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
    const master = estado.conta?.perfil === 'cliente_tcc' && estado.conta?.acessoTotal === true
    tabela.innerHTML = lista.length ? lista.map((item) => `<tr><td><div class="table-main"><span class="user-avatar small">${gerarSigla(item.nome)}</span><div><strong>${escaparHtml(item.nome)}</strong><small>Identificação interna</small></div></div></td><td><span class="type-badge ${item.perfilFinanceiro === 'pj' ? 'type-business' : 'type-personal'}">${item.perfilFinanceiro === 'pj' ? 'Pessoa jurídica' : 'Pessoa física'}</span></td><td>${escaparHtml(item.segmento || 'Não informado')}</td><td>${escaparHtml(item.modoVisual || 'barras')}</td><td><span class="status-dot ${item.status === 'Ativo' ? 'status-ok' : item.status === 'Em implantação' ? 'status-warning' : 'status-inactive'}">${escaparHtml(item.status)}</span></td><td><div class="table-actions"><button class="icon-button" onclick="editarCliente('${item.id}')">${svgIcon('edit')}</button><button class="icon-button" onclick="${master ? `abrirPerfilFinanceiro('${item.id}')` : `criarAcessoCliente('${item.id}')`}" title="${master ? 'Ver perfil completo' : 'Criar acesso de leitura'}">${svgIcon('lock')}</button><button class="icon-button danger" onclick="excluirCliente('${item.id}')">${svgIcon('trash')}</button></div></td></tr>`).join('') : linhaVazia(6, 'Nenhum perfil cadastrado.')
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

// ==========================================================
// REGRAS INTELIGENTES
// ==========================================================

async function carregarRegras() {
    const clienteId = document.getElementById('filtroRegraCliente')?.value || ''
    const { resposta, dados } = await apiRequest('/api/regras' + montarQuery({ clienteId }))
    if (!resposta.ok) return
    estado.regras = dados
    renderizarRegras()
}


function iconeRegraPorTermo(termo = '') {
    const texto = normalizarBusca(termo)

    if (/(99 app|app 99|caixa 99|99)/.test(texto)) return 'cashbox'
    if (/(mensalidade|assinatura|plano|mensal|vencimento|recorrente)/.test(texto)) return 'calendarIcon'
    if (/(conta de luz|luz|energia|eletrica|elétrica|lampada|energia eletrica|eletro|enel)/.test(texto)) return 'bolt'
    if (/(mei|microempreendedor|cnpj|prestacao|servico|serviços|contabilidade|faturamento)/.test(texto)) return 'briefcase'
    if (/(shell|posto|gasolina|diesel|etanol|combustivel|fuel)/.test(texto)) return 'fuel'
    if (/(mercado|supermercado|hiper|market|mercearia|padaria|loja|shopping|compras)/.test(texto)) return 'market'
    if (/(uber|transporte|onibus|metr|taxi|viagem|passagem|frete)/.test(texto)) return 'car'
    if (/(aluguel|condominio|apartamento|casa|moradia|imovel|residencia)/.test(texto)) return 'home'
    if (/(restaurante|pizza|hamburg|lanch|cafe|café|coffee|refeicao|comida|delivery)/.test(texto)) return 'restaurant'
    if (/(saude|medic|clinica|hospital|farmacia|remedio|pharma|dentista)/.test(texto)) return 'health'
    if (/(internet|wifi|celular|telefone|telefonia|netflix|streaming)/.test(texto)) return 'phone'
    if (/(salario|receita|pix|transferencia|bonificacao|venda|pagamento)/.test(texto)) return 'wallet'
    if (/(imposto|tributo|taxa|iptu|seguro|banco|financiamento)/.test(texto)) return 'bank'
    if (/(carrinho|compra|shopping|mercadoria)/.test(texto)) return 'cart'

    return 'sparkles'
}


function renderizarRegras() {
    const grid = document.getElementById('rulesGrid')
    if (!grid) return
    const busca = normalizarBusca(document.getElementById('buscaRegra')?.value)
    // Filtro de categoria: lista as categorias existentes e mantém a escolha atual.
    const seletorCategoria = document.getElementById('filtroRegraCategoria')
    const categoriaEscolhida = seletorCategoria?.value || ''
    if (seletorCategoria) {
        const todas = [...new Set(estado.regras.map((r) => r.categoria || 'Sem categoria'))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
        seletorCategoria.innerHTML = '<option value="">Todas as categorias</option>' + todas.map((c) => `<option value="${escaparHtml(c)}">${escaparHtml(c)} (${estado.regras.filter((r) => (r.categoria || 'Sem categoria') === c).length})</option>`).join('')
        seletorCategoria.value = todas.includes(categoriaEscolhida) ? categoriaEscolhida : ''
    }
    const categoriaFiltro = seletorCategoria?.value || ''
    const lista = estado.regras.filter((item) =>
        (!categoriaFiltro || (item.categoria || 'Sem categoria') === categoriaFiltro) &&
        normalizarBusca(`${item.termo} ${item.categoria} ${item.subcategoria}`).includes(busca))

    // Sugestões de categoria no formulário, a partir das regras existentes.
    const sugestoes = document.getElementById('regraCategoriasLista')
    if (sugestoes) sugestoes.innerHTML = [...new Set(estado.regras.map((r) => r.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((c) => `<option value="${escaparHtml(c)}">`).join('')

    // Agrupa por categoria: o título do cartão é o resultado (categoria/subcategoria),
    // e a palavra-chave aparece como informação secundária.
    const grupos = {}
    lista.forEach((item) => { const chave = item.categoria || 'Sem categoria'; (grupos[chave] ||= []).push(item) })
    const categorias = Object.keys(grupos).sort((a, b) => a.localeCompare(b, 'pt-BR'))

    const cartao = (item) => {
        const cliente = estado.clientes.find((c) => String(c.id) === String(item.clienteId))
        return `<article class="rule-card ${item.personalizada ? 'rule-custom' : 'rule-default'}">
            <div class="rule-card-top">${tipoBadge(item.tipo)}<span class="classification-badge ${item.personalizada ? 'classification-success' : 'classification-info'}">${item.personalizada ? 'Personalizada' : 'Padrão'}</span></div>
            <h3>${escaparHtml(item.subcategoria || 'Sem subcategoria')}</h3>
            <p class="rule-trigger">Quando a descrição tiver <mark>“${escaparHtml(item.termo)}”</mark></p>
            <small>${cliente ? `Perfil: ${escaparHtml(cliente.nome)}` : 'Aplicação geral'} · confiança ${item.confianca || 90}%</small>
            ${item.personalizada ? `<div class="rule-actions"><button class="button button-ghost" onclick="editarRegra('${item.id}')">Editar</button><button class="button button-danger" onclick="excluirRegra('${item.id}')">Excluir</button></div>` : ''}
        </article>`
    }

    grid.innerHTML = categorias.length ? categorias.map((categoria) => {
        const itens = grupos[categoria].sort((a, b) => String(a.subcategoria || '').localeCompare(String(b.subcategoria || ''), 'pt-BR'))
        const icone = iconeRegraPorTermo(`${categoria} ${itens.map((i) => `${i.subcategoria} ${i.termo}`).join(' ')}`)
        return `<section class="rule-group">
            <header class="rule-group-head"><span class="rule-icon">${svgIcon(icone)}</span><h3>${escaparHtml(categoria)}</h3><span class="rule-count">${itens.length} ${itens.length === 1 ? 'regra' : 'regras'}</span></header>
            <div class="rule-group-grid">${itens.map(cartao).join('')}</div>
        </section>`
    }).join('') : `<div class="empty-compact">${categoriaFiltro ? `Nenhuma regra de ${escaparHtml(categoriaFiltro)} com essa busca.` : 'Nenhuma regra encontrada.'}</div>`
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
    document.getElementById('formTesteRegra')?.addEventListener('submit', testarRegra)
    document.getElementById('buscaRegra')?.addEventListener('input', renderizarRegras)
    document.getElementById('filtroRegraCategoria')?.addEventListener('change', renderizarRegras)
    document.getElementById('filtroRegraCliente')?.addEventListener('change', carregarRegras)
}

// 4.13: usa a mesma classificação da importação (/api/classificar-lote) com uma linha só, sem salvar.
async function testarRegra(evento) {
    evento.preventDefault()
    const descricao = document.getElementById('testeRegraDescricao').value.trim()
    const alvo = document.getElementById('testeRegraResultado')
    if (!descricao) { alvo.innerHTML = '<p class="helper-text">Digite uma descrição para testar.</p>'; return }
    const linha = { descricao, valor: 1, data: new Date().toISOString().slice(0, 10), tipo: document.getElementById('testeRegraTipo').value }
    const { resposta, dados } = await apiRequest('/api/classificar-lote', { method: 'POST', body: JSON.stringify({ linhas: [linha], clienteId: document.getElementById('regraCliente')?.value || '' }) })
    const item = (dados.linhas || [])[0]
    if (!resposta.ok || !item) { alvo.innerHTML = `<p class="helper-text">${escaparHtml(dados.mensagem || 'Não foi possível testar agora.')}</p>`; return }
    const regra = estado.regras.find((r) => r.termo && normalizarBusca(r.termo) === normalizarBusca(item.termoRegra))
    alvo.innerHTML = item.termoRegra
        ? `<div class="regra-teste-ok">${svgIcon('check')}<div><strong>${escaparHtml(item.categoria)} / ${escaparHtml(item.subcategoria)}</strong><small>Usou a regra ${regra?.personalizada ? 'personalizada' : 'padrão'} “${escaparHtml(item.termoRegra)}” · confiança ${item.confianca}% · ${item.statusClassificacao === 'sugerida' ? 'entra como sugerida' : 'vai para revisão'}</small></div></div>`
        : `<div class="regra-teste-nao">${svgIcon('info')}<div><strong>Nenhuma regra reconheceu essa descrição</strong><small>Ela entraria como "Não identificado" para você revisar. Crie uma regra acima com uma palavra dessa descrição.</small></div></div>`
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

// ==========================================================
// AUDITORIA
// ==========================================================

async function carregarAuditoria() {
    const { resposta, dados } = await apiRequest('/api/auditoria')
    if (!resposta.ok) {
        // Antes a tela ficava vazia sem explicar nada; agora mostra o motivo.
        document.getElementById('tabelaAuditoria').innerHTML = linhaVazia(4, dados.mensagem || 'Não foi possível carregar a auditoria.')
        return
    }
    estado.auditoria = dados
    document.getElementById('auditTotal').textContent = dados.length
    document.getElementById('auditLast').textContent = dados[0] ? formatarDataHora(dados[0].dataHora) : '—'

    // Calcular estatísticas dinâmicas
    // 4.12: os contadores procuravam nomes de ação que o servidor nunca grava, por isso ficavam sempre em 0.
    const acoesCriticas = ['EXCLUIU', 'EXCLUIU_REGRA', 'RECLASSIFICOU_LOTE', 'ALTEROU_PLANO_DEMO', 'PAGAMENTO_DEMO_APROVADO', 'CRIOU_ACESSO']
    const alteracoesCriticas = dados.filter((a) => acoesCriticas.includes(a.acao)).length
    const exportacoes = dados.filter((a) => a.acao === 'EXPORTOU_RELATORIO').length
    document.getElementById('auditAlteracoesCriticas').textContent = alteracoesCriticas;
    document.getElementById('auditExportacoes').textContent = exportacoes;

    // Formatação do JSON
    document.getElementById('tabelaAuditoria').innerHTML = dados.length ? dados.map((item) => {
        const acao = acaoAuditoria(item.acao)
        return `<tr><td>${formatarDataHora(item.dataHora)}</td><td><span class="category-pill audit-action"><span>${acao.icone}</span>${acao.label}</span></td><td>${escaparHtml(entidadeAuditoria(item.entidade))}</td><td>${formatarDetalhesAuditoria(item.detalhes)}</td></tr>`
    }).join('') : linhaVazia(4, 'Nenhum evento de auditoria.')
}

// Nova função para formatar o JSON da auditoria
function formatarDetalhesAuditoria(detalhes) {
    // Os detalhes podem vir como objeto (API atual) ou como texto JSON (registros antigos).
    let obj = detalhes
    if (typeof detalhes === 'string') {
        try { obj = JSON.parse(detalhes) } catch (e) { return escaparHtml(detalhes) }
    }
    if (!obj || typeof obj !== 'object') return escaparHtml(String(obj ?? '—'))
    const nomes = { descricao: 'Descrição', linhas: 'Linhas', regras: 'Regras', plano: 'Plano', id: 'ID', termo: 'Palavra', categoria: 'Categoria', subcategoria: 'Subcategoria', nome: 'Nome', email: 'E-mail', quantidade: 'Quantidade', formato: 'Formato', mes: 'Mês', valor: 'Valor', regrasAprendidas: 'Regras aprendidas', formaPagamento: 'Pagamento', origem: 'Origem', clienteId: 'Perfil', contaId: 'Conta', loteId: 'Lote', versao: 'Versão' }
    const partes = Object.entries(obj)
        .filter(([, v]) => v !== '' && v !== null && v !== undefined && typeof v !== 'object')
        .map(([k, v]) => k === 'exemplo' ? 'Registro de demonstração' : `${nomes[k] || k}: ${v === true ? 'sim' : v === false ? 'não' : v}`)
    return partes.length ? escaparHtml(partes.join(' · ')) : '<span class="text-muted">—</span>'
}

function entidadeAuditoria(entidade = '') {
    const nomes = { sessao: 'Sessão', usuario: 'Conta', plano: 'Plano', perfil_financeiro: 'Perfil financeiro', movimentacao: 'Movimentação', regra: 'Regra', saldo: 'Saldo', relatorio: 'Relatório', sistema: 'Sistema' }
    return nomes[entidade] || entidade || '—'
}

function acaoAuditoria(acao = '') {
    // Nome e ícone de cada ação que o servidor grava em auditoria.json
    const mapeamento = {
        LOGIN: ['shield', 'Login'],
        CRIOU_CONTA: ['users', 'Conta criada'],
        SEED_DEMO: ['info', 'Dados de demonstração'],
        CARREGOU_DEMONSTRACAO: ['info', 'Dados de demonstração'],
        IMPORTOU_ARQUIVO: ['upload', 'Importação'],
        CRIOU: ['plus', 'Cadastro'],
        EDITOU: ['edit', 'Edição'],
        EXCLUIU: ['trash', 'Exclusão'],
        RECLASSIFICOU_LOTE: ['rules', 'Reclassificação em lote'],
        CRIOU_REGRA: ['sparkles', 'Regra criada'],
        EDITOU_REGRA: ['edit', 'Regra editada'],
        EXCLUIU_REGRA: ['trash', 'Regra excluída'],
        DEFINIU_SALDO_INICIAL: ['balance', 'Saldo inicial'],
        CRIOU_ACESSO: ['lock', 'Acesso de cliente'],
        ALTEROU_PLANO_DEMO: ['card', 'Troca de plano'],
        PAGAMENTO_DEMO_APROVADO: ['card', 'Pagamento (simulado)'],
        EXPORTOU_RELATORIO: ['download', 'Exportação']
    }
    const [icone, label] = mapeamento[String(acao).toUpperCase()] || ['info', String(acao || 'Ação').replaceAll('_', ' ').toLowerCase()]
    return { icone: svgIcon(icone), label }
}

// ==========================================================
// CHECKOUT
// ==========================================================

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
    const protegidas = ['dashboard', 'movimentacoes', 'importacao', 'relatorios', 'clientes', 'regras', 'auditoria', 'checkout', 'configuracoes']
    if (protegidas.includes(pagina)) {
        const protegida = await protegerPagina()
        if (!protegida) return
        await carregarPerfisFinanceiros()
    }

    if (pagina === 'dashboard') {
        const contextoCliente = document.getElementById('contextCliente')
        const master = estado.conta?.perfil === 'cliente_tcc' && estado.conta?.acessoTotal === true
        if (contextoCliente && master) {
            const salvo = localStorage.getItem('syncrypta_context_cliente')
            const perfilSalvoExiste = [...contextoCliente.options].some((opcao) => String(opcao.value) === String(salvo))
            contextoCliente.value = perfilSalvoExiste ? salvo : (estado.clientes[0]?.id || '')
            if (contextoCliente.value) localStorage.setItem('syncrypta_context_cliente', contextoCliente.value)
        } else if (contextoCliente && !contextoCliente.value && estado.clientes.length) {
            contextoCliente.value = estado.conta?.perfil === 'portal_cliente' ? estado.clientes[0].id : (localStorage.getItem('syncrypta_context_cliente') || estado.clientes[0].id)
        }
        document.getElementById('contextMes').value = localStorage.getItem('syncrypta_context_mes') || mesAtual()
        configurarControlesContexto('context', carregarDashboard)
        document.getElementById('chartTypeSelector').value = localStorage.getItem('syncrypta_chart_fluxo') || 'bar'

        const categoriaRadio = document.querySelector('input[name="categoryChartType"]')
        if (categoriaRadio) {
            const categoriaSelecionada = localStorage.getItem('syncrypta_chart_categoria') || 'bar'
            document.querySelectorAll('input[name="categoryChartType"]').forEach((radio) => {
                radio.checked = radio.value === categoriaSelecionada
            })
        }
        document.getElementById('chartTypeSelector').addEventListener('change', () => { localStorage.setItem('syncrypta_chart_fluxo', document.getElementById('chartTypeSelector').value); carregarDashboard() })
        ;['chartStatus', 'chartCategoria'].forEach((id) => document.getElementById(id)?.addEventListener('change', carregarDashboard))
        document.querySelectorAll('input[name="categoryChartType"]').forEach((radio) => {
            radio.addEventListener('change', () => { localStorage.setItem('syncrypta_chart_categoria', radio.value); carregarDashboard() })
        })

        iniciarCalendario()
        iniciarConversor()
        await carregarDashboard()
        await iniciarPainelGoogle()
        // 4.9: tour de primeiro acesso (tour.js) para contas novas sem dados
        if (typeof talvezIniciarTour === 'function') talvezIniciarTour(estado.ultimoDashboard)
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
        document.getElementById('filtrosRelatorio')?.addEventListener('input', renderizarFiltroRelatorio)
        document.getElementById('filtrosRelatorio')?.addEventListener('change', renderizarFiltroRelatorio)
        document.getElementById('relatorioCategorias')?.addEventListener('click', abrirCategoriaRelatorio)
        document.getElementById('relatorioCategorias')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') abrirCategoriaRelatorio(e) })
    }
    if (pagina === 'clientes' && estado.conta?.perfil !== 'portal_cliente' && (estado.plano?.recursos || []).includes('clientes')) {
        iniciarFormularioCliente()
        await carregarClientes()
    }
    if (pagina === 'regras' && ((estado.plano?.recursos || []).includes('regras_automaticas') || estado.conta?.acessoTotal)) {
        iniciarFormularioRegra()
        await carregarRegras()
    }
    if (pagina === 'auditoria' && ((estado.plano?.recursos || []).includes('auditoria') || estado.conta?.acessoTotal)) await carregarAuditoria()
    if (pagina === 'checkout') iniciarCheckout()
    if (pagina === 'configuracoes' && typeof iniciarConfiguracoes === 'function') await iniciarConfiguracoes()
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarPagina, { once: true })
} else {
    iniciarPagina()
}
