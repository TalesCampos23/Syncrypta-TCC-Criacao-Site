let mongoose = require('mongoose')

let usuarioSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    senha: {
        type: String,
        required: true
    },

    criadoEm: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Usuario', usuarioSchema)