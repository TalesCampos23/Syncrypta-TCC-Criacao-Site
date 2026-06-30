const planos = {
    basico: {
        id: 'basico',
        nome: 'Básico',
        preco: 0,
        destaque: 'Organização essencial',
        recursos: [
            'dashboard',
            'movimentacoes',
            'importar_csv',
            'exportar_csv',
            'graficos_basicos',
            'notificacoes'
        ]
    },
    profissional: {
        id: 'profissional',
        nome: 'Profissional',
        preco: 49.90,
        destaque: 'Mais escolhido',
        recursos: [
            'dashboard',
            'movimentacoes',
            'importar_csv',
            'importar_excel',
            'importar_ofx',
            'revisao_importacao',
            'exportar_csv',
            'exportar_excel',
            'graficos_basicos',
            'graficos_avancados',
            'notificacoes',
            'clientes',
            'regras_automaticas',
            'previsao_caixa',
            'relatorios_avancados'
        ]
    },
    empresarial: {
        id: 'empresarial',
        nome: 'Empresarial',
        preco: 99.90,
        destaque: 'Operação completa',
        recursos: [
            'dashboard',
            'movimentacoes',
            'importar_csv',
            'importar_excel',
            'importar_ofx',
            'revisao_importacao',
            'exportar_csv',
            'exportar_excel',
            'graficos_basicos',
            'graficos_avancados',
            'notificacoes',
            'clientes',
            'regras_automaticas',
            'previsao_caixa',
            'relatorios_avancados',
            'centros_custo',
            'multiplos_usuarios',
            'multiplas_empresas',
            'auditoria',
            'integracao_api',
            'suporte_prioritario'
        ]
    }
}

module.exports = planos
