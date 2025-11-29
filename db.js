const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Conexão com o Banco SQL (Hostinger)
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Desativa logs de SQL no terminal para limpeza
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});

// --- MODELS (TABELAS) ---

// Usuários
const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
    cpf: { type: DataTypes.STRING }
});

// Endereços
const Address = sequelize.define('Address', {
    street: DataTypes.STRING,
    number: DataTypes.STRING,
    neighborhood: DataTypes.STRING,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    zipCode: DataTypes.STRING
});

// Frete por Cidade (Configurado pelo Admin)
const ShippingRate = sequelize.define('ShippingRate', {
    city: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// Produtos
const Product = sequelize.define('Product', {
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    imageUrl: { type: DataTypes.STRING }, // URL do Cloudinary
    attributes: { type: DataTypes.JSON } // Ex: { "cor": "azul", "tamanho": "M" }
});

// Pedidos
const Order = sequelize.define('Order', {
    status: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending, approved, shipped
    total: { type: DataTypes.DECIMAL(10, 2) },
    paymentId: { type: DataTypes.STRING }, // ID do Mercado Pago
    shippingCost: { type: DataTypes.DECIMAL(10, 2) }
});

// --- RELACIONAMENTOS ---
User.hasMany(Address);
Address.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

// Sincronizar banco (Cria tabelas se não existirem)
sequelize.sync({ alter: true })
    .then(() => console.log("📦 Banco de Dados Sincronizado"))
    .catch(err => console.error("Erro no DB:", err));

module.exports = { sequelize, User, Address, Product, Order, ShippingRate };
