// backend-posts-imagens/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Conectado: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Erro: ${err.message}`);
        process.exit(1); // Sai do processo com falha
    }
};

module.exports = connectDB;