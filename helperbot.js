// ==========================================================
// ASSISTENTE (HELPERBOT) · Syncrypta 4.10
// Um balão de conversa no canto de todas as páginas. Funciona em duas camadas:
// - REGRAS (sempre ligadas): CNPJ, "quanto sobrou", tour e cumprimentos são resolvidos aqui mesmo,
//   sem IA. Os dados financeiros da pessoa nunca vão para a IA.
// - IA (4.10, quando o backend tem chave no .env): as outras perguntas vão para /api/assistente,
//   que responde com base na Central de Ajuda (veja backend/assistente.js). Se a IA estiver
//   desligada ou falhar, o assistente procura a resposta mais parecida na Central de Ajuda.
// Faz três coisas com a API da Syncrypta:
// 1) busca uma empresa pelo CNPJ (rota /api/cnpj, que consulta a BrasilAPI);
// 2) diz quanto entrou, saiu e sobrou no mês (rota /api/dashboard, só para quem está logado);
// 3) abre o tour de primeiro acesso (tour.js).
// A conversa fica guardada só nesta aba (sessionStorage) para continuar ao trocar de página.
// ==========================================================

const helperbot = { aberto: false, montado: false, ocupado: false, ia: false, conversa: [] }
const CHAVE_HISTORICO_BOT = 'syncrypta_helperbot_historico'
const CHAVE_CONVERSA_IA = 'syncrypta_helperbot_conversa'

const SUGESTOES_BOT = ['Como começo?', 'Importar extrato', 'Quanto sobrou este mês?', 'Consultar um CNPJ', 'Separar PF e PJ', 'Planos']

function normalizarBot(texto) {
    return ' ' + String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim() + ' '
}

function temAlguma(texto, termos) {
    return termos.some((termo) => texto.includes(` ${termo}`))
}

// ---------- Montagem do balão ----------
function montarHelperbot(forcar = false) {
    if (helperbot.montado || document.getElementById('helperbotBotao')) return
    // 4.13: quem desligou o balão em Configurações não vê o botão flutuante (na página Ajuda ele continua).
    if (!forcar && document.documentElement.classList.contains('pref-sem-assistente') && !document.getElementById('ajudaChat')) return
    helperbot.montado = true
    document.body.insertAdjacentHTML('beforeend', `
        <button class="helperbot-botao" id="helperbotBotao" type="button" onclick="alternarHelperbot()" aria-label="Abrir o assistente da Syncrypta" aria-expanded="false" aria-controls="helperbotPainel">
            <span class="helperbot-icone" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10.5l-4 3.4c-.5.4-1.2.1-1.2-.5V17h.2A2.5 2.5 0 0 1 4 14.5Z"/><path d="M10 8.9a2.1 2.1 0 1 1 2.9 1.9c-.6.3-.9.7-.9 1.3v.2"/><circle cx="12" cy="14.6" r=".5" fill="currentColor"/></svg><i class="helperbot-online"></i></span>
            <span class="helperbot-rotulo">Ajuda</span>
        </button>
        <section class="helperbot-painel" id="helperbotPainel" role="dialog" aria-label="Assistente da Syncrypta" hidden>
            <header class="helperbot-topo">
                <img src="imagens/logo-icone.png" alt="" width="40" height="40">
                <div><strong>Assistente Syncrypta</strong><small id="helperbotSubtitulo">Respostas da Central de Ajuda</small></div>
                <button class="helperbot-fechar" type="button" onclick="fecharHelperbot()" aria-label="Fechar o assistente">×</button>
            </header>
            <div class="helperbot-mensagens" id="helperbotMensagens" aria-live="polite"></div>
            <div class="helperbot-sugestoes" id="helperbotSugestoes"></div>
            <form class="helperbot-form" id="helperbotForm">
                <input class="input" id="helperbotTexto" autocomplete="off" maxlength="200" placeholder="Escreva sua dúvida..." aria-label="Sua mensagem">
                <button class="button button-primary" type="submit" aria-label="Enviar">${svgIcon('arrowUp')}</button>
            </form>
        </section>`)
    document.getElementById('helperbotForm').addEventListener('submit', (evento) => {
        evento.preventDefault()
        const campo = document.getElementById('helperbotTexto')
        const texto = campo.value.trim()
        if (!texto || helperbot.ocupado) return
        campo.value = ''
        enviarAoHelperbot(texto)
    })
    document.getElementById('helperbotSugestoes').addEventListener('click', (evento) => {
        const chip = evento.target.closest('[data-sugestao]')
        if (chip && !helperbot.ocupado) enviarAoHelperbot(chip.dataset.sugestao)
    })
    document.getElementById('helperbotMensagens').addEventListener('click', (evento) => {
        const acao = evento.target.closest('[data-bot-acao]')?.dataset.botAcao
        if (acao === 'tour') { fecharHelperbot(); iniciarTour() }
        if (acao === 'ajuda') navegarPara('ajuda.html', false)
    })
    document.addEventListener('keydown', (evento) => { if (evento.key === 'Escape' && helperbot.aberto) fecharHelperbot() })
    renderizarSugestoesBot(SUGESTOES_BOT)
    restaurarHistoricoBot()
    // Na página Ajuda, o painel fica aberto dentro da própria página (seção "Pergunte do seu jeito").
    const lugarNaPagina = document.getElementById('ajudaChat')
    if (lugarNaPagina) {
        const painel = document.getElementById('helperbotPainel')
        lugarNaPagina.appendChild(painel)
        painel.classList.add('helperbot-inline')
        document.getElementById('helperbotBotao').hidden = true
        helperbot.inline = true
        abrirHelperbot(false)
    }
    verificarIA()
}

