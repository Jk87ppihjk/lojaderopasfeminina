const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Importação dos Módulos Locais (Todos na raiz)
const { verifyToken, verifyAdmin } = require('./middleware_auth');
// O middleware de upload agora aceita múltiplas imagens no campo 'images'
const upload = require('./config_upload'); 
const controllers = require('./controllers');
const { sequelize } = require('./db'); // Importa o sequelize explicitamente
const seedAdmin = require('./seed_admin'); // Lógica de criação do Admin

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json()); // Habilita o bodyParser para JSON
app.use(morgan('dev')); // Logs de requisição

// --- ROTAS DA API ---

// 1. Autenticação (Público)
app.post('/api/register', controllers.register);
app.post('/api/login', controllers.login);

// 2. Produtos (Listagem é Pública, Criação é Admin)
app.get('/api/products', controllers.listProducts);
app.get('/api/products/:id', controllers.getProductById);
// Rota de criação agora usa upload.array para MULTIPLAS IMAGENS
app.post('/api/products', verifyAdmin, upload.array('images', 10), controllers.createProduct);

// 3. Cidades de Entrega (Rotas Nova)
app.get('/api/public/delivery/cities', controllers.getAvailableCities); // Pública
app.post('/api/admin/delivery/city', verifyAdmin, controllers.addDeliveryCity); // Admin

// 4. Fretes (Admin cadastra, Usuário consulta)
app.post('/api/shipping/add', verifyAdmin, controllers.addShippingRate);
app.get('/api/shipping/calc', controllers.calculateShipping);

// 5. Carrinho e Pagamento (Requer Token do Usuário logado)
app.post('/api/checkout', verifyToken, controllers.createPreference);

// 6. Admin Dashboard (Requer Token de Admin)
app.get('/api/admin/stats', verifyAdmin, controllers.getStats);

// Rota padrão
app.get('/', (req, res) => {
    res.send('API Loja Online Rodando. Status OK.');
});

// --- INICIAR SERVIDOR ---
const PORT = process.env.PORT || 3000;

// Sincroniza o DB, cria o Admin e então inicia o servidor
sequelize.sync().then(async () => {
    console.log("📦 Banco de Dados Conectado e Sincronizado!");
    
    // Roda a verificação/criação do Admin
    await seedAdmin(); 

    app.listen(PORT, () => {
        console.log(`🔥 Servidor rodando na porta ${PORT}`);
        console.log(`🔗 Frontend esperado em: ${process.env.FRONTEND_URL}`);
    });
}).catch(err => {
    console.error("❌ Falha crítica ao conectar ao DB:", err);
    process.exit(1); // Encerra o processo se o DB falhar
});
