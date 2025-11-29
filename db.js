const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Conexão com o Banco SQL
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});

// --- MODELS BASE ---

const User = sequelize.define('User', { /* ... (campos permanecem) ... */ });
const Address = sequelize.define('Address', { /* ... (campos permanecem) ... */ });
const ShippingRate = sequelize.define('ShippingRate', { /* ... (campos permanecem) ... */ });
const DeliveryCity = sequelize.define('DeliveryCity', { /* ... (campos permanecem) ... */ });
const Order = sequelize.define('Order', { /* ... (campos permanecem) ... */ });

// --- MODELS DE PRODUTO REVISADOS ---

// Produto Base
const Product = sequelize.define('Product', {
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    basePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    // basePrice é o preço base antes das variações
});

// Imagens do Produto (Múltiplas)
const ProductImage = sequelize.define('ProductImage', {
    url: { type: DataTypes.STRING, allowNull: false },
    isPrimary: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// Variações (SKUs)
const Variation = sequelize.define('Variation', {
    sku: { type: DataTypes.STRING, allowNull: false, unique: true },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    // Preço que SOBRESCEVE o basePrice (pode ser 0 para usar o basePrice)
    price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    // Combinação dos atributos (ex: {"Cor": "Vermelho", "Tamanho": "P"})
    attributes: { type: DataTypes.JSON, allowNull: false }
});

// Categorias (Taxonomia)
const Category = sequelize.define('Category', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    slug: { type: DataTypes.STRING, unique: true }
});

// Tags (Taxonomia)
const Tag = sequelize.define('Tag', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true }
});

// --- TABELAS DE LIGAÇÃO (Many-to-Many) ---

// Produto <-> Categoria
const ProductCategory = sequelize.define('ProductCategory', {}, { timestamps: false });

// Produto <-> Tag
const ProductTag = sequelize.define('ProductTag', {}, { timestamps: false });


// --- RELACIONAMENTOS ---

// Usuários e Endereços/Pedidos
User.hasMany(Address); Address.belongsTo(User);
User.hasMany(Order); Order.belongsTo(User);

// Produto e Imagens
Product.hasMany(ProductImage, { onDelete: 'CASCADE' });
ProductImage.belongsTo(Product);

// Produto e Variações
Product.hasMany(Variation, { onDelete: 'CASCADE' });
Variation.belongsTo(Product);

// Produto e Categorias (M:N)
Product.belongsToMany(Category, { through: ProductCategory });
Category.belongsToMany(Product, { through: ProductCategory });

// Produto e Tags (M:N)
Product.belongsToMany(Tag, { through: ProductTag });
Tag.belongsToMany(Product, { through: ProductTag });


// Sincronizar banco
sequelize.sync({ alter: true })
    .then(() => console.log("📦 Banco de Dados Sincronizado"))
    .catch(err => console.error("Erro no DB:", err));

module.exports = { 
    sequelize, User, Address, Product, Order, ShippingRate, DeliveryCity,
    ProductImage, Variation, Category, Tag, ProductCategory, ProductTag
};
