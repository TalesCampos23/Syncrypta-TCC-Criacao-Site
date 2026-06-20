let express = require('express')
let cors = require('cors')
let bcrypt = require('bcryptjs')
let jwt = require('jsonwebtoken')
let fs = require('fs')

let app = express()

app.use(cors())
app.use(express.json())

let arquivoUsuarios = './usuarios.json'
let arquivoMovimentacoes = './movimentacoes.json'
let segredo = 'syncrypta_tcc_secreto'

// USUÁRIOS
function lerUsuarios() {
    if (!fs.existsSync(arquivoUsuarios)) {
        fs.writeFileSync(arquivoUsuarios, '[]')
    }

    let dados = fs.readFileSync(arquivoUsuarios)
    return JSON.parse(dados)
}

function salvarUsuarios(usuarios) {
    fs.writeFileSync(arquivoUsuarios, JSON.stringify(usuarios, null, 2))
}

// MOVIMENTAÇÕES
function lerMovimentacoes() {
    if (!fs.existsSync(arquivoMovimentacoes)) {
        fs.writeFileSync(arquivoMovimentacoes, '[]')
    }

    let dados = fs.readFileSync(arquivoMovimentacoes)
    return JSON.parse(dados)
}

function salvarMovimentacoes(movimentacoes) {
    fs.writeFileSync(arquivoMovimentacoes, JSON.stringify(movimentacoes, null, 2))
}

// VERIFICAR TOKEN
function verificarToken(req, res, next) {
    let auth = req.headers.authorization

    if (!auth) {
        return res.status(401).json({
            mensagem: 'token não enviado'
        })
    }

    let token = auth.split(' ')[1]

    try {
        let dados = jwt.verify(token, segredo)
        req.usuarioId = dados.id
        next()
    } catch (erro) {
        return res.status(401).json({
            mensagem: 'token inválido'
        })
    }
}

// TESTE DA API
app.get('/', (req, res) => {
    res.send('api syncrypta funcionando')
})

// CADASTRO
app.post('/api/cadastro', async (req, res) => {
    let nome = req.body.nome
    let email = req.body.email
    let senha = req.body.senha

    if (!nome || !email || !senha) {
        return res.status(400).json({
            mensagem: 'preencha todos os campos'
        })
    }

    let usuarios = lerUsuarios()

    let usuarioExiste = usuarios.find((usuario) => {
        return usuario.email == email
    })

    if (usuarioExiste) {
        return res.status(400).json({
            mensagem: 'este email já está cadastrado'
        })
    }

    let senhaCriptografada = await bcrypt.hash(senha, 10)

    let novoUsuario = {
        id: Date.now(),
        nome: nome,
        email: email,
        senha: senhaCriptografada
    }

    usuarios.push(novoUsuario)
    salvarUsuarios(usuarios)

    res.status(201).json({
        mensagem: 'cadastro realizado com sucesso'
    })
})

// LOGIN
app.post('/api/login', async (req, res) => {
    let email = req.body.email
    let senha = req.body.senha

    if (!email || !senha) {
        return res.status(400).json({
            mensagem: 'preencha email e senha'
        })
    }

    let usuarios = lerUsuarios()

    let usuario = usuarios.find((item) => {
        return item.email == email
    })

    if (!usuario) {
        return res.status(400).json({
            mensagem: 'email ou senha inválidos'
        })
    }

    let senhaCorreta = await bcrypt.compare(senha, usuario.senha)

    if (!senhaCorreta) {
        return res.status(400).json({
            mensagem: 'email ou senha inválidos'
        })
    }

    let token = jwt.sign(
        {
            id: usuario.id,
            email: usuario.email
        },
        segredo,
        {
            expiresIn: '1d'
        }
    )

    res.json({
        mensagem: 'login realizado com sucesso',
        token: token,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email
        }
    })
})

// CADASTRAR MOVIMENTAÇÃO
app.post('/api/movimentacoes', verificarToken, (req, res) => {
    let descricao = req.body.descricao
    let tipo = req.body.tipo
    let categoria = req.body.categoria
    let valor = Number(req.body.valor)
    let data = req.body.data

    if (!descricao || !tipo || !categoria || !valor || !data) {
        return res.status(400).json({
            mensagem: 'preencha todos os campos'
        })
    }

    let movimentacoes = lerMovimentacoes()

    let novaMovimentacao = {
        id: Date.now(),
        usuarioId: req.usuarioId,
        descricao: descricao,
        tipo: tipo.toLowerCase(),
        categoria: categoria,
        valor: valor,
        data: data
    }

    movimentacoes.push(novaMovimentacao)
    salvarMovimentacoes(movimentacoes)

    res.status(201).json({
        mensagem: 'movimentação cadastrada com sucesso',
        movimentacao: novaMovimentacao
    })
})

