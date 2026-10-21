// Acrescenta a conta pública fictícia sem apagar dados existentes.
const fs = require('fs')
const path = require('path')
const exemplo = require('./demo-sample.json')
const arquivos = Object.keys(exemplo)
const grupos = {}

for (const nome of arquivos) {
    const arquivo = path.join(__dirname, `${nome}.json`)
    grupos[nome] = fs.existsSync(arquivo) ? JSON.parse(fs.readFileSync(arquivo, 'utf8')) : []
    if (!Array.isArray(grupos[nome])) throw new Error(`${nome}.json não contém uma lista.`)
}
const usuario = grupos.usuarios.find((item) => String(item.id) === '900099')
if (usuario && (usuario.perfil !== 'demonstracao' || usuario.email !== 'visita-demo@syncrypta.local')) {
    throw new Error('O ID da demonstração já pertence a outra conta; os dados foram preservados.')
}
for (const nome of arquivos) {
    for (const item of exemplo[nome]) {
        const existente = grupos[nome].find((atual) => String(atual.id) === String(item.id))
        if (existente && nome !== 'usuarios' && String(existente.usuarioId) !== '900099') {
            throw new Error(`Conflito de ID em ${nome}.json; os dados foram preservados.`)
        }
    }
}
for (const nome of arquivos) {
    const novos = exemplo[nome].filter((item) => !grupos[nome].some((atual) => String(atual.id) === String(item.id)))
    if (!novos.length) continue
    grupos[nome].push(...novos)
    fs.writeFileSync(path.join(__dirname, `${nome}.json`), JSON.stringify(grupos[nome], null, 2), 'utf8')
    console.log(`${nome}: ${novos.length} exemplos adicionados`)
}
console.log('Demonstração pronta; nenhuma conta existente foi alterada.')
