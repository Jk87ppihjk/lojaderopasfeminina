const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Importação dos Módulos Locais (Todos na raiz)
const { verifyToken, verifyAdmin } = require('./middleware_auth');
const upload = require('./config_upload');
const controllers = require('./controllers');
require('./db'); // Inicia conexão DB

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- ROTAS DA API ---

// Autenticação
app.post('/api/register', controllers.register);
app.post('/api/login', controllers.login);

// Produtos (Público para ver, Admin para criar)
app.get('/api/products', controllers.listProducts);
app.post('/api/products', verifyAdmin, upload.single('image'), controllers.createProduct);

// Carrinho e Pagamento
app.post('/api/checkout', verifyToken, controllers.createPreference);

// Fretes (Admin cadastra, Usuário consulta)
app.post('/api/shipping/add', verifyAdmin, controllers.addShippingRate);
app.get('/api/shipping/calc', controllers.calculateShipping);

// Admin Dashboard
app.get('/api/admin/stats', verifyAdmin, controllers.getStats);

// Rota padrão
app.get('/', (req, res) => {
    res.send('API Loja Online Rodando 🚀');
});

// Iniciar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔥 Servidor rodando na porta ${PORT}`);
    console.log(`🔗 Frontend esperado em: ${process.env.FRONTEND_URL}`);
});
