let api = 'http://localhost:3000'
let idEditando = null
let graficoFluxo = null
let graficoCategorias = null
let notificacoesAtuais = []

// TOKEN
function pegarToken() {
    return localStorage.getItem('token')
}

// USUÁRIO
function pegarUsuario() {
    return JSON.parse(localStorage.getItem('usuario')) || null
}
function gerarSigla(nome) {
    if (!nome) {
        return 'AD'
    }

    let partes = nome.trim().split(' ')

    if (partes.length >= 2) {
        let primeiraLetra = partes[0][0]
        let ultimaLetra = partes[partes.length - 1][0]

        return (primeiraLetra + ultimaLetra).toUpperCase()
    }

    let nomeUnico = partes[0]

    if (nomeUnico.length >= 2) {
        return (nomeUnico[0] + nomeUnico[nomeUnico.length - 1]).toUpperCase()
    }

    return nomeUnico.toUpperCase()
}

function pegarChavePlano() {
    let usuario = pegarUsuario()

    if (usuario && usuario.email) {
        return 'planoSyncrypta_' + usuario.email
    }

    return 'planoSyncrypta'
}

function pegarPlanoAtual() {
    return localStorage.getItem(pegarChavePlano()) || 'Básico'
}

function atualizarSidebarUsuario() {
    let usuario = pegarUsuario()
    let avatarPlano = document.getElementById('avatarPlano')
    let nomePlanoAtual = document.getElementById('nomePlanoAtual')

    if (avatarPlano && usuario) {
        avatarPlano.innerText = gerarSigla(usuario.nome)
    }

    if (nomePlanoAtual) {
        nomePlanoAtual.innerText = 'Syncrypta ' + pegarPlanoAtual()
    }
}

// FORMATAR VALOR EM REAL
function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
}

// PROTEGER PÁGINAS INTERNAS
function protegerPagina() {
    let token = pegarToken()

    if (!token) {
        window.location.href = 'login.html'
        return
    }

    let usuario = pegarUsuario()
    let campoUsuario = document.getElementById('usuarioLogado')

    if (campoUsuario && usuario) {
        campoUsuario.innerText = usuario.nome
    }

    atualizarSidebarUsuario()
    atualizarNotificacoes()
}

// LOGIN
let formLogin = document.getElementById('formLogin')

if (formLogin) {
    formLogin.addEventListener('submit', async function(event) {
        event.preventDefault()

        let email = document.getElementById('emailLogin').value
        let senha = document.getElementById('senhaLogin').value

        let resposta = await fetch(api + '/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                senha: senha
            })
        })

        let dados = await resposta.json()

        if (resposta.ok) {
            localStorage.setItem('token', dados.token)
            localStorage.setItem('usuario', JSON.stringify(dados.usuario))

            window.location.href = 'dashboard.html'
        } else {
            alert(dados.mensagem)
        }
    })
}

// SAIR
function sair() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    localStorage.removeItem('usuarioLogado')

    window.location.href = 'index.html'
}

// CADASTRAR OU EDITAR MOVIMENTAÇÃO
let formMovimentacao = document.getElementById('formMovimentacao')

if (formMovimentacao) {
    formMovimentacao.addEventListener('submit', async function(event) {
        event.preventDefault()

        let descricao = document.getElementById('descricao').value
        let tipo = document.getElementById('tipo').value
        let categoria = document.getElementById('categoria').value
        let valor = document.getElementById('valor').value
        let data = document.getElementById('data').value

        if (descricao == '' || tipo == '' || categoria == '' || valor == '' || data == '') {
            alert('Preencha todos os campos')
            return
        }

        let metodo = 'POST'
        let url = api + '/api/movimentacoes'

        if (idEditando != null) {
            metodo = 'PUT'
            url = api + '/api/movimentacoes/' + idEditando
        }

        let resposta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + pegarToken()
            },
            body: JSON.stringify({
                descricao: descricao,
                tipo: tipo,
                categoria: categoria,
                valor: valor,
                data: data
            })
        })

        let dados = await resposta.json()

        if (resposta.ok) {
            formMovimentacao.reset()
            idEditando = null

            let botao = formMovimentacao.querySelector('button')
            botao.innerText = 'Cadastrar'

            listarMovimentacoes()
        } else {
            alert(dados.mensagem)
        }
    })
}

