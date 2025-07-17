// backend-posts-imagens/server.js
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
const express = require('express');
const connectDB = require('./config/db'); // Importa a função de conexão com o banco de dados
const cors = require('cors'); // Importa o middleware CORS
const path = require('path'); // Módulo nativo do Node.js para lidar com caminhos de arquivos

const app = express(); // Inicializa o aplicativo Express

// --- Conectar ao Banco de Dados ---
connectDB();

// --- Middlewares Essenciais ---
// Permite que seu frontend (se estiver em um domínio diferente) faça requisições ao backend
app.use(cors());
// Habilita o Express a receber dados JSON no corpo das requisições
app.use(express.json());

// --- Servir Arquivos Estáticos (Imagens Uploaded) ---
// Isso permite que as imagens salvas na pasta 'uploads' sejam acessíveis via URL
// Por exemplo, uma imagem salva como 'image-12345.jpg' poderá ser acessada em http://localhost:3000/uploads/image-12345.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Definir Rotas da API ---
// Quando uma requisição chegar em /api/posts, ela será tratada pelas rotas definidas em ./routes/posts
app.use('/api/posts', require('./routes/posts'));

// --- Rota de Teste Simples ---
// Uma rota básica para verificar se o servidor está online
app.get('/', (req, res) => res.send('API para Posts de Imagens rodando com sucesso!'));

// --- Iniciar o Servidor ---
const PORT = process.env.PORT || 5000; // Usa a porta definida no .env ou a 5000 como fallback

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));