// Pergunta ao backend se a IA está ligada (só acontece se houver chave no .env do servidor).
async function verificarIA() {
    try {
        const resposta = await fetch(API_URL + '/api/assistente/status')
        const dados = await resposta.json()
        helperbot.ia = resposta.ok && dados.ativo === true
    } catch (erro) {
        helperbot.ia = false
    }
    const subtitulo = document.getElementById('helperbotSubtitulo')
    if (subtitulo) subtitulo.textContent = helperbot.ia ? 'Com IA · pode errar, confira na Ajuda' : 'Respostas da Central de Ajuda'
    const textoPagina = document.getElementById('ajudaChatTexto')
    if (textoPagina) textoPagina.textContent = helperbot.ia
        ? 'Converse com a IA sobre o site e sobre organizar o caixa do seu negócio. Ela pode errar: na dúvida, confira as perguntas da Central logo abaixo.'
        : 'O assistente entende as dúvidas mais comuns sobre o site. Escolha um assunto ou escreva sua pergunta.'
}

function abrirHelperbot(focar = true) {
    montarHelperbot(true)
    if (helperbot.inline && focar) document.getElementById('conversar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    helperbot.aberto = true
    document.getElementById('helperbotPainel').hidden = false
    document.getElementById('helperbotBotao').setAttribute('aria-expanded', 'true')
    if (!helperbot.inline) document.body.classList.add('helperbot-aberto')
    if (!document.getElementById('helperbotMensagens').children.length) {
        const conta = estado.conta || pegarUsuarioLocal()
        const nome = conta?.nome ? `, ${escaparHtml(String(conta.nome).split(' ')[0])}` : ''
        adicionarMensagemBot(`Oi${nome}! Sou o assistente da Syncrypta. Respondo dúvidas sobre o site e sobre organizar o caixa, busco uma empresa pelo CNPJ e, se você estiver logado, mostro quanto sobrou no mês. Escolha um assunto ou escreva sua pergunta.<p class="helperbot-tambem">Não escreva senhas, CPF ou dados de cartão aqui.</p>`)
    }
    if (focar) setTimeout(() => document.getElementById('helperbotTexto')?.focus({ preventScroll: helperbot.inline }), helperbot.inline ? 500 : 50)
}

function fecharHelperbot() {
    if (helperbot.inline) return
    helperbot.aberto = false
    const painel = document.getElementById('helperbotPainel')
    if (painel) painel.hidden = true
    document.getElementById('helperbotBotao')?.setAttribute('aria-expanded', 'false')
    document.body.classList.remove('helperbot-aberto')
}

function alternarHelperbot() {
    helperbot.aberto ? fecharHelperbot() : abrirHelperbot()
}

// ---------- Mensagens ----------
function adicionarMensagemBot(html, autor = 'bot', guardar = true) {
    const area = document.getElementById('helperbotMensagens')
    if (!area) return
    area.insertAdjacentHTML('beforeend', `<div class="helperbot-msg helperbot-msg-${autor}">${html}</div>`)
    area.scrollTop = area.scrollHeight
    if (guardar) guardarHistoricoBot()
}

function guardarHistoricoBot() {
    try {
        const mensagens = [...document.querySelectorAll('#helperbotMensagens .helperbot-msg')].slice(-30)
            .map((msg) => ({ autor: msg.classList.contains('helperbot-msg-usuario') ? 'usuario' : 'bot', html: msg.innerHTML }))
        sessionStorage.setItem(CHAVE_HISTORICO_BOT, JSON.stringify(mensagens))
    } catch (erro) { /* sem armazenamento: a conversa só não continua entre páginas */ }
}

function restaurarHistoricoBot() {
    try {
        const mensagens = JSON.parse(sessionStorage.getItem(CHAVE_HISTORICO_BOT) || '[]')
        mensagens.forEach((msg) => adicionarMensagemBot(msg.html, msg.autor, false))
        helperbot.conversa = JSON.parse(sessionStorage.getItem(CHAVE_CONVERSA_IA) || '[]')
    } catch (erro) { sessionStorage.removeItem(CHAVE_HISTORICO_BOT); helperbot.conversa = [] }
}

// Versão em texto da conversa, usada como "memória" da IA (últimas mensagens).
// Respostas com dados do mês ou da empresa entram só como um resumo, sem os números.
function lembrarConversa(papel, texto) {
    helperbot.conversa.push({ papel, texto: String(texto).slice(0, 600) })
    helperbot.conversa = helperbot.conversa.slice(-8)
    try { sessionStorage.setItem(CHAVE_CONVERSA_IA, JSON.stringify(helperbot.conversa)) } catch (erro) { /* sem armazenamento */ }
}

function textoSimples(html) {
    const caixa = document.createElement('div')
    caixa.innerHTML = html
    return caixa.textContent.replace(/\s+/g, ' ').trim()
}

function renderizarSugestoesBot(lista) {
    const area = document.getElementById('helperbotSugestoes')
    if (area) area.innerHTML = lista.map((texto) => `<button type="button" class="helperbot-chip" data-sugestao="${escaparHtml(texto)}">${escaparHtml(texto)}</button>`).join('')
}

function linksBotHtml(links = []) {
    return links.length ? `<div class="helperbot-links">${links.map((link) => `<a href="${link.href}">${escaparHtml(link.texto)} →</a>`).join('')}</div>` : ''
}

function esperar(ms) { return new Promise((resolver) => setTimeout(resolver, ms)) }

async function enviarAoHelperbot(texto) {
    abrirHelperbot(!helperbot.inline)
    adicionarMensagemBot(escaparHtml(texto), 'usuario')
    helperbot.ocupado = true
    const area = document.getElementById('helperbotMensagens')
    area.insertAdjacentHTML('beforeend', '<div class="helperbot-msg helperbot-msg-bot helperbot-digitando" id="helperbotDigitando"><span></span><span></span><span></span></div>')
    area.scrollTop = area.scrollHeight
    let resposta
    try {
        const [conteudo] = await Promise.all([responderHelperbot(texto), esperar(450)])
        resposta = conteudo
    } catch (erro) {
        resposta = { html: 'Deu um erro aqui do meu lado. Tenta de novo em instantes.' }
    }
    document.getElementById('helperbotDigitando')?.remove()
    adicionarMensagemBot(resposta.html)
    lembrarConversa('usuario', texto)
    lembrarConversa('assistente', resposta.memoria || textoSimples(resposta.html))
    renderizarSugestoesBot(resposta.sugestoes || SUGESTOES_BOT)
    helperbot.ocupado = false
}

// ---------- O "cérebro": decide o que responder ----------
async function responderHelperbot(textoOriginal) {
    const texto = normalizarBot(textoOriginal)
    const logado = Boolean(pegarToken())
    const palavras = texto.trim().split(' ').filter(Boolean)

    // 1) Mandou um CNPJ (14 números, com ou sem pontuação)
    const numeros = String(textoOriginal).replace(/\D/g, '')
    if (numeros.length === 14) return responderCnpj(numeros, logado)
    if (temAlguma(texto, ['cnpj', 'consultar um cnpj', 'consultar empresa', 'buscar empresa'])) {
        return logado
            ? { html: 'Claro! Me manda os 14 números do CNPJ (pode ser com pontos e barra) que eu busco o nome, a atividade e a cidade da empresa na base pública da Receita.', sugestoes: ['Como começo?', 'Planos'] }
            : { html: `Eu busco empresas pelo CNPJ, mas só para quem está logado.${linksBotHtml([{ texto: 'Entrar', href: 'login.html' }, { texto: 'Criar conta grátis', href: 'cadastro.html' }])}` }
    }

    // 2) Quanto sobrou / saldo do mês
    if (temAlguma(texto, ['sobrou', 'saldo', 'quanto entrou', 'quanto gastei', 'quanto ganhei', 'resumo do mes', 'meu mes', 'meu caixa'])) {
        if (logado) return responderSaldoDoMes()
    }

    // 3) Tour
    if (temAlguma(texto, ['tour', 'passo a passo', 'tutorial', 'me mostra', 'me mostre', 'apresenta o site'])) {
        return logado
            ? { html: 'Posso te mostrar onde fica cada coisa na Visão geral, em poucos passos.<div class="helperbot-links"><button type="button" data-bot-acao="tour">Começar o tour →</button></div>' }
            : { html: `O tour aparece depois que você entra na conta.${linksBotHtml([{ texto: 'Entrar', href: 'login.html' }, { texto: 'Criar conta grátis', href: 'cadastro.html' }])}` }
    }

    // 4) Conversa: oi, obrigado, atendente
    if (palavras.length <= 4 && temAlguma(texto, ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'e ai', 'eai', 'hey', 'opa'])) {
        return { html: 'Oi! Em que posso ajudar? Pode escolher um dos assuntos aqui embaixo.' }
    }
    if (temAlguma(texto, ['obrigad', 'valeu', 'vlw', 'brigad', 'agradec'])) {
        return { html: 'De nada! Se surgir outra dúvida, é só chamar. 😊' }
    }
    if (temAlguma(texto, ['humano', 'atendente', 'falar com alguem', 'suporte', 'contato', 'telefone', 'whatsapp'])) {
        return { html: `Nesta versão do projeto não há atendimento por uma pessoa. A Central de Ajuda tem todas as respostas, e dúvidas sobre impostos devem ir para um contador.${linksBotHtml([{ texto: 'Abrir a Central de Ajuda', href: 'ajuda.html' }])}` }
    }

    // 5) Pergunta da Central de Ajuda mais parecida (usada pela IA como "saiba mais" e como plano B)
    const ranking = AJUDA_PERGUNTAS
        .map((item) => ({ item, pontos: pontuarPerguntaBot(texto, item) }))
        .filter((r) => r.pontos >= 2)
        .sort((a, b) => b.pontos - a.pontos)

    // 6) IA ligada: ela responde, com base na Central de Ajuda (backend/assistente.js)
    let aviso = ''
    if (helperbot.ia) {
        const ia = await perguntarIA(textoOriginal, logado)
        if (ia.ok) {
            const saiba = ranking[0] && ranking[0].pontos >= 3 ? `<p class="helperbot-tambem">Saiba mais: <a href="ajuda.html#${ranking[0].item.id}">${escaparHtml(ranking[0].item.pergunta)}</a></p>` : ''
            return { html: `${formatarTextoIA(ia.resposta)}${saiba}<span class="helperbot-selo-ia">Resposta gerada por IA</span>`, memoria: ia.resposta }
        }
        if (ia.mensagem) aviso = `<p class="helperbot-tambem">${escaparHtml(ia.mensagem)} Usei a Central de Ajuda.</p>`
    }

    // 7) Sem IA (ou se ela falhar): devolve a resposta da Central de Ajuda
    if (ranking.length) {
        const [melhor, segunda] = ranking
        const tambem = segunda && segunda.pontos >= melhor.pontos - 1 ? `<p class="helperbot-tambem">Veja também: <a href="ajuda.html#${segunda.item.id}">${escaparHtml(segunda.item.pergunta)}</a></p>` : ''
        return { html: `<strong>${escaparHtml(melhor.item.pergunta)}</strong><p>${melhor.item.resposta}</p>${linksBotHtml(melhor.item.links)}${tambem}${aviso}` }
    }

    // 8) Não entendeu
    return { html: `Hum, não achei uma resposta para isso. 😅 Tenta com outras palavras, escolhe um assunto aqui embaixo ou procura na Central de Ajuda.${linksBotHtml([{ texto: 'Abrir a Central de Ajuda', href: 'ajuda.html' }])}` }
}

