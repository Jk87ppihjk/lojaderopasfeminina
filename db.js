const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Conexão com o Banco SQL
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});

// --- MODELS CORE ---

// 1. Produtos (Modelo Principal - Contém apenas metadados)
const Product = sequelize.define('Product', {
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    basePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    isPublished: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// 2. Imagens do Produto (1:N com Produto)
const ProductImage = sequelize.define('ProductImage', {
    url: { type: DataTypes.STRING, allowNull: false },
    isPrimary: { type: DataTypes.BOOLEAN, defaultValue: false },
    productId: { type: DataTypes.INTEGER, allowNull: false }
});

// 3. Categorias
const Category = sequelize.define('Category', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    slug: { type: DataTypes.STRING, unique: true }, // URL amigável
    parentId: { type: DataTypes.INTEGER, allowNull: true } // Para categorias aninhadas
});

// 4. Tags
const Tag = sequelize.define('Tag', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true }
});


// --- MODELS DE VARIAÇÃO (COMPLEXIDADE) ---

// 5. Atributo (Ex: Cor, Tamanho, Material)
const Attribute = sequelize.define('Attribute', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true }
});

// 6. Valor do Atributo (Ex: Vermelho, Azul, Pequeno, Grande)
const AttributeValue = sequelize.define('AttributeValue', {
    value: { type: DataTypes.STRING, allowNull: false },
    attributeId: { type: DataTypes.INTEGER, allowNull: false }
});

// 7. Variação (O SKU, que é um produto específico)
const Variant = sequelize.define('Variant', {
    sku: { type: DataTypes.STRING, unique: true, allowNull: true },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    priceAdjustment: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 }, // Preço extra/desconto
    productId: { type: DataTypes.INTEGER, allowNull: false }
});


// --- MODELS DE RELAÇÃO (N:M) ---

// 8. Produto tem Múltiplas Categorias
const ProductCategory = sequelize.define('ProductCategory', {});

// 9. Produto tem Múltiplas Tags
const ProductTag = sequelize.define('ProductTag', {});

// 10. Variação tem Múltiplos Valores de Atributo (Ex: SKU X = (Cor: Vermelho) + (Tamanho: P))
const VariantAttributeValue = sequelize.define('VariantAttributeValue', {
    variantId: { type: DataTypes.INTEGER, allowNull: false },
    attributeValueId: { type: DataTypes.INTEGER, allowNull: false }
});

// --- MODELS DIVERSOS (Existentes) ---
const User = sequelize.define('User', {/* ... */});
const Address = sequelize.define('Address', {/* ... */});
const ShippingRate = sequelize.define('ShippingRate', {/* ... */});
const DeliveryCity = sequelize.define('DeliveryCity', {/* ... */});
const Order = sequelize.define('Order', {/* ... */});


// --- DEFINIÇÃO DOS RELACIONAMENTOS (ASSociações) ---

// 1. Produtos
Product.hasMany(ProductImage, { foreignKey: 'productId', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'productId' });

Product.belongsToMany(Category, { through: ProductCategory, foreignKey: 'productId' });
Category.belongsToMany(Product, { through: ProductCategory, foreignKey: 'categoryId' });

Product.belongsToMany(Tag, { through: ProductTag, foreignKey: 'productId' });
Tag.belongsToMany(Product, { through: ProductTag, foreignKey: 'tagId' });

Product.hasMany(Variant, { foreignKey: 'productId', onDelete: 'CASCADE' });
Variant.belongsTo(Product, { foreignKey: 'productId' });

// 2. Atributos e Variações
Attribute.hasMany(AttributeValue, { foreignKey: 'attributeId', onDelete: 'CASCADE' });
AttributeValue.belongsTo(Attribute, { foreignKey: 'attributeId' });

Variant.belongsToMany(AttributeValue, { through: VariantAttributeValue, foreignKey: 'variantId' });
AttributeValue.belongsToMany(Variant, { through: VariantAttributeValue, foreignKey: 'attributeValueId' });


// --- OUTRAS ASSOCIAÇÕES (Existentes) ---
User.hasMany(Address);
Address.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);


// Sincronizar banco (Irá criar todas as novas tabelas)
sequelize.sync({ alter: true })
    .then(() => console.log("📦 Banco de Dados Sincronizado. Novas tabelas criadas!"))
    .catch(err => console.error("Erro no DB:", err));

module.exports = { 
    sequelize, User, Address, ShippingRate, DeliveryCity, Order,
    Product, ProductImage, Category, Tag, Variant, Attribute, AttributeValue,
    ProductCategory, ProductTag, VariantAttributeValue // Exporta todos os modelos
};
