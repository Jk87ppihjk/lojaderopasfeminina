const { User, Product, Order, ShippingRate, Address, DeliveryCity, ProductImage, Variation, Category, Tag } = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const MercadoPago = require('mercadopago');
const { sequelize } = require('./db'); // Importa sequelize para transações

// Config Mercado Pago
const client = new MercadoPago.MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const controllers = {
    // ... (register, login, listProducts, getProductById, getAvailableCities, etc. permanecem os mesmos) ...

    // --- NOVO: CREATE PRODUCT COMPLETO ---
    createProduct: async (req, res) => {
        const t = await sequelize.transaction(); // Inicia transação
        try {
            const uploadedFiles = req.files; // Array de imagens
            const { title, basePrice, description, categories, tags, variations } = req.body;

            if (!uploadedFiles || uploadedFiles.length === 0) {
                await t.rollback();
                return res.status(400).json({ message: "É necessário enviar pelo menos uma imagem." });
            }

            // 1. CRIA O PRODUTO BASE
            const product = await Product.create({
                title,
                basePrice,
                description,
            }, { transaction: t });

            // 2. CRIA E ASSOCIA IMAGENS
            const imageRecords = uploadedFiles.map((file, index) => ({
                url: file.path,
                isPrimary: index === 0,
                ProductId: product.id,
            }));
            await ProductImage.bulkCreate(imageRecords, { transaction: t });

            // 3. CRIA E ASSOCIA VARIAÇÕES (SKUs)
            const variationData = JSON.parse(variations || '[]');
            const variationRecords = variationData.map(v => ({
                ProductId: product.id,
                sku: v.sku,
                stock: parseInt(v.stock) || 0,
                price: parseFloat(v.price) || 0,
                attributes: v.attributes, // JSON da combinação
            }));
            await Variation.bulkCreate(variationRecords, { transaction: t });

            // 4. CRIA E ASSOCIA CATEGORIAS
            if (categories) {
                const categoryNames = categories.split(',').map(c => c.trim()).filter(c => c);
                const categoryPromises = categoryNames.map(name => 
                    Category.findOrCreate({ where: { name: name }, defaults: { slug: name.toLowerCase().replace(/\s+/g, '-') }, transaction: t })
                );
                const categoryResults = await Promise.all(categoryPromises);
                const categoryInstances = categoryResults.map(r => r[0]);
                await product.setCategories(categoryInstances, { transaction: t });
            }

            // 5. CRIA E ASSOCIA TAGS
            if (tags) {
                const tagNames = tags.split(',').map(tg => tg.trim()).filter(tg => tg);
                const tagPromises = tagNames.map(name => 
                    Tag.findOrCreate({ where: { name: name }, transaction: t })
                );
                const tagResults = await Promise.all(tagPromises);
                const tagInstances = tagResults.map(r => r[0]);
                await product.setTags(tagInstances, { transaction: t });
            }

            await t.commit(); // Confirma transação
            res.status(201).json({ message: "Produto completo criado com sucesso!", productId: product.id });

        } catch (error) {
            await t.rollback(); // Desfaz tudo em caso de erro
            console.error("Erro ao criar produto completo:", error);
            res.status(500).json({ error: "Falha ao criar produto. Detalhes: " + error.message });
        }
    },
    
    // ... (restante dos controllers: createPreference, getStats, etc. permanecem os mesmos) ...

    // --- REVISÃO DE ROTAS DE PRODUTO (PARA O SERVER.JS) ---
    // listProducts e getProductById devem ser revisados para incluir Imagens e Variações
    listProducts: async (req, res) => {
        const products = await Product.findAll({ 
            include: [ProductImage, Variation, Category, Tag],
            order: [['id', 'DESC']] 
        });
        res.json(products);
    },
    
    getProductById: async (req, res) => {
        try {
            const product = await Product.findByPk(req.params.id, {
                 include: [ProductImage, Variation, Category, Tag]
            });
            if (!product) {
                return res.status(404).json({ message: "Produto não encontrado." });
            }
            res.json(product);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = controllers;