// Pontos: palavra-chave inteira vale 2 (3 se tiver mais de uma palavra); palavra da pergunta vale 1.
function pontuarPerguntaBot(texto, item) {
    let pontos = 0
    item.palavras.forEach((palavra) => {
        const termo = normalizarBot(palavra).trim()
        if (termo && texto.includes(` ${termo}`)) pontos += termo.includes(' ') ? 3 : 2
    })
    normalizarBot(item.pergunta).trim().split(' ').filter((p) => p.length > 4).forEach((p) => { if (texto.includes(` ${p}`)) pontos += 1 })
    return pontos
}

// Envia a pergunta para o backend, que fala com a IA. A chave da IA nunca passa pelo navegador.
async function perguntarIA(texto, logado) {
    try {
        const resposta = await fetch(API_URL + '/api/assistente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensagem: texto, historico: helperbot.conversa, logado })
        })
        const dados = await resposta.json().catch(() => ({}))
        if (resposta.ok && dados.resposta) return { ok: true, resposta: dados.resposta }
        if (resposta.status === 503) helperbot.ia = false
        return { ok: false, mensagem: resposta.status === 429 ? dados.mensagem : 'A IA não respondeu agora.' }
    } catch (erro) {
        return { ok: false, mensagem: 'A IA não respondeu agora.' }
    }
}

