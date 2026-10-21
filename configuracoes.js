// ==========================================================
// PÁGINA CONFIGURAÇÕES · Syncrypta 4.13
// - Conta: nome de exibição, e-mail, plano e forma de login.
// - Aparência e Uso: preferências salvas na conta (rota /api/configuracoes/preferencias)
//   e aplicadas na hora pelas classes do <html> (veja aplicarPreferencias no script.js).
// - Segurança: troca de senha.
// - Usuários (só a conta master): quem pode fazer o quê, troca de plano e suspensão de contas.
// Na visita de demonstração e no acesso de cliente, o servidor não aceita gravações;
// por isso as preferências dessas contas ficam só neste navegador.
// ==========================================================

const config = { dados: null, preferencias: {}, salvaNoServidor: true, admin: null }

const NOMES_PLANO = { basico: 'Básico', profissional: 'Profissional', empresarial: 'Empresarial' }
const NOMES_TIPO = { master: 'Master', usuario: 'Usuário', cliente: 'Cliente (leitura)', visita: 'Visita' }

async function iniciarConfiguracoes() {
    const { resposta, dados } = await apiRequest('/api/configuracoes')
    if (!resposta.ok) return mostrarToast(dados.mensagem || 'Não foi possível abrir as configurações.', 'erro')
    config.dados = dados
    const conta = dados.conta
    // Visita e cliente só consultam: as preferências ficam no navegador.
    config.salvaNoServidor = !['demonstracao', 'portal_cliente'].includes(conta.perfil)
    config.preferencias = config.salvaNoServidor ? { ...dados.preferencias } : { ...dados.preferencias, ...preferenciasLocais() }

    if (!config.salvaNoServidor) {
        const aviso = document.getElementById('configAvisoLocal')
        aviso.hidden = false
        aviso.textContent = conta.perfil === 'demonstracao'
            ? 'Você está na visita de demonstração: as preferências ficam salvas só neste navegador e a conta não pode ser alterada.'
            : 'Acesso de cliente: as preferências ficam salvas só neste navegador. Mudanças na conta são feitas pelo gestor.'
    }

    preencherConta(conta)
    marcarPreferencias()
    prepararSeguranca(conta)
    configurarAbas(conta)
    configurarControlesPreferencias()
    document.getElementById('formNome').addEventListener('submit', salvarNome)
    document.getElementById('formSenha').addEventListener('submit', trocarSenha)

    // Abre direto numa aba pelo endereço, ex.: configuracoes.html#usuarios
    const abaPedida = location.hash.slice(1)
    if (abaPedida) abrirAbaConfig(abaPedida)
}

// ---------- Abas ----------
function configurarAbas(conta) {
    document.getElementById('abaBotaoUsuarios').hidden = !conta.master
    document.querySelectorAll('.config-abas button').forEach((botao) => botao.addEventListener('click', () => abrirAbaConfig(botao.dataset.aba)))
}

function abrirAbaConfig(nome) {
    const botao = document.querySelector(`.config-abas button[data-aba="${nome}"]`)
    if (!botao || botao.hidden) return
    document.querySelectorAll('.config-abas button').forEach((b) => { b.classList.toggle('ativa', b === botao); b.setAttribute('aria-selected', String(b === botao)) })
    document.querySelectorAll('.config-aba').forEach((aba) => { aba.hidden = aba.id !== `aba-${nome}` })
    history.replaceState(null, '', `#${nome}`)
    if (nome === 'usuarios' && !config.admin) carregarAdminUsuarios()
}

