// backend-posts-imagens/models/Post.js
const mongoose = require('mongoose');

// Define o schema para um Post
const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, // O título é obrigatório
        trim: true      // Remove espaços em branco extras do início/fim
    },
    description: {
        type: String,
        required: false, // A descrição é opcional
        trim: true
    },
    imageUrl: {
        type: String,
        required: true   // A URL da imagem é obrigatória
    },
    createdAt: {
        type: Date,
        default: Date.now // A data de criação será automaticamente preenchida
    }
});

// Exporta o modelo para que possa ser usado em outras partes do seu aplicativo
module.exports = mongoose.model('Post', PostSchema);