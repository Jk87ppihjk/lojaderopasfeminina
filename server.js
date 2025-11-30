// server.js (ou o arquivo principal do seu backend)
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Para carregar suas variáveis do .env

const app = express();
const port = process.env.PORT || 3000;

// Middleware para JSON e URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURAÇÃO DO CLOUDINARY ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- CONFIGURAÇÃO DO MULTER (sem salvar o arquivo, apenas em buffer) ---
// O destino 'memoryStorage' faz com que o arquivo fique na memória antes de ser enviado
// para o Cloudinary.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- MIDDLEWARE DE AUTENTICAÇÃO (AuthAdmin) ---
// (Mantemos a função diretamente aqui na raiz)
const authAdmin = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) return res.status(401).send('Acesso negado. Token não fornecido.');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; 
        
        // Verificação de 'admin' (Assumindo que o token tem um campo 'role')
        if (req.usuario.role !== 'admin') {
             return res.status(403).send('Acesso negado. Permissão insuficiente.');
        }

        next();
    } catch (ex) {
        res.status(400).send('Token inválido.');
    }
};

// ... Inicie o servidor no final do arquivo ...
// app.listen(port, () => console.log(`Backend rodando na porta ${port}`));
