// ==========================================================
// TOUR DE PRIMEIRO ACESSO · Syncrypta 4.9
// Quem acabou de criar a conta cai no plano Básico sem nenhum dado. Na primeira vez que
// abre a Visão geral, um passo a passo mostra onde fica cada coisa.
// - aparece sozinho só para contas novas ("usuario") ainda sem movimentações;
// - "Pular" ou "Concluir" grava no navegador que a pessoa já viu (não aparece de novo);
// - dá para rever pelo menu do perfil, pela página Ajuda ou abrindo dashboard.html?tour=1.
// ==========================================================

const PASSOS_TOUR = [
    {
        titulo: 'Bem-vindo(a) à Syncrypta, {nome}!',
        texto: 'Sua conta começou no plano Básico e ainda está vazia. Em poucos passos você vê onde fica cada coisa para organizar o seu caixa.'
    },
    {
        alvo: '#saldoInicialInput',
        titulo: 'Comece pelo saldo inicial',
        texto: 'Quanto tinha na conta no começo do mês? Digite aqui e clique em "Salvar saldo". É a base para a Syncrypta calcular quanto sobrou.'
    },
    {
        alvo: '.sidebar a[href="importacao.html"]',
        titulo: 'Importe o extrato do banco',
        texto: 'Baixe o extrato em CSV no app do banco e suba aqui. A Syncrypta sugere uma categoria para cada linha e você confere antes de salvar.'
    },
    {
        alvo: '.sidebar a[href="movimentacoes.html"]',
        titulo: 'Ou lance à mão',
        texto: 'Recebeu um Pix ou pagou um boleto? Registre em Movimentações, com valor, data e categoria. Dá até para lançar em dólar.'
    },
    {
        alvo: '.metric-grid-five',
        titulo: 'Seu mês em números',
        texto: 'Aqui aparecem o saldo inicial, quanto entrou, quanto saiu e quanto sobrou. Mais para baixo ficam os gráficos, o calendário e a previsão.'
    },
    {
        alvo: '#notificationToggle',
        titulo: 'Avisos importantes',
        texto: 'O sino avisa quando aparece um gasto fora do padrão ou algo que merece atenção.'
    },
    {
        alvo: '#helperbotBotao',
        titulo: 'Ficou com dúvida?',
        texto: 'O assistente responde as perguntas mais comuns, busca uma empresa pelo CNPJ e diz quanto sobrou no mês. A página Ajuda tem todas as respostas.'
    },
    {
        titulo: 'Pronto para começar?',
        texto: 'Importe o seu primeiro extrato. Se quiser só testar, baixe o extrato de exemplo e importe ele.',
        final: true
    }
]

const tour = { passo: 0, ativo: false, elementos: null }

function chaveTour() {
    const conta = estado.conta || pegarUsuarioLocal() || {}
    return `syncrypta_tour_visto_${conta.id || 'anonimo'}`
}

function marcarTourVisto() {
    try { localStorage.setItem(chaveTour(), '1') } catch (erro) { /* navegador sem armazenamento: só não lembra */ }
}

// Chamado pelo script.js depois que a Visão geral carrega.
function talvezIniciarTour(dadosDashboard) {
    if (document.body.dataset.page !== 'dashboard') return
    const pedido = new URLSearchParams(location.search).get('tour') === '1'
    if (pedido) {
        history.replaceState(null, '', location.pathname)
        iniciarTour()
        return
    }
    const contaNova = estado.conta?.perfil === 'usuario'
    const semDados = !(dadosDashboard?.movimentacoes || []).length
    let jaViu = false
    try { jaViu = localStorage.getItem(chaveTour()) === '1' } catch (erro) { jaViu = false }
    if (contaNova && semDados && !jaViu) setTimeout(iniciarTour, 600)
}

function iniciarTour() {
    if (tour.ativo) return
    if (document.body.dataset.page !== 'dashboard') { navegarPara('dashboard.html?tour=1', false); return }
    if (typeof fecharMenusTopo === 'function') fecharMenusTopo()
    tour.ativo = true
    tour.passo = 0
    const camada = document.createElement('div')
    camada.className = 'tour-camada'
    camada.innerHTML = `
        <div class="tour-foco" aria-hidden="true"></div>
        <section class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tourTitulo">
            <div class="tour-topo"><span class="tour-contador" id="tourContador"></span><button class="tour-pular" type="button" data-tour="pular">Pular tour</button></div>
            <h2 id="tourTitulo"></h2>
            <p id="tourTexto"></p>
            <div class="tour-extra" id="tourExtra"></div>
            <div class="tour-rodape">
                <div class="tour-pontos" id="tourPontos"></div>
                <div class="tour-botoes">
                    <button class="button button-ghost" type="button" data-tour="voltar">Voltar</button>
                    <button class="button button-primary" type="button" data-tour="proximo">Próximo</button>
                </div>
            </div>
        </section>`
    document.body.appendChild(camada)
    tour.elementos = { camada, foco: camada.querySelector('.tour-foco'), card: camada.querySelector('.tour-card') }
    camada.addEventListener('click', (evento) => {
        const acao = evento.target.closest('[data-tour]')?.dataset.tour
        if (acao === 'pular') encerrarTour()
        if (acao === 'voltar') mostrarPassoTour(tour.passo - 1)
        if (acao === 'proximo') tour.passo === PASSOS_TOUR.length - 1 ? encerrarTour() : mostrarPassoTour(tour.passo + 1)
    })
    document.addEventListener('keydown', teclasTour)
    window.addEventListener('resize', posicionarTour)
    window.addEventListener('scroll', posicionarTour, true)
    mostrarPassoTour(0)
}