// LISTAR MOVIMENTAÇÕES
async function listarMovimentacoes() {
    let tabela = document.getElementById('tabelaMovimentacoes')

    if (!tabela) {
        return
    }

    let resposta = await fetch(api + '/api/movimentacoes', {
        headers: {
            'Authorization': 'Bearer ' + pegarToken()
        }
    })

    let movimentacoes = await resposta.json()

    tabela.innerHTML = ''

    if (movimentacoes.length == 0) {
        tabela.innerHTML = '<tr><td colspan="6">Nenhuma movimentação cadastrada</td></tr>'
        return
    }

    movimentacoes.forEach(function(item) {
        tabela.innerHTML += `
            <tr>
                <td>${item.descricao}</td>
                <td>${item.tipo}</td>
                <td>${item.categoria}</td>
                <td>${formatarMoeda(item.valor)}</td>
                <td>${item.data}</td>
                <td>
                    <button onclick="editarMovimentacao(${item.id})">Editar</button>
                    <button onclick="excluirMovimentacao(${item.id})">Excluir</button>
                </td>
            </tr>
        `
    })
}

// EXCLUIR MOVIMENTAÇÃO
async function excluirMovimentacao(id) {
    let confirmar = confirm('Tem certeza que deseja excluir esta movimentação?')

    if (!confirmar) {
        return
    }

    let resposta = await fetch(api + '/api/movimentacoes/' + id, {
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + pegarToken()
        }
    })

    let dados = await resposta.json()

    if (resposta.ok) {
        listarMovimentacoes()
    } else {
        alert(dados.mensagem)
    }
}

// EDITAR MOVIMENTAÇÃO
async function editarMovimentacao(id) {
    let resposta = await fetch(api + '/api/movimentacoes', {
        headers: {
            'Authorization': 'Bearer ' + pegarToken()
        }
    })

    let movimentacoes = await resposta.json()

    let item = movimentacoes.find((mov) => {
        return mov.id == id
    })

    if (!item) {
        alert('Movimentação não encontrada')
        return
    }

    document.getElementById('descricao').value = item.descricao
    document.getElementById('tipo').value = item.tipo
    document.getElementById('categoria').value = item.categoria
    document.getElementById('valor').value = item.valor
    document.getElementById('data').value = item.data

    idEditando = id

    let formMovimentacao = document.getElementById('formMovimentacao')
    let botao = formMovimentacao.querySelector('button')
    botao.innerText = 'Salvar edição'

    window.scrollTo(0, 0)
}

// CARREGAR DASHBOARD
async function carregarDashboard() {
    let totalRecebido = document.getElementById('totalRecebido')
    let totalPago = document.getElementById('totalPago')
    let saldoFinal = document.getElementById('saldoFinal')
    let resumoCategorias = document.getElementById('resumoCategorias')
    let tabelaUltimas = document.getElementById('tabelaUltimas')

    if (!totalRecebido || !totalPago || !saldoFinal) {
        return
    }

    let resposta = await fetch(api + '/api/dashboard', {
        headers: {
            'Authorization': 'Bearer ' + pegarToken()
        }
    })

    let dados = await resposta.json()

    totalRecebido.innerText = formatarMoeda(dados.totalRecebido)
    totalPago.innerText = formatarMoeda(dados.totalPago)
    saldoFinal.innerText = formatarMoeda(dados.saldoFinal)

    if (resumoCategorias) {
    resumoCategorias.innerHTML = ''

    for (let categoria in dados.categorias) {
        resumoCategorias.innerHTML += `
            <p><strong>${categoria}:</strong> ${formatarMoeda(dados.categorias[categoria])}</p>
        `
    }
}

    tabelaUltimas.innerHTML = ''

    if (dados.movimentacoes.length == 0) {
        tabelaUltimas.innerHTML = '<tr><td colspan="5">Nenhuma movimentação cadastrada</td></tr>'
        return
    }

    dados.movimentacoes.slice(-5).reverse().forEach(function(item) {
        tabelaUltimas.innerHTML += `
            <tr>
                <td>${item.descricao}</td>
                <td>${item.tipo}</td>
                <td>${item.categoria}</td>
                <td>${formatarMoeda(item.valor)}</td>
                <td>${item.data}</td>
            </tr>
        `
    })
    dados.movimentacoes.slice(-5).reverse().forEach(function(item) {
    tabelaUltimas.innerHTML += `
        <tr>
            <td>${item.descricao}</td>
            <td>${item.tipo}</td>
            <td>${item.categoria}</td>
            <td>${formatarMoeda(item.valor)}</td>
            <td>${item.data}</td>
        </tr>
    `
})
criarGraficos(dados)
}

