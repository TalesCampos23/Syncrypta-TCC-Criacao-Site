let api = 'http://localhost:3000'

let formCadastro = document.getElementById('formCadastro')

if (formCadastro) {
    formCadastro.addEventListener('submit', async (event) => {
        event.preventDefault()

        let nome = document.getElementById('nome').value
        let email = document.getElementById('email').value
        let senha = document.getElementById('senha').value

        let resposta = await fetch(api + '/api/cadastro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: nome,
                email: email,
                senha: senha
            })
        })

        let dados = await resposta.json()

        alert(dados.mensagem)

        if (resposta.ok) {
            window.location.href = 'login.html'
        }
    })
}

let formLogin = document.getElementById('formLogin')

if (formLogin) {
    formLogin.addEventListener('submit', async (event) => {
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

        alert(dados.mensagem)

        if (resposta.ok) {
            localStorage.setItem('token', dados.token)
            localStorage.setItem('usuario', JSON.stringify(dados.usuario))

            window.location.href = 'index.html'
        }
    })
}