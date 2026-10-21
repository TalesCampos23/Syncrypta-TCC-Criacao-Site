// ==========================================================
// CONFIGURAÇÕES E ADMINISTRAÇÃO DE USUÁRIOS · Syncrypta 4.13
// Rotas da página configuracoes.html:
//   GET  /api/configuracoes                 dados da conta + preferências
//   PUT  /api/configuracoes/preferencias    aparência e uso (fonte, densidade, cor, página inicial...)
//   PUT  /api/configuracoes/perfil          nome de exibição
//   PUT  /api/configuracoes/senha           troca de senha (pede a senha atual)
//   GET  /api/admin/usuarios                [só master] lista de contas
//   PUT  /api/admin/usuarios/:id            [só master] trocar plano, suspender ou reativar
// As preferências ficam salvas na conta (usuarios.json), então valem em qualquer computador.
// ==========================================================

// Valores aceitos em cada preferência; o primeiro de cada lista é o padrão.
const OPCOES = {
    paginaInicial: ['dashboard', 'movimentacoes', 'importacao', 'relatorios'],
    graficoPadrao: ['bar', 'line'],
    densidade: ['confortavel', 'compacta'],
    fonte: ['normal', 'grande'],
    destaque: ['ciano', 'roxo'],
    animacoes: [true, false],
    assistente: [true, false]
}

function preferenciasDe(usuario) {
    const salvas = usuario?.preferencias || {}
    return Object.fromEntries(Object.entries(OPCOES).map(([chave, valores]) => [chave, valores.includes(salvas[chave]) ? salvas[chave] : valores[0]]))
}