// ---------- Conta ----------
function preencherConta(conta) {
    document.getElementById('configAvatar').textContent = gerarSigla(conta.nome)
    document.getElementById('configNomeTitulo').textContent = conta.nome
    document.getElementById('configEmail').textContent = conta.email
    document.getElementById('configNome').value = conta.nome
    const selos = [
        conta.master ? '<span class="config-selo destaque">Master · acesso total</span>' : `<span class="config-selo">${NOMES_TIPO[{ portal_cliente: 'cliente', demonstracao: 'visita' }[conta.perfil] || 'usuario']}</span>`,
        conta.temSenha ? '<span class="config-selo">Entra com senha</span>' : '',
        conta.google ? '<span class="config-selo">Google vinculado</span>' : ''
    ]
    document.getElementById('configSelos').innerHTML = selos.join('')
    const podeEditar = config.salvaNoServidor
    document.getElementById('configNome').disabled = !podeEditar
    document.querySelector('#formNome button').hidden = !podeEditar
    const plano = document.getElementById('configPlano')
    if (conta.master) {
        plano.innerHTML = '<div><strong>Acesso completo</strong><small>A conta master usa todas as ferramentas, sem plano.</small></div>'
    } else if (conta.perfil === 'portal_cliente') {
        plano.innerHTML = '<div><strong>Acesso de leitura</strong><small>Você consulta o perfil liberado pelo seu gestor.</small></div>'
    } else {
        plano.innerHTML = `<div><strong>Plano ${escaparHtml(NOMES_PLANO[conta.plano] || 'Básico')}</strong><small>${conta.perfil === 'demonstracao' ? 'Plano de exemplo desta visita.' : 'Na demonstração, a troca de plano não gera cobrança.'}</small></div><button class="button button-secondary" type="button" onclick="abrirPlanos()"><span data-icon="card"></span> Ver e trocar plano</button>`
        renderizarIcones()
    }
}

async function salvarNome(evento) {
    evento.preventDefault()
    const botao = evento.target.querySelector('button')
    setCarregando(botao, true, 'Salvando...')
    const { resposta, dados } = await apiRequest('/api/configuracoes/perfil', { method: 'PUT', body: JSON.stringify({ nome: document.getElementById('configNome').value }) })
    setCarregando(botao, false)
    if (!resposta.ok) return mostrarToast(dados.mensagem, 'erro')
    mostrarToast(dados.mensagem)
    await carregarConta()
    preencherConta({ ...config.dados.conta, nome: dados.nome })
}

// ---------- Preferências ----------
function marcarPreferencias() {
    document.querySelectorAll('.config-segmento').forEach((grupo) => {
        const valor = String(config.preferencias[grupo.dataset.pref])
        grupo.querySelectorAll('button').forEach((b) => { b.classList.toggle('ativo', b.dataset.valor === valor); b.setAttribute('aria-pressed', String(b.dataset.valor === valor)) })
    })
    document.querySelectorAll('[data-pref-select]').forEach((select) => { select.value = config.preferencias[select.dataset.prefSelect] })
}

function configurarControlesPreferencias() {
    document.querySelectorAll('.config-segmento').forEach((grupo) => {
        grupo.addEventListener('click', (evento) => {
            const botao = evento.target.closest('button[data-valor]')
            if (!botao) return
            const valor = botao.dataset.valor === 'true' ? true : botao.dataset.valor === 'false' ? false : botao.dataset.valor
            salvarPreferencia(grupo.dataset.pref, valor)
        })
    })
    document.querySelectorAll('[data-pref-select]').forEach((select) => select.addEventListener('change', () => salvarPreferencia(select.dataset.prefSelect, select.value)))
}

// Aplica na hora e salva. Se o servidor recusar, a preferência continua valendo neste navegador.
async function salvarPreferencia(chave, valor) {
    config.preferencias = { ...config.preferencias, [chave]: valor }
    guardarPreferencias(config.preferencias, { grafico: chave === 'graficoPadrao' })
    marcarPreferencias()
    if (chave === 'assistente') {
        if (valor) montarHelperbot()
        else { document.getElementById('helperbotBotao')?.remove(); document.getElementById('helperbotPainel')?.remove(); helperbot.montado = false }
    }
    // Um aviso só: tira o anterior antes de mostrar o novo (clicar rápido não empilha mensagens).
    document.querySelectorAll('#toastContainer .toast').forEach((toast) => toast.remove())
    if (!config.salvaNoServidor) return mostrarToast('Preferência salva neste navegador.')
    const { resposta, dados } = await apiRequest('/api/configuracoes/preferencias', { method: 'PUT', body: JSON.stringify({ [chave]: valor }) })
    mostrarToast(resposta.ok ? 'Preferência salva.' : (dados.mensagem || 'Salvei só neste navegador.'), resposta.ok ? 'sucesso' : 'aviso')
}