function teclasTour(evento) {
    if (!tour.ativo) return
    if (evento.key === 'Escape') encerrarTour()
    if (evento.key === 'ArrowRight' && tour.passo < PASSOS_TOUR.length - 1) mostrarPassoTour(tour.passo + 1)
    if (evento.key === 'ArrowLeft' && tour.passo > 0) mostrarPassoTour(tour.passo - 1)
}

// Só destaca o alvo se ele está realmente na tela (no celular o menu lateral fica escondido).
function alvoVisivel(elemento) {
    if (!elemento) return false
    const caixa = elemento.getBoundingClientRect()
    return caixa.width > 0 && caixa.height > 0 && caixa.right > 0 && caixa.left < window.innerWidth
}

function mostrarPassoTour(indice) {
    if (indice < 0 || indice >= PASSOS_TOUR.length) return
    tour.passo = indice
    const passo = PASSOS_TOUR[indice]
    const nome = String((estado.conta?.nome || '').split(' ')[0] || '').trim()
    document.getElementById('tourTitulo').textContent = passo.titulo.replace(', {nome}', nome ? `, ${nome}` : '')
    document.getElementById('tourTexto').textContent = passo.texto
    document.getElementById('tourContador').textContent = `Passo ${indice + 1} de ${PASSOS_TOUR.length}`
    document.getElementById('tourPontos').innerHTML = PASSOS_TOUR.map((_, i) => `<span class="${i === indice ? 'ativo' : ''}"></span>`).join('')
    document.getElementById('tourExtra').innerHTML = passo.final
        ? '<a class="button button-primary" href="importacao.html">Importar meu extrato</a><a class="button button-secondary" href="arquivos_teste/extrato_teste.csv" download>Baixar extrato de exemplo</a>'
        : ''
    const voltar = tour.elementos.card.querySelector('[data-tour="voltar"]')
    voltar.hidden = indice === 0
    tour.elementos.card.querySelector('[data-tour="proximo"]').textContent = passo.final ? 'Concluir' : indice === 0 ? 'Começar' : 'Próximo'
    const alvo = passo.alvo ? document.querySelector(passo.alvo) : null
    if (alvo && alvoVisivel(alvo)) alvo.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    setTimeout(posicionarTour, 320)
    posicionarTour()
    tour.elementos.card.querySelector('[data-tour="proximo"]').focus({ preventScroll: true })
}

// Coloca o "buraco" de luz em cima do alvo e o cartão ao lado dele, sem sair da tela.
function posicionarTour() {
    if (!tour.ativo) return
    const { foco, card } = tour.elementos
    const passo = PASSOS_TOUR[tour.passo]
    const alvo = passo.alvo ? document.querySelector(passo.alvo) : null
    const margem = 16
    const celular = window.innerWidth < 760
    card.classList.toggle('tour-card-celular', celular)

    if (!alvo || !alvoVisivel(alvo)) {
        foco.classList.add('tour-foco-vazio')
        card.style.left = `${Math.max(margem, (window.innerWidth - card.offsetWidth) / 2)}px`
        card.style.top = celular ? '' : `${Math.max(margem, (window.innerHeight - card.offsetHeight) / 2)}px`
        return
    }
    foco.classList.remove('tour-foco-vazio')
    const caixa = alvo.getBoundingClientRect()
    const folga = 8
    Object.assign(foco.style, {
        left: `${caixa.left - folga}px`, top: `${caixa.top - folga}px`,
        width: `${caixa.width + folga * 2}px`, height: `${caixa.height + folga * 2}px`
    })
    if (celular) { card.style.left = ''; card.style.top = ''; return }

    const largura = card.offsetWidth, altura = card.offsetHeight
    let left, top
    if (caixa.right + 24 + largura < window.innerWidth - margem) { left = caixa.right + 24; top = caixa.top + caixa.height / 2 - altura / 2 }
    else if (caixa.bottom + 24 + altura < window.innerHeight - margem) { left = caixa.left + caixa.width / 2 - largura / 2; top = caixa.bottom + 24 }
    else if (caixa.left - 24 - largura > margem) { left = caixa.left - 24 - largura; top = caixa.top + caixa.height / 2 - altura / 2 }
    else { left = caixa.left + caixa.width / 2 - largura / 2; top = caixa.top - 24 - altura }
    card.style.left = `${Math.min(Math.max(margem, left), window.innerWidth - largura - margem)}px`
    card.style.top = `${Math.min(Math.max(margem, top), window.innerHeight - altura - margem)}px`
}

function encerrarTour() {
    if (!tour.ativo) return
    tour.ativo = false
    marcarTourVisto()
    tour.elementos?.camada.remove()
    document.removeEventListener('keydown', teclasTour)
    window.removeEventListener('resize', posicionarTour)
    window.removeEventListener('scroll', posicionarTour, true)
}

// Atalho "Rever o tour" no menu do perfil (todas as telas internas).
document.addEventListener('DOMContentLoaded', () => {
    const menu = document.getElementById('accountMenu')
    const sair = menu?.querySelector('.account-menu-exit')
    if (!menu || !sair || menu.querySelector('#accountTour')) return
    sair.insertAdjacentHTML('beforebegin', `<button type="button" class="account-menu-action" id="accountTour" onclick="iniciarTour()">${svgIcon('sparkles')}<span>Rever o tour</span>${svgIcon('chevron')}</button>`)
})