module.exports = function ({ app, verificarToken, exigirMaster, lerJson, salvarJson, arquivos, limparTexto, registrarAuditoria, planos, bcrypt, masterId, demoPublico }) {
    // No site publicado (demonstração pública), as contas de exemplo não podem ter senha trocada nem
    // ser suspensas, senão um visitante poderia trancar a banca para fora.
    const contaDeExemploProtegida = (conta) => demoPublico && Number(conta.id) >= 900000 && Number(conta.id) < 900100
    const ehMaster = (conta) => String(conta?.id) === String(masterId) && conta?.perfil === 'cliente_tcc'

    // ---------- Configurações da própria conta ----------
    app.get('/api/configuracoes', verificarToken, (req, res) => {
        const conta = req.conta
        res.json({
            conta: {
                nome: conta.nome,
                email: conta.email,
                perfil: conta.perfil || 'usuario',
                plano: req.demo ? req.demoPlano : conta.plano,
                master: ehMaster(conta),
                temSenha: Boolean(conta.senha),
                google: Boolean(conta.googleSub || conta.firebaseUid),
                podeTrocarSenha: !req.demo && !req.portal && !ehMaster(conta) && !contaDeExemploProtegida(conta)
            },
            preferencias: preferenciasDe(conta),
            opcoes: OPCOES
        })
    })

    app.put('/api/configuracoes/preferencias', verificarToken, (req, res) => {
        const usuarios = lerJson(arquivos.usuarios)
        const conta = usuarios.find((item) => String(item.id) === String(req.contaId))
        if (!conta) return res.status(404).json({ mensagem: 'Conta não encontrada.' })
        const atuais = preferenciasDe(conta)
        for (const [chave, valores] of Object.entries(OPCOES)) {
            if (chave in (req.body || {}) && valores.includes(req.body[chave])) atuais[chave] = req.body[chave]
        }
        conta.preferencias = atuais
        salvarJson(arquivos.usuarios, usuarios)
        res.json({ mensagem: 'Preferências salvas.', preferencias: atuais })
    })

    app.put('/api/configuracoes/perfil', verificarToken, (req, res) => {
        const nome = limparTexto(req.body.nome, 80)
        if (nome.length < 2) return res.status(400).json({ mensagem: 'Digite um nome com pelo menos 2 letras.' })
        const usuarios = lerJson(arquivos.usuarios)
        const conta = usuarios.find((item) => String(item.id) === String(req.contaId))
        if (!conta) return res.status(404).json({ mensagem: 'Conta não encontrada.' })
        if (contaDeExemploProtegida(conta)) return res.status(403).json({ mensagem: 'Na demonstração pública, as contas de exemplo não podem ser alteradas.' })
        conta.nome = nome
        salvarJson(arquivos.usuarios, usuarios)
        registrarAuditoria(req.contaId, 'EDITOU_PERFIL', 'usuario', { nome })
        res.json({ mensagem: 'Nome atualizado.', nome })
    })

    app.put('/api/configuracoes/senha', verificarToken, async (req, res) => {
        const usuarios = lerJson(arquivos.usuarios)
        const conta = usuarios.find((item) => String(item.id) === String(req.contaId))
        if (!conta) return res.status(404).json({ mensagem: 'Conta não encontrada.' })
        if (ehMaster(conta)) return res.status(403).json({ mensagem: 'A senha da conta master é definida no servidor (arquivo .env), não por aqui.' })
        if (contaDeExemploProtegida(conta)) return res.status(403).json({ mensagem: 'Na demonstração pública, a senha das contas de exemplo não pode ser trocada.' })
        const novaSenha = String(req.body.novaSenha || '')
        if (novaSenha.length < 8 || !/[A-Za-z]/.test(novaSenha) || !/\d/.test(novaSenha)) {
            return res.status(400).json({ mensagem: 'A nova senha precisa ter pelo menos 8 caracteres, com letras e números.' })
        }
        // Quem tem senha precisa digitar a atual. Conta criada só pelo Google pode criar a primeira senha.
        if (conta.senha && !(await bcrypt.compare(String(req.body.senhaAtual || ''), conta.senha))) {
            return res.status(400).json({ mensagem: 'A senha atual não confere.' })
        }
        conta.senha = await bcrypt.hash(novaSenha, 10)
        salvarJson(arquivos.usuarios, usuarios)
        registrarAuditoria(req.contaId, 'TROCOU_SENHA', 'usuario', {})
        res.json({ mensagem: 'Senha alterada.' })
    })

    // ---------- Administração de usuários (só a conta master) ----------
    function tipoDeConta(conta) {
        if (ehMaster(conta)) return 'master'
        if (conta.perfil === 'portal_cliente') return 'cliente'
        if (conta.perfil === 'demonstracao') return 'visita'
        return 'usuario'
    }

    app.get('/api/admin/usuarios', verificarToken, exigirMaster, (req, res) => {
        const clientes = lerJson(arquivos.clientes)
        // Último login de cada conta, a partir da auditoria
        const ultimoLogin = {}
        for (const registro of lerJson(arquivos.auditoria)) {
            if (registro.acao !== 'LOGIN') continue
            const id = String(registro.usuarioId)
            if (!ultimoLogin[id] || registro.dataHora > ultimoLogin[id]) ultimoLogin[id] = registro.dataHora
        }
        const contas = lerJson(arquivos.usuarios).map((conta) => ({
            id: conta.id,
            nome: conta.nome,
            email: conta.email,
            tipo: tipoDeConta(conta),
            plano: conta.plano || 'basico',
            ativo: conta.ativo !== false,
            criadoEm: conta.criadoEm || null,
            ultimoLogin: ultimoLogin[String(conta.id)] || null,
            login: [conta.senha ? 'senha' : null, conta.googleSub || conta.firebaseUid ? 'google' : null].filter(Boolean),
            perfilAcessado: conta.perfil === 'portal_cliente' ? (clientes.find((c) => String(c.id) === String(conta.clienteId))?.nome || 'Perfil removido') : null,
            protegida: ehMaster(conta) || conta.perfil === 'demonstracao' || contaDeExemploProtegida(conta)
        }))
        res.json({ contas, planos: Object.values(planos).map((p) => ({ id: p.id, nome: p.nome, recursos: p.recursos })) })
    })

    app.put('/api/admin/usuarios/:id', verificarToken, exigirMaster, (req, res) => {
        const usuarios = lerJson(arquivos.usuarios)
        const conta = usuarios.find((item) => String(item.id) === String(req.params.id))
        if (!conta) return res.status(404).json({ mensagem: 'Conta não encontrada.' })
        if (ehMaster(conta)) return res.status(403).json({ mensagem: 'A conta master não pode ser alterada por aqui.' })
        if (conta.perfil === 'demonstracao') return res.status(403).json({ mensagem: 'A conta de visita da demonstração não pode ser alterada.' })
        if (contaDeExemploProtegida(conta)) return res.status(403).json({ mensagem: 'Na demonstração pública, as contas de exemplo não podem ser alteradas.' })

        const mudancas = {}
        if ('plano' in req.body) {
            if (conta.perfil === 'portal_cliente') return res.status(400).json({ mensagem: 'Contas de cliente usam o acesso de leitura do perfil, sem plano próprio.' })
            if (!planos[req.body.plano]) return res.status(400).json({ mensagem: 'Plano inválido.' })
            if (conta.plano !== req.body.plano) {
                mudancas.plano = { de: conta.plano || 'basico', para: req.body.plano }
                conta.plano = req.body.plano
                conta.pagamentoStatus = req.body.plano === 'basico' ? 'gratuito' : 'liberado_admin'
            }
        }
        if ('ativo' in req.body) {
            const ativo = req.body.ativo !== false
            if ((conta.ativo !== false) !== ativo) {
                mudancas.ativo = ativo
                conta.ativo = ativo
            }
        }
        if (!Object.keys(mudancas).length) return res.json({ mensagem: 'Nada mudou.' })
        salvarJson(arquivos.usuarios, usuarios)
        if (mudancas.plano) registrarAuditoria(req.contaId, 'ADMIN_ALTEROU_PLANO', 'usuario', { email: conta.email, plano: mudancas.plano.para })
        if ('ativo' in mudancas) registrarAuditoria(req.contaId, mudancas.ativo ? 'ADMIN_REATIVOU_CONTA' : 'ADMIN_SUSPENDEU_CONTA', 'usuario', { email: conta.email })
        res.json({ mensagem: mudancas.ativo === false ? 'Conta suspensa: ela não consegue mais entrar.' : mudancas.ativo === true ? 'Conta reativada.' : 'Plano alterado.' })
    })
}

module.exports.preferenciasDe = preferenciasDe