// IMPORTAR CSV
async function importarCsv() {
    let arquivo = document.getElementById('arquivoCsv').files[0]

    if (!arquivo) {
        alert('Selecione um arquivo CSV')
        return
    }

    let leitor = new FileReader()

    leitor.onload = async function(event) {
        let conteudo = event.target.result
        let linhas = conteudo.split('\n')

        let movimentacoes = []

        for (let i = 1; i < linhas.length; i++) {
            let linha = linhas[i].trim()

            if (linha == '') {
                continue
            }

            let colunas = linha.split(',')

            movimentacoes.push({
                descricao: colunas[0],
                tipo: colunas[1],
                categoria: colunas[2],
                valor: colunas[3],
                data: colunas[4]
            })
        }

        let resposta = await fetch(api + '/api/importar-csv', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + pegarToken()
            },
            body: JSON.stringify({
                linhas: movimentacoes
            })
        })

        let dados = await resposta.json()

        if (resposta.ok) {
            window.location.href = 'dashboard.html'
        } else {
            alert(dados.mensagem)
        }
    }

    leitor.readAsText(arquivo)
}

// CARREGAR RELATÓRIO
async function carregarRelatorio() {
    let relatorio = document.getElementById('relatorioFinal')

    if (!relatorio) {
        return
    }

    let resposta = await fetch(api + '/api/dashboard', {
        headers: {
            'Authorization': 'Bearer ' + pegarToken()
        }
    })

    let dados = await resposta.json()

    relatorio.innerHTML = `
        <p><strong>Total recebido:</strong> ${formatarMoeda(dados.totalRecebido)}</p>
        <p><strong>Total pago:</strong> ${formatarMoeda(dados.totalPago)}</p>
        <p><strong>Saldo final:</strong> ${formatarMoeda(dados.saldoFinal)}</p>
        <p><strong>Total de movimentações:</strong> ${dados.movimentacoes.length}</p>
    `
}

