let mongoose = require('mongoose')

let movimentacaoSchema = new mongoose.Schema({
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },

    descricao: {
        type: String,
        required: true
    },

    tipo: {
        type: String,
        required: true
    },

    categoria: {
        type: String,
        required: true
    },

    valor: {
        type: Number,
        required: true
    },

    data: {
        type: String,
        required: true
    },

    criadoEm: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Movimentacao', movimentacaoSchema)