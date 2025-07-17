// backend-posts-imagens/routes/posts.js
const express = require('express');
const multer = require('multer');
const path = require('path'); // Módulo nativo do Node.js para lidar com caminhos de arquivos
const fs = require('fs'); // Módulo nativo do Node.js para lidar com sistema de arquivos
const Post = require('../models/post'); // Importa o modelo Post que criamos

const router = express.Router();

// --- Configuração do Multer para Armazenamento de Imagens ---
// Define onde os arquivos serão salvos e como serão nomeados
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Garante que a pasta 'uploads' exista. Se não, ela será criada.
        const uploadDir = './uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Define o nome do arquivo para ser único: campo original + timestamp + extensão original
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/; // Tipos de arquivo permitidos
    const mimetype = filetypes.test(file.mimetype); // Verifica o tipo MIME
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase()); // Verifica a extensão

    if (mimetype && extname) {
        return cb(null, true); // Aceita o arquivo
    } else {
        cb('Error: Apenas imagens são permitidas!'); // Rejeita o arquivo
    }
};

// Inicializa o Multer com as configurações
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB por arquivo (em bytes)
    fileFilter: fileFilter
});

// --- Rotas da API ---

// @route   POST /api/posts
// @desc    Cria um novo post de imagem
// @access  Public (por enquanto, sem autenticação)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        // Verifica se um arquivo foi enviado
        if (!req.file) {
            return res.status(400).json({ msg: 'Nenhuma imagem enviada. Por favor, inclua um arquivo de imagem com o campo "image".' });
        }

        // Cria um novo post usando o modelo
        const newPost = new Post({
            title: req.body.title,
            description: req.body.description,
            // O imageUrl será o caminho público para a imagem no servidor
            imageUrl: `/uploads/${req.file.filename}`
        });

        // Salva o post no banco de dados
        const post = await newPost.save();
        res.status(201).json(post); // Retorna o post criado com status 201 (Created)

    } catch (err) {
        console.error(err.message);
        // Se o erro for do Multer (ex: tipo de arquivo inválido), retorna 400
        if (err.message === 'Apenas imagens são permitidas!') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Erro no Servidor');
    }
});

// @route   GET /api/posts
// @desc    Obtém todos os posts, ordenados do mais recente para o mais antigo
// @access  Public
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }); // Encontra todos e ordena por data de criação decrescente
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no Servidor');
    }
});

// @route   GET /api/posts/:id
// @desc    Obtém um post específico pelo ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id); // Busca um post pelo ID fornecido na URL

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' }); // Retorna 404 se o post não existir
        }

        res.json(post);
    } catch (err) {
        console.error(err.message);
        // Se o ID não for um formato válido do MongoDB, o erro.kind será 'ObjectId'
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }
        res.status(500).send('Erro no Servidor');
    }
});

// @route   DELETE /api/posts/:id
// @desc    Deleta um post específico pelo ID
// @access  Public (por enquanto, sem autenticação)
router.delete('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }

        // Remove o arquivo de imagem do sistema de arquivos local
        const imagePath = path.join(__dirname, '..', post.imageUrl);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath); // Deleta o arquivo
        }

        await Post.deleteOne({ _id: req.params.id }); // Deleta o registro do banco de dados

        res.json({ msg: 'Post removido com sucesso' });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post não encontrado' });
        }
        res.status(500).send('Erro no Servidor');
    }
});


module.exports = router;