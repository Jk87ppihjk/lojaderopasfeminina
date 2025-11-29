const { User, Product, Order, ShippingRate, Address, DeliveryCity } = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const MercadoPago = require('mercadopago');

// Config Mercado Pago
const client = new MercadoPago.MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const controllers = {
    // --- AUTENTICAÇÃO ---
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

    // --- PRODUTOS & ESTOQUE ---
    createProduct: async (req, res) => {
        try {
            const imageUrl = req.file ? req.file.path : null;
            const { title, price, stock, description, attributes } = req.body;
            
            const product = await Product.create({
                title, 
                price, 
                stock, 
                description, 
                imageUrl, 
                attributes: JSON.parse(attributes || '{}')
            });
            res.status(201).json(product);
        } catch (error) { res.status(500).json({ error: error.message }); }
    },

    listProducts: async (req, res) => {
        const products = await Product.findAll({ order: [['id', 'DESC']] });
        res.json(products);
    },
    
    getProductById: async (req, res) => {
        try {
            const product = await Product.findByPk(req.params.id);
            if (!product) {
                return res.status(404).json({ message: "Produto não encontrado." });
            }
            res.json(product);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // --- CIDADES DE ENTREGA (ADMIN) ---
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

    // --- CIDADES DE ENTREGA (PÚBLICO) ---
    getAvailableCities: async (req, res) => {
        try {
            const cities = await DeliveryCity.findAll({
                where: { available: true },
                attributes: ['city', 'state', 'neighborhood'],
                order: [['state', 'ASC'], ['city', 'ASC']]
            });
            res.json(cities);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // --- FRETE E ENDEREÇO (ADMIN) ---
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

    // --- CHECKOUT (MERCADO PAGO) ---
    createPreference: async (req, res) => {
        try {
            const userId = req.user.id; 
            const { items, city } = req.body; 
            
            // 1. CALCULAR FRETE
            const shipping = await ShippingRate.findOne({ where: { city: city.toUpperCase() } });
            const shippingCost = shipping ? parseFloat(shipping.price) : 0;

            // 2. PREPARAR ITENS PARA MP
            const mpItems = items.map(item => ({
                title: item.title,
                quantity: parseInt(item.quantity),
                unit_price: parseFloat(item.price),
                currency_id: 'BRL'
            }));
            
            // 3. CRIAR PREFERÊNCIA DE PAGAMENTO
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

    // --- ESTATÍSTICAS (ADMIN) ---
    getStats: async (req, res) => {
        const userCount = await User.count();
        const orderCount = await Order.count();
        res.json({ users: userCount, orders: orderCount, totalProducts: await Product.count() });
    }
};

module.exports = controllers;
