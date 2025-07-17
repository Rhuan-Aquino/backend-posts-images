// backend-posts-imagens/routes/posts.js

const express = require('express');
const router = express.Router();
const Post = require('../models/post'); // Importa o modelo Post
const multer = require('multer'); // Para lidar com upload de arquivos
const fs = require('fs'); // Módulo nativo para lidar com sistema de arquivos (será usado para deletar localmente)
const path = require('path'); // Módulo nativo para lidar com caminhos de arquivos

// --- Configuração do Cloudinary ---
const cloudinary = require('cloudinary').v2; // Importa o SDK do Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// --- Fim da Configuração do Cloudinary ---

// --- Configuração do Multer (ARMAZENAMENTO EM MEMÓRIA!) ---
// Agora o Multer armazena o arquivo na memória RAM (buffer) em vez de no disco.
// Isso é crucial para enviar para serviços como Cloudinary.
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 } // Limite de 5MB por arquivo (ajuste se necessário)
});
// --- Fim da Configuração do Multer ---


// @route   POST /api/posts
// @desc    Criar um novo post com imagem
// @access  Public
router.post('/', upload.single('image'), async (req, res) => {
    try {
        // Verifica se um arquivo foi enviado
        if (!req.file) {
            return res.status(400).json({ msg: 'Nenhuma imagem enviada. Por favor, inclua um arquivo de imagem com o campo "image".' });
        }

        // --- Upload da imagem para o Cloudinary ---
        const result = await cloudinary.uploader.upload_stream(
            { folder: 'backend-posts-imagens' }, // Pasta para organizar suas imagens no Cloudinary
            async (error, cloudinaryResult) => {
                if (error) {
                    console.error('Erro ao fazer upload para o Cloudinary:', error);
                    return res.status(500).json({ msg: 'Erro ao fazer upload da imagem.' });
                }

                // Se o upload para o Cloudinary foi bem-sucedido:
                const newPost = new Post({
                    title: req.body.title,
                    description: req.body.description,
                    imageUrl: cloudinaryResult.secure_url // Salva a URL segura da imagem do Cloudinary
                });

                const post = await newPost.save();
                res.status(201).json(post);
            }
        ).end(req.file.buffer); // Envia o buffer da imagem (da memória) para o Cloudinary
        // --- Fim do Upload para o Cloudinary ---

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro do Servidor');
    }
});

// @route   GET /api/posts
// @desc    Obter todos os posts
// @access  Public
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }); // Ordena do mais novo para o mais antigo
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro do Servidor');
    }
});

// @route   GET /api/posts/:id
// @desc    Obter um post por ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }

        res.json(post);
    } catch (err) {
        console.error(err.message);
        // Captura o erro se o ID não for um ObjectId válido do MongoDB
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do post inválido' });
        }
        res.status(500).send('Erro do Servidor');
    }
});

// @route   DELETE /api/posts/:id
// @desc    Deletar um post
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }

        // --- Deletar imagem do Cloudinary (se existir) ---
        // Verifica se a URL da imagem é do Cloudinary antes de tentar deletar
        if (post.imageUrl && post.imageUrl.includes('cloudinary.com')) {
            // Extrai o public ID da URL do Cloudinary
            const publicId = post.imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`backend-posts-imagens/${publicId}`, (error, result) => {
                if (error) {
                    console.error('Erro ao deletar imagem do Cloudinary:', error);
                    // Loga o erro, mas não impede a deleção do post no DB
                } else {
                    console.log('Imagem deletada do Cloudinary:', result);
                }
            });
        }

        // Remove o post do MongoDB
        await post.deleteOne(); // Usar post.deleteOne() no Mongoose 6+

        res.json({ msg: 'Post removido com sucesso' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'ID do post inválido' });
        }
        res.status(500).send('Erro do Servidor');
    }
});

module.exports = router;