// O texto da IA é tratado como texto comum (nada de HTML vindo de fora); só **negrito** e quebras de linha viram formatação.
function formatarTextoIA(texto) {
    return escaparHtml(texto)
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/\n{2,}/g, '<br><br>')
        .replace(/\n/g, '<br>')
}

async function responderCnpj(numeros, logado) {
    if (!logado) return { html: `Eu busco empresas pelo CNPJ, mas só para quem está logado.${linksBotHtml([{ texto: 'Entrar', href: 'login.html' }])}` }
    const consulta = await consultarCnpj(numeros)
    if (!consulta.ok) return { html: escaparHtml(consulta.mensagem) }
    const dica = document.getElementById('clienteNome') || document.getElementById('contraparte')
        ? '<p class="helperbot-tambem">Para preencher o formulário desta página, use o botão "Buscar pelo CNPJ" / "CNPJ" ao lado do campo.</p>' : ''
    return { html: `Achei! ${cartaoEmpresaHtml(consulta.empresa)}${dica}`, memoria: '[o site mostrou os dados públicos de uma empresa consultada pelo CNPJ]', sugestoes: ['Consultar um CNPJ', 'Quanto sobrou este mês?', 'Planos'] }
}

async function responderSaldoDoMes() {
    const mes = mesAtual()
    let clienteId = ''
    try { clienteId = localStorage.getItem('syncrypta_context_cliente') || '' } catch (erro) { clienteId = '' }
    const filtros = { mes }
    if (clienteId && (estado.clientes.length ? estado.clientes.some((c) => String(c.id) === String(clienteId)) : true)) filtros.clienteId = clienteId
    let { resposta, dados } = await apiRequest('/api/dashboard' + montarQuery(filtros))
    if (!resposta.ok && filtros.clienteId) ({ resposta, dados } = await apiRequest('/api/dashboard' + montarQuery({ mes })))
    if (!resposta.ok) return { html: escaparHtml(dados.mensagem || 'Não consegui ler o seu mês agora.') }
    const nomePerfil = dados.contexto?.clienteNome
    const perfil = nomePerfil && nomePerfil !== 'Todos os perfis' ? ` · ${escaparHtml(nomePerfil)}` : ''
    if (!(dados.movimentacoes || []).length) {
        return { html: `Ainda não há lançamentos em <b>${formatarMes(mes)}</b>${perfil}. Que tal importar o extrato do banco?${linksBotHtml([{ texto: 'Importar extrato', href: 'importacao.html' }, { texto: 'Lançar à mão', href: 'movimentacoes.html' }])}` }
    }
    const saldo = Number(dados.saldoFinal || 0)
    return {
        html: `Resumo de <b>${formatarMes(mes)}</b>${perfil}:
            <div class="helperbot-resumo">
                <div><small>Entrou</small><strong class="value-positive">${formatarMoeda(dados.totalRecebido)}</strong></div>
                <div><small>Saiu</small><strong class="value-negative">${formatarMoeda(dados.totalPago)}</strong></div>
                <div><small>${saldo >= 0 ? 'Sobrou' : 'Faltou'}</small><strong class="${saldo >= 0 ? 'value-positive' : 'value-negative'}">${formatarMoeda(Math.abs(saldo))}</strong></div>
            </div>
            <p class="helperbot-tambem">O saldo considera o saldo inicial do mês, se você cadastrou.</p>
            ${linksBotHtml([{ texto: 'Abrir a Visão geral', href: 'dashboard.html' }])}`,
        memoria: '[o site mostrou o resumo do mês da pessoa: entrou, saiu e sobrou]',
        sugestoes: ['Onde vejo quanto sobrou no mês?', 'O que é a previsão de caixa?', 'Importar extrato']
    }
}

document.addEventListener('DOMContentLoaded', () => montarHelperbot())