// LISTAR MOVIMENTAÇÕES
app.get('/api/movimentacoes', verificarToken, (req, res) => {
    let movimentacoes = lerMovimentacoes()

    let minhasMovimentacoes = movimentacoes.filter((item) => {
        return item.usuarioId == req.usuarioId
    })

    res.json(minhasMovimentacoes)
})

// EXCLUIR MOVIMENTAÇÃO
app.delete('/api/movimentacoes/:id', verificarToken, (req, res) => {
    let movimentacoes = lerMovimentacoes()

    let novasMovimentacoes = movimentacoes.filter((item) => {
        return !(item.id == req.params.id && item.usuarioId == req.usuarioId)
    })

    salvarMovimentacoes(novasMovimentacoes)

    res.json({
        mensagem: 'movimentação excluída com sucesso'
    })
})

// EDITAR MOVIMENTAÇÃO
app.put('/api/movimentacoes/:id', verificarToken, (req, res) => {
    let movimentacoes = lerMovimentacoes()

    let id = req.params.id

    let descricao = req.body.descricao
    let tipo = req.body.tipo
    let categoria = req.body.categoria
    let valor = Number(req.body.valor)
    let data = req.body.data

    if (!descricao || !tipo || !categoria || !valor || !data) {
        return res.status(400).json({
            mensagem: 'preencha todos os campos'
        })
    }

    let encontrada = false

    movimentacoes = movimentacoes.map((item) => {
        if (item.id == id && item.usuarioId == req.usuarioId) {
            encontrada = true

            return {
                id: item.id,
                usuarioId: item.usuarioId,
                descricao: descricao,
                tipo: tipo.toLowerCase(),
                categoria: categoria,
                valor: valor,
                data: data
            }
        }

        return item
    })

    if (!encontrada) {
        return res.status(404).json({
            mensagem: 'movimentação não encontrada'
        })
    }

    salvarMovimentacoes(movimentacoes)

    res.json({
        mensagem: 'movimentação editada com sucesso'
    })
})

// DASHBOARD
app.get('/api/dashboard', verificarToken, (req, res) => {
    let movimentacoes = lerMovimentacoes()

    let minhasMovimentacoes = movimentacoes.filter((item) => {
        return item.usuarioId == req.usuarioId
    })

    let totalRecebido = 0
    let totalPago = 0
    let categorias = {}

    minhasMovimentacoes.forEach((item) => {
        if (item.tipo == 'receita') {
            totalRecebido = totalRecebido + Number(item.valor)
        } else {
            totalPago = totalPago + Number(item.valor)
        }

        if (!categorias[item.categoria]) {
            categorias[item.categoria] = 0
        }

        categorias[item.categoria] = categorias[item.categoria] + Number(item.valor)
    })

    res.json({
        totalRecebido: totalRecebido,
        totalPago: totalPago,
        saldoFinal: totalRecebido - totalPago,
        categorias: categorias,
        movimentacoes: minhasMovimentacoes
    })
})

// IMPORTAR CSV
app.post('/api/importar-csv', verificarToken, (req, res) => {
    let linhas = req.body.linhas

    if (!linhas || linhas.length == 0) {
        return res.status(400).json({
            mensagem: 'nenhuma linha enviada'
        })
    }

    let movimentacoes = lerMovimentacoes()

    linhas.forEach((item) => {
        let novaMovimentacao = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            usuarioId: req.usuarioId,
            descricao: item.descricao,
            tipo: item.tipo.toLowerCase(),
            categoria: item.categoria,
            valor: Number(item.valor),
            data: item.data
        }

        movimentacoes.push(novaMovimentacao)
    })

    salvarMovimentacoes(movimentacoes)

    res.json({
        mensagem: 'csv importado com sucesso'
    })
})

app.listen(3000, () => {
    console.log('servidor rodando na porta 3000')
})