// ---------- Segurança ----------
function prepararSeguranca(conta) {
    const formulario = document.getElementById('formSenha')
    const aviso = document.getElementById('senhaIndisponivel')
    if (!conta.podeTrocarSenha) {
        formulario.hidden = true
        aviso.hidden = false
        aviso.textContent = conta.master
            ? 'A senha da conta master é definida no servidor (arquivo .env), por segurança. Veja "Para vincular a conta master" em MELHORIAS_E_PROXIMOS_PASSOS.md.'
            : conta.perfil === 'portal_cliente' ? 'Para trocar a senha do acesso de cliente, fale com o seu gestor.'
            : 'Esta é uma conta de exemplo da demonstração, então a senha não pode ser trocada.'
        return
    }
    if (!conta.temSenha) {
        document.getElementById('grupoSenhaAtual').hidden = true
        aviso.hidden = false
        aviso.textContent = 'Sua conta entra pelo Google. Se quiser, crie uma senha para entrar também com e-mail.'
    }
}

async function trocarSenha(evento) {
    evento.preventDefault()
    const novaSenha = document.getElementById('novaSenha').value
    if (novaSenha !== document.getElementById('confirmarSenha').value) return mostrarToast('As duas senhas novas não são iguais.', 'erro')
    const botao = evento.target.querySelector('button[type="submit"]')
    setCarregando(botao, true, 'Trocando...')
    const { resposta, dados } = await apiRequest('/api/configuracoes/senha', { method: 'PUT', body: JSON.stringify({ senhaAtual: document.getElementById('senhaAtual').value, novaSenha }) })
    setCarregando(botao, false)
    mostrarToast(dados.mensagem, resposta.ok ? 'sucesso' : 'erro')
    if (resposta.ok) evento.target.reset()
}

// ---------- Administração de usuários (master) ----------
async function carregarAdminUsuarios() {
    const { resposta, dados } = await apiRequest('/api/admin/usuarios')
    if (!resposta.ok) {
        document.getElementById('adminTabela').innerHTML = linhaVazia(6, dados.mensagem || 'Não foi possível carregar as contas.')
        return
    }
    config.admin = dados
    renderizarResumoAdmin()
    renderizarMatriz()
    renderizarContasAdmin()
    if (!config.adminFiltros) {
        config.adminFiltros = true
        document.getElementById('adminBusca').addEventListener('input', renderizarContasAdmin)
        document.getElementById('adminFiltroTipo').addEventListener('change', renderizarContasAdmin)
        document.getElementById('adminTabela').addEventListener('change', (evento) => {
            const select = evento.target.closest('select[data-plano-conta]')
            if (select) alterarContaAdmin(select.dataset.planoConta, { plano: select.value }, select)
        })
    }
}

function renderizarResumoAdmin() {
    const contas = config.admin.contas
    const cartoes = [
        ['users', 'Contas', contas.length, 'no total'],
        ['check', 'Ativas', contas.filter((c) => c.ativo).length, 'podem entrar'],
        ['lock', 'Suspensas', contas.filter((c) => !c.ativo).length, 'sem acesso'],
        ['card', 'Pagantes', contas.filter((c) => c.tipo === 'usuario' && c.plano !== 'basico').length, 'Profissional ou Empresarial']
    ]
    document.getElementById('adminResumo').innerHTML = cartoes.map(([icone, titulo, valor, detalhe]) => `<article class="metric-card"><div class="metric-top"><div><span class="metric-label">${titulo}</span><div class="metric-value">${valor}</div></div><span class="metric-icon">${svgIcon(icone)}</span></div><div class="metric-meta">${detalhe}</div></article>`).join('')
}

// Tabela "quem pode fazer o quê", montada a partir dos recursos de cada plano (backend/config/planos.js).
function renderizarMatriz() {
    const recursosDo = Object.fromEntries(config.admin.planos.map((p) => [p.id, p.recursos]))
    const linhas = [
        ['Visão geral e movimentações', 'dashboard', 'leitura'],
        ['Importar extrato e revisar', 'importar_csv', '—'],
        ['Regras inteligentes', 'regras_automaticas', '—'],
        ['Perfis financeiros e CNPJ', 'clientes', '—'],
        ['Previsão de caixa', 'previsao_caixa', 'leitura'],
        ['Relatórios avançados', 'relatorios_avancados', 'leitura'],
        ['Auditoria', 'auditoria', '—'],
        ['Administrar usuários', null, '—']
    ]
    const marca = (sim) => (sim ? '<span class="matriz-sim" title="Sim">✓</span>' : '<span class="matriz-nao" title="Não">—</span>')
    const colunas = ['Master', 'Empresarial', 'Profissional', 'Básico', 'Cliente', 'Visita']
    document.getElementById('adminMatriz').innerHTML = `<thead><tr><th>Ferramenta</th>${colunas.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${linhas.map(([nome, recurso, cliente]) => `<tr><td>${nome}</td><td>${marca(true)}</td>${['empresarial', 'profissional', 'basico'].map((p) => `<td>${marca(recurso && recursosDo[p]?.includes(recurso))}</td>`).join('')}<td>${cliente === 'leitura' ? '<span class="matriz-leitura">leitura</span>' : marca(false)}</td><td>${recurso ? '<span class="matriz-leitura">leitura*</span>' : marca(false)}</td></tr>`).join('')}</tbody><caption>* A visita vê dados fictícios, só para consulta, conforme o plano escolhido na tela de login.</caption>`
}

