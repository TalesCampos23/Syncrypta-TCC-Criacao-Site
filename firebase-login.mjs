// SDK oficial do Firebase carregado somente quando a configuração Web está completa.
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'

export async function iniciarAcessoFirebase({ botao, config, apiUrl, salvarSessao, limparSessao, navegarPara, mostrarToast }) {
    const app = getApps().find((item) => item.name === 'syncrypta-google') || initializeApp(config, 'syncrypta-google')
    const auth = getAuth(app)
    auth.useDeviceLanguage()
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    async function concluir(usuario) {
        const idToken = await usuario.getIdToken()
        const c = JSON.parse(atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        console.log('Diferença em segundos:', Math.round(c.iat - Date.now() / 1000))
        console.log('Diagnóstico Firebase', {
            emailVerificado: c.email_verified === true,
            provedorGoogle: c.firebase?.sign_in_provider === 'google.com',
            identidadeGoogle: !!c.firebase?.identities?.['google.com']?.[0],
            horarioEmissaoValido: typeof c.iat === 'number' && c.iat <= Date.now() / 1000,
            horarioLoginValido: typeof c.auth_time === 'number' && c.auth_time <= Date.now() / 1000
        })
        const resposta = await fetch(apiUrl + '/api/firebase/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken })
        })
        const dados = await resposta.json()
        await signOut(auth).catch(() => { })
        if (!resposta.ok) throw new Error(dados.mensagem || 'Não foi possível entrar com Google.')
        salvarSessao(dados)
        navegarPara('dashboard.html')
    }

    try {
        const retorno = await getRedirectResult(auth)
        if (retorno?.user) await concluir(retorno.user)
    } catch (erro) {
        mostrarToast(erro.message || 'Não foi possível concluir o acesso Google.', 'erro')
    }

    botao.addEventListener('click', async () => {
        botao.disabled = true
        limparSessao()
        try {
            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                await signInWithRedirect(auth, provider)
                return
            }
            const resultado = await signInWithPopup(auth, provider)
            await concluir(resultado.user)
        } catch (erro) {
            if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(erro.code)) {
                try { await signInWithRedirect(auth, provider); return } catch (erroRedirecionamento) { erro = erroRedirecionamento }
            }
            if (erro.code !== 'auth/popup-closed-by-user' && erro.code !== 'auth/cancelled-popup-request') {
                mostrarToast(erro.message || 'Não foi possível entrar com Google.', 'erro')
            }
            botao.disabled = false
        }
    })
}