const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Importação dos Módulos Locais
const { verifyToken, verifyAdmin } = require('./middleware_auth');
const upload = require('./config_upload');
const controllers = require('./controllers');
const { sequelize } = require('./db'); // Importa o sequelize explicitamente
const seedAdmin = require('./seed_admin'); // <--- IMPORTAÇÃO DO SEED

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- ROTAS DA API ---
app.post('/api/register', controllers.register);
app.post('/api/login', controllers.login);
app.get('/api/products', controllers.listProducts);
app.post('/api/products', verifyAdmin, upload.single('image'), controllers.createProduct);
app.post('/api/checkout', verifyToken, controllers.createPreference);
app.post('/api/shipping/add', verifyAdmin, controllers.addShippingRate);
app.get('/api/shipping/calc', controllers.calculateShipping);
app.get('/api/admin/stats', verifyAdmin, controllers.getStats);

app.get('/', (req, res) => {
    res.send('API Loja Online Rodando 🚀');
});

const PORT = process.env.PORT || 3000;

// Inicia o servidor APENAS após o banco estar pronto e o Admin verificado
sequelize.sync().then(async () => {
    console.log("📦 Banco de Dados Conectado!");
    
    // Roda a criação do Admin
    await seedAdmin(); 

    app.listen(PORT, () => {
        console.log(`🔥 Servidor rodando na porta ${PORT}`);
        console.log(`🔗 Frontend esperado em: ${process.env.FRONTEND_URL}`);
    });
});
