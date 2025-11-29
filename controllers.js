const { User, Product, Order, ShippingRate, Address, DeliveryCity, ProductImage, Variation, Category, Tag } = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const MercadoPago = require('mercadopago');
const { sequelize } = require('./db'); // Importa sequelize para transações

// Config Mercado Pago
const client = new MercadoPago.MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const controllers = {
    // --- 1. AUTENTICAÇÃO ---
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({ name, email, password: hashedPassword });
            res.status(201).json({ id: user.id, email: user.email, name: user.name });
        } catch (error) { 
            if (error.original && error.original.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "Este e-mail já está cadastrado." });
            }
            res.status(500).json({ error: error.message }); 
        }
    },

    login: async (req, res) => {
        try {
            const user = await User.findOne({ where: { email: req.body.email } });
            if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
            
            const valid = await bcrypt.compare(req.body.password, user.password);
            if (!valid) return res.status(400).json({ message: "Senha incorreta" });

            const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({ token, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
        } catch (error) { res.status(500).json({ error: error.message }); }
    },

    // --- 2. PRODUTOS COMPLETOS (COM VARIAÇÕES E IMAGENS) ---
    createProduct: async (req, res) => {
        const t = await sequelize.transaction(); // Inicia transação
        try {
            const uploadedFiles = req.files; // Array de imagens vindo do Multer
            const { title, basePrice, description, categories, tags, variations } = req.body;

            if (!uploadedFiles || uploadedFiles.length === 0) {
                await t.rollback();
                return res.status(400).json({ message: "É necessário enviar pelo menos uma imagem." });
            }

            // A. Cria o Produto Base
            const product = await Product.create({
                title,
                basePrice,
                description,
            }, { transaction: t });

            // B. Cria e Associa Imagens
            const imageRecords = uploadedFiles.map((file, index) => ({
                url: file.path,
                isPrimary: index === 0,
                ProductId: product.id,
            }));
            await ProductImage.bulkCreate(imageRecords, { transaction: t });

            // C. Cria e Associa Variações (SKUs)
            const variationData = JSON.parse(variations || '[]');
            const variationRecords = variationData.map(v => ({
                ProductId: product.id,
                sku: v.sku,
                stock: parseInt(v.stock) || 0,
                price: parseFloat(v.price) || 0,
                attributes: v.attributes, // JSON
            }));
            await Variation.bulkCreate(variationRecords, { transaction: t });

            // D. Cria e Associa Categorias
            if (categories) {
                const categoryNames = categories.split(',').map(c => c.trim()).filter(c => c);
                const categoryPromises = categoryNames.map(name => 
                    Category.findOrCreate({ where: { name: name }, defaults: { slug: name.toLowerCase().replace(/\s+/g, '-') }, transaction: t })
                );
                const categoryResults = await Promise.all(categoryPromises);
                const categoryInstances = categoryResults.map(r => r[0]);
                await product.setCategories(categoryInstances, { transaction: t });
            }

            // E. Cria e Associa Tags
            if (tags) {
                const tagNames = tags.split(',').map(tg => tg.trim()).filter(tg => tg);
                const tagPromises = tagNames.map(name => 
                    Tag.findOrCreate({ where: { name: name }, transaction: t })
                );
                const tagResults = await Promise.all(tagPromises);
                const tagInstances = tagResults.map(r => r[0]);
                await product.setTags(tagInstances, { transaction: t });
            }

            await t.commit(); // Confirma
            res.status(201).json({ message: "Produto completo criado com sucesso!", productId: product.id });

        } catch (error) {
            await t.rollback(); // Desfaz erro
            console.error("Erro ao criar produto:", error);
            res.status(500).json({ error: "Falha ao criar produto. Detalhes: " + error.message });
        }
    },

    listProducts: async (req, res) => {
        try {
            const products = await Product.findAll({ 
                include: [ProductImage, Variation, Category, Tag],
                order: [['id', 'DESC']] 
            });
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
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

    // --- 3. CIDADES DE ENTREGA ---
    addDeliveryCity: async (req, res) => {
        try {
            const { city, state, neighborhood } = req.body;
            const newCity = await DeliveryCity.create({ 
                city: city.toUpperCase(), 
                state: state.toUpperCase(),
                neighborhood: neighborhood ? neighborhood.toUpperCase() : null
            });
            res.status(201).json(newCity);
        } catch (error) {
            if (error.original && error.original.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "Esta Cidade/Bairro já foi cadastrada." });
            }
            res.status(500).json({ error: error.message });
        }
    },

    getAvailableCities: async (req, res) => {
        try {
            const cities = await DeliveryCity.findAll({
                where: { available: true },
                attributes: ['id', 'city', 'state', 'neighborhood'],
                order: [['state', 'ASC'], ['city', 'ASC']]
            });
            res.json(cities);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // --- 4. FRETE ---
    addShippingRate: async (req, res) => {
        try {
            const { city, price } = req.body;
            const rate = await ShippingRate.create({ city: city.toUpperCase(), price }); 
            res.status(201).json(rate);
        } catch (error) { res.status(500).json({ error: error.message }); }
    },

    calculateShipping: async (req, res) => {
        const city = req.query.city ? req.query.city.toUpperCase() : null;
        if (!city) return res.status(400).json({ message: "Cidade é obrigatória para calcular o frete." });
        
        const rate = await ShippingRate.findOne({ 
            where: { city: city, active: true } 
        });
        
        const price = rate ? parseFloat(rate.price) : 'Consulte';
        res.json({ city: req.query.city, price: price });
    },

    // --- 5. CHECKOUT (MERCADO PAGO) ---
    createPreference: async (req, res) => {
        try {
            const userId = req.user.id; 
            const { items, city, delivery_address, contact } = req.body; 
            
            // Calcular Frete
            const shipping = await ShippingRate.findOne({ where: { city: city.toUpperCase() } });
            const shippingCost = shipping ? parseFloat(shipping.price) : 0;

            // Preparar Itens
            const mpItems = items.map(item => ({
                title: item.title,
                quantity: parseInt(item.quantity),
                unit_price: parseFloat(item.price),
                currency_id: 'BRL'
            }));
            
            // Criar Preferência MP
            const preferenceInstance = new MercadoPago.Preference(client);
            
            const result = await preferenceInstance.create({
                body: {
                    items: mpItems,
                    shipments: {
                        cost: shippingCost,
                        mode: 'not_specified'
                    },
                    back_urls: {
                        success: `${process.env.FRONTEND_URL}/success.php`,
                        failure: `${process.env.FRONTEND_URL}/failure.php`,
                        pending: `${process.env.FRONTEND_URL}/pending.php`
                    },
                    auto_return: "approved",
                    external_reference: `ORDER-${Date.now()}`
                }
            });

            res.json({ 
                id: result.id, 
                init_point: result.init_point,
                shippingCost: shippingCost
            });
        } catch (error) {
            console.error("Erro ao criar pagamento MP:", error);
            res.status(500).json({ error: "Falha ao iniciar o checkout." });
        }
    },

    // --- 6. ESTATÍSTICAS ---
    getStats: async (req, res) => {
        const userCount = await User.count();
        const orderCount = await Order.count();
        const productCount = await Product.count();
        res.json({ users: userCount, orders: orderCount, totalProducts: productCount });
    }
};

module.exports = controllers;