// EXPORTAR CSV
async function exportarCsv() {
    let resposta = await fetch(api + '/api/movimentacoes', {
        headers: {
            'Authorization': 'Bearer ' + pegarToken()
        }
    })

    let movimentacoes = await resposta.json()

    let conteudo = 'Descricao,Tipo,Categoria,Valor,Data\n'

    movimentacoes.forEach(function(item) {
        conteudo += `${item.descricao},${item.tipo},${item.categoria},${item.valor},${item.data}\n`
    })

    let blob = new Blob([conteudo], {
        type: 'text/csv'
    })

    let url = URL.createObjectURL(blob)

    let link = document.createElement('a')
    link.href = url
    link.download = 'relatorio-syncrypta.csv'
    link.click()
}
function criarGraficos(dados) {
    let canvasFluxo = document.getElementById('graficoFluxo')
    let canvasCategorias = document.getElementById('graficoCategorias')

    if (!canvasFluxo || !canvasCategorias) {
        return
    }

    if (graficoFluxo != null) {
        graficoFluxo.destroy()
    }

    if (graficoCategorias != null) {
        graficoCategorias.destroy()
    }

    graficoFluxo = new Chart(canvasFluxo, {
        type: 'bar',
        data: {
            labels: ['Total Recebido', 'Total Pago', 'Saldo Final'],
            datasets: [{
                label: 'Valores em R$',
                data: [
                    dados.totalRecebido,
                    dados.totalPago,
                    dados.saldoFinal
                ],
                backgroundColor: [
                    '#16b8d4',
                    '#ef4444',
                    '#22c55e'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    })

    let nomesCategorias = Object.keys(dados.categorias)
    let valoresCategorias = Object.values(dados.categorias)

    graficoCategorias = new Chart(canvasCategorias, {
        type: 'doughnut',
        data: {
            labels: nomesCategorias,
            datasets: [{
                data: valoresCategorias,
                backgroundColor: [
                    '#16b8d4',
                    '#22c55e',
                    '#f97316',
                    '#8b5cf6',
                    '#ef4444',
                    '#64748b'
                ]
            }]
        },
        options: {
            responsive: true
        }
    })
}
function abrirModalPlano() {
    let modalExiste = document.getElementById('modalPlanos')

    if (modalExiste) {
        modalExiste.style.display = 'flex'
        return
    }

    let modal = document.createElement('div')
    modal.id = 'modalPlanos'
    modal.className = 'modal-planos'

    modal.innerHTML = `
        <div class="modal-conteudo">
            <div class="modal-topo">
                <h2>Escolha seu plano</h2>
                <button onclick="fecharModalPlano()">X</button>
            </div>

            <div class="planos-grid">
                <div class="plano-card" onclick="escolherPlano('Básico')">
                    <h3>Básico</h3>
                    <p class="preco">R$ 0</p>
                    <p>Controle de receitas e pagamentos.</p>
                    <ul>
                        <li>Dashboard financeiro</li>
                        <li>Importação CSV</li>
                        <li>Relatório simples</li>
                    </ul>
                </div>

                <div class="plano-card destaque" onclick="escolherPlano('Profissional')">
                    <h3>Profissional</h3>
                    <p class="preco">R$ 49,90</p>
                    <p>Mais recursos para empresas e contadores.</p>
                    <ul>
                        <li>Relatórios avançados</li>
                        <li>Classificação inteligente</li>
                        <li>Suporte prioritário</li>
                    </ul>
                </div>

                <div class="plano-card" onclick="escolherPlano('Empresarial')">
                    <h3>Empresarial</h3>
                    <p class="preco">R$ 99,90</p>
                    <p>Solução completa para equipes.</p>
                    <ul>
                        <li>Multiusuários</li>
                        <li>Integrações com ERP</li>
                        <li>Segurança avançada</li>
                    </ul>
                </div>
            </div>
        </div>
    `

    document.body.appendChild(modal)
}

function fecharModalPlano() {
    let modal = document.getElementById('modalPlanos')

    if (modal) {
        modal.style.display = 'none'
    }
}

function escolherPlano(plano) {
    localStorage.setItem(pegarChavePlano(), plano)

    atualizarSidebarUsuario()
    fecharModalPlano()
}
// ATUALIZAR NOTIFICAÇÕES
async function atualizarNotificacoes() {
    let contador = document.getElementById('contadorNotificacoes')
    let texto = document.getElementById('textoNotificacoes')

    if (!contador || !texto) {
        return
    }

    try {
        let resposta = await fetch(api + '/api/dashboard', {
            headers: {
                'Authorization': 'Bearer ' + pegarToken()
            }
        })

        let dados = await resposta.json()

        notificacoesAtuais = []

        if (dados.movimentacoes.length == 0) {
            notificacoesAtuais.push('Nenhuma movimentação cadastrada ainda.')
        }

        if (dados.movimentacoes.length > 0) {
            notificacoesAtuais.push('Você possui ' + dados.movimentacoes.length + ' movimentações cadastradas.')
        }

        if (dados.totalRecebido > 0) {
            notificacoesAtuais.push('Total recebido atualizado: ' + formatarMoeda(dados.totalRecebido) + '.')
        }

        if (dados.totalPago > 0) {
            notificacoesAtuais.push('Total pago atualizado: ' + formatarMoeda(dados.totalPago) + '.')
        }

        if (dados.saldoFinal < 0) {
            notificacoesAtuais.push('Atenção: seu saldo final está negativo.')
        }

        if (dados.saldoFinal > 0) {
            notificacoesAtuais.push('Seu saldo final está positivo: ' + formatarMoeda(dados.saldoFinal) + '.')
        }

        contador.innerText = notificacoesAtuais.length

        if (notificacoesAtuais.length == 1) {
            texto.innerText = '1 nova atualização'
        } else {
            texto.innerText = notificacoesAtuais.length + ' novas atualizações'
        }

    } catch (erro) {
        contador.innerText = '0'
        texto.innerText = 'Sem notificações'
    }
}

// ABRIR NOTIFICAÇÕES
function abrirNotificacoes() {
    let modalExiste = document.getElementById('modalNotificacoes')

    if (modalExiste) {
        modalExiste.remove()
    }

    let modal = document.createElement('div')
    modal.id = 'modalNotificacoes'
    modal.className = 'modal-notificacoes'

    let lista = ''

    if (notificacoesAtuais.length == 0) {
        lista = '<p>Nenhuma notificação no momento.</p>'
    } else {
        notificacoesAtuais.forEach(function(item) {
            lista += `<div class="notificacao-item">🔔 ${item}</div>`
        })
    }

    modal.innerHTML = `
        <div class="notificacoes-conteudo">
            <div class="notificacoes-topo">
                <h3>Notificações</h3>
                <button onclick="fecharNotificacoes()">X</button>
            </div>

            <div class="notificacoes-lista">
                ${lista}
            </div>
        </div>
    `

    document.body.appendChild(modal)
}

// FECHAR NOTIFICAÇÕES
function fecharNotificacoes() {
    let modal = document.getElementById('modalNotificacoes')

    if (modal) {
        modal.remove()
    }
}

function pesquisarMovimentacoes() {
    let texto = document.getElementById('pesquisaMovimentacao').value.toLowerCase()
    let linhas = document.querySelectorAll('#tabelaMovimentacoes tr')

    linhas.forEach(function(linha) {
        let conteudo = linha.innerText.toLowerCase()

        if (conteudo.includes(texto)) {
            linha.style.display = ''
        } else {
            linha.style.display = 'none'
        }
    })
}