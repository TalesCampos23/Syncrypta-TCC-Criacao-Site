// ==========================================================
// CONSULTA DE CNPJ · Syncrypta 4.9 (4.11: mensagens de erro mais claras)
// Com só o CNPJ, o site busca o nome da empresa, a atividade, a cidade e a situação.
// Quem consulta a BrasilAPI (e, se ela falhar, Minha Receita e CNPJ.ws) é o NOSSO backend (rota /api/cnpj/:cnpj); o navegador só
// conversa com a Syncrypta. O CNPJ não é salvo: ele serve só para preencher os campos.
// Usado em: Perfis financeiros, Movimentações (campo "Quem recebeu ou pagou") e no assistente.
// ==========================================================

// Coloca pontos, barra e traço enquanto a pessoa digita: 00.000.000/0000-00
function formatarCnpj(valor) {
    const d = String(valor || '').replace(/\D/g, '').slice(0, 14)
    if (d.length <= 2) return d
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
    if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

// Pede os dados ao backend. Devolve { ok, empresa } ou { ok: false, mensagem }.
async function consultarCnpj(cnpj) {
    const numeros = String(cnpj || '').replace(/\D/g, '')
    if (numeros.length !== 14) return { ok: false, mensagem: 'Digite os 14 números do CNPJ.' }
    if (!pegarToken()) return { ok: false, mensagem: 'Entre na sua conta para consultar um CNPJ.' }
    const { resposta, dados } = await apiRequest(`/api/cnpj/${numeros}`)
    if (resposta.ok) return { ok: true, empresa: dados }
    // Ajuda a descobrir o problema: servidor desligado ou ainda na versão antiga (sem a rota de CNPJ).
    if (resposta.status === 0) return { ok: false, mensagem: 'O backend não está ligado. Abra o terminal na pasta backend e rode "npm start".' }
    if (resposta.status === 404 && !dados.cnpjNaoEncontrado) return { ok: false, mensagem: 'O backend ainda está na versão antiga. Feche o terminal do servidor e rode "npm start" de novo.' }
    return { ok: false, mensagem: dados.mensagem || 'Não foi possível consultar o CNPJ.' }
}

// Nome que aparece para a pessoa: o fantasia quando existe, senão a razão social.
function nomeDaEmpresa(empresa) {
    return empresa.nomeFantasia || empresa.razaoSocial
}

// Cartão com o resultado, usado no modal e no assistente.
function cartaoEmpresaHtml(empresa) {
    const ativa = String(empresa.situacao || '').toUpperCase() === 'ATIVA'
    const abertura = empresa.abertura ? formatarData(empresa.abertura) : 'Não informada'
    const regime = empresa.mei === true ? 'MEI' : empresa.simples === true ? 'Simples Nacional' : (empresa.porte || 'Não informado')
    return `
        <div class="cnpj-card">
            <div class="cnpj-card-head">
                <span class="user-avatar small">${gerarSigla(nomeDaEmpresa(empresa))}</span>
                <div>
                    <strong>${escaparHtml(nomeDaEmpresa(empresa))}</strong>
                    ${empresa.nomeFantasia ? `<small>${escaparHtml(empresa.razaoSocial)}</small>` : ''}
                </div>
                <span class="cnpj-situacao ${ativa ? 'ativa' : 'alerta'}">${escaparHtml(empresa.situacao || 'Sem situação')}</span>
            </div>
            <dl class="cnpj-dados">
                <div><dt>CNPJ</dt><dd>${formatarCnpj(empresa.cnpj)}</dd></div>
                <div><dt>Atividade principal</dt><dd>${escaparHtml(empresa.atividade || 'Não informada')}</dd></div>
                <div><dt>Cidade</dt><dd>${escaparHtml([empresa.municipio, empresa.uf].filter(Boolean).join(' / ') || 'Não informada')}</dd></div>
                <div><dt>Abertura</dt><dd>${abertura}</dd></div>
                <div><dt>Porte / regime</dt><dd>${escaparHtml(regime)}</dd></div>
            </dl>
            ${ativa ? '' : '<p class="cnpj-aviso">Atenção: essa empresa não está ativa na Receita. Confira antes de usar.</p>'}
            <small class="cnpj-fonte">Fonte: ${escaparHtml(empresa.fonte || 'BrasilAPI')}</small>
        </div>`
}

// Preenche o formulário certo com o resultado.
function usarEmpresaNoFormulario(destino, empresa) {
    const nome = nomeDaEmpresa(empresa)
    if (destino === 'perfil') {
        const campoNome = document.getElementById('clienteNome')
        if (campoNome) campoNome.value = nome
        const perfil = document.getElementById('clientePerfil')
        if (perfil) perfil.value = 'pj'
        const segmento = document.getElementById('clienteSegmento')
        if (segmento && empresa.atividade) segmento.value = empresa.atividade.slice(0, 80)
        campoNome?.focus()
    }
    if (destino === 'contraparte') {
        const campo = document.getElementById('contraparte')
        if (campo) { campo.value = nome; campo.focus() }
    }
    fecharModalGeral()
    mostrarToast('Dados preenchidos pelo CNPJ. Confira antes de salvar.')
}

// Abre o modal "Buscar empresa pelo CNPJ". destino: 'perfil' ou 'contraparte'.
function abrirConsultaCnpj(destino) {
    const textoBotao = destino === 'perfil' ? 'Usar no perfil' : 'Usar como "quem recebeu ou pagou"'
    abrirModal({
        titulo: 'Buscar empresa pelo CNPJ',
        largura: '600px',
        conteudo: `
            <p class="helper-text cnpj-intro">Digite só o CNPJ. A Syncrypta busca nome, atividade e cidade na base pública da Receita Federal. O CNPJ não fica salvo.</p>
            <form class="cnpj-form" id="formCnpj">
                <input class="input" id="cnpjBusca" inputmode="numeric" autocomplete="off" maxlength="18" placeholder="00.000.000/0000-00" aria-label="CNPJ">
                <button class="button button-primary" type="submit">${svgIcon('search')}<span>Buscar</span></button>
            </form>
            <div id="cnpjResultado" class="cnpj-resultado" aria-live="polite"></div>`
    })
    const formulario = document.getElementById('formCnpj')
    const campo = document.getElementById('cnpjBusca')
    const resultado = document.getElementById('cnpjResultado')
    campo.addEventListener('input', () => { campo.value = formatarCnpj(campo.value) })
    campo.focus()
    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault()
        const botao = formulario.querySelector('button')
        setCarregando(botao, true, 'Buscando...')
        resultado.innerHTML = ''
        const consulta = await consultarCnpj(campo.value)
        setCarregando(botao, false)
        if (!consulta.ok) {
            resultado.innerHTML = `<p class="cnpj-erro">${escaparHtml(consulta.mensagem)}</p>`
            return
        }
        resultado.innerHTML = `${cartaoEmpresaHtml(consulta.empresa)}
            <div class="modal-actions"><button class="button button-ghost" type="button" onclick="fecharModalGeral()">Cancelar</button><button class="button button-primary" type="button" id="usarCnpj">${svgIcon('check')}<span>${textoBotao}</span></button></div>`
        document.getElementById('usarCnpj').addEventListener('click', () => usarEmpresaNoFormulario(destino, consulta.empresa))
    })
}