function renderizarContasAdmin() {
    const busca = normalizarBusca(document.getElementById('adminBusca').value)
    const tipo = document.getElementById('adminFiltroTipo').value
    const lista = config.admin.contas
        .filter((c) => (!tipo || c.tipo === tipo) && normalizarBusca(`${c.nome} ${c.email}`).includes(busca))
        .sort((a, b) => ['master', 'usuario', 'cliente', 'visita'].indexOf(a.tipo) - ['master', 'usuario', 'cliente', 'visita'].indexOf(b.tipo) || String(a.nome).localeCompare(String(b.nome), 'pt-BR'))
    document.getElementById('adminTabela').innerHTML = lista.length ? lista.map((c) => {
        const plano = c.tipo === 'master' ? '<span class="config-selo destaque">Acesso total</span>'
            : c.tipo === 'cliente' ? `<small>Lê: ${escaparHtml(c.perfilAcessado || '—')}</small>`
            : c.tipo === 'visita' ? '<small>Escolhido no login</small>'
            : `<select class="input input-compacto" data-plano-conta="${c.id}" ${c.protegida ? 'disabled' : ''} aria-label="Plano de ${escaparHtml(c.nome)}">${Object.entries(NOMES_PLANO).map(([id, nome]) => `<option value="${id}" ${c.plano === id ? 'selected' : ''}>${nome}</option>`).join('')}</select>`
        const acao = c.protegida
            ? '<small class="helper-text">Protegida</small>'
            : `<button class="button ${c.ativo ? 'button-danger' : 'button-secondary'} button-pequeno" type="button" onclick="alterarContaAdmin('${c.id}', { ativo: ${!c.ativo} }, this)">${c.ativo ? 'Suspender' : 'Reativar'}</button>`
        return `<tr class="${c.ativo ? '' : 'conta-suspensa'}">
            <td><div class="table-main"><span class="user-avatar small">${gerarSigla(c.nome)}</span><div><strong>${escaparHtml(c.nome)}</strong><small>${escaparHtml(c.email)}${c.login.includes('google') ? ' · Google' : ''}</small></div></div></td>
            <td><span class="config-selo ${c.tipo === 'master' ? 'destaque' : ''}">${NOMES_TIPO[c.tipo]}</span></td>
            <td>${plano}</td>
            <td>${c.ultimoLogin ? formatarDataHora(c.ultimoLogin) : '<small class="helper-text">Nunca entrou</small>'}</td>
            <td><span class="status-dot ${c.ativo ? 'status-ok' : 'status-inactive'}">${c.ativo ? 'Ativa' : 'Suspensa'}</span></td>
            <td>${acao}</td>
        </tr>`
    }).join('') : linhaVazia(6, 'Nenhuma conta com esse filtro.')
}

async function alterarContaAdmin(id, mudanca, elemento) {
    const conta = config.admin.contas.find((c) => String(c.id) === String(id))
    if (!conta) return
    const texto = 'ativo' in mudanca
        ? (mudanca.ativo ? `${conta.nome} volta a conseguir entrar na Syncrypta.` : `${conta.nome} não vai conseguir mais entrar até ser reativada. Os dados dela continuam guardados.`)
        : `O plano de ${conta.nome} muda para ${NOMES_PLANO[mudanca.plano]}, sem cobrança.`
    const confirmado = await confirmarAcao(texto, 'ativo' in mudanca ? (mudanca.ativo ? 'Reativar conta' : 'Suspender conta') : 'Trocar plano')
    if (!confirmado) { if (elemento?.tagName === 'SELECT') elemento.value = conta.plano; return }
    const { resposta, dados } = await apiRequest(`/api/admin/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(mudanca) })
    mostrarToast(dados.mensagem, resposta.ok ? 'sucesso' : 'erro')
    config.admin = null
    await carregarAdminUsuarios()
}
