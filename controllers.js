const { User, Product, Order, ShippingRate, Address } = require('./db');
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
            res.json(user);
        } catch (error) { res.status(500).json({ error: error.message }); }
    },

    login: async (req, res) => {
        try {
            const user = await User.findOne({ where: { email: req.body.email } });
            if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
            
            const valid = await bcrypt.compare(req.body.password, user.password);
            if (!valid) return res.status(400).json({ message: "Senha incorreta" });

            const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.json({ token, user });
        } catch (error) { res.status(500).json({ error: error.message }); }
    },

    // --- PRODUTOS & ESTOQUE ---
    createProduct: async (req, res) => {
        try {
            // A imagem vem do middleware Multer/Cloudinary
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
            res.json(product);
        } catch (error) { res.status(500).json({ error: error.message }); }
    },

    listProducts: async (req, res) => {
        const products = await Product.findAll();
        res.json(products);
    },

    // --- FRETE E ENDEREÇO ---
    addShippingRate: async (req, res) => { // Admin define preço por cidade
        try {
            const { city, price } = req.body;
            const rate = await ShippingRate.create({ city, price });
            res.json(rate);
        } catch (error) { res.status(500).json({ error: error.message }); }
    },

    calculateShipping: async (req, res) => {
        // Busca preço baseado na cidade do usuário
        const { city } = req.query; 
        const rate = await ShippingRate.findOne({ where: { city } });
        res.json({ city, price: rate ? rate.price : 'Consulte' });
    },

    // --- CHECKOUT (MERCADO PAGO) ---
    createPreference: async (req, res) => {
        try {
            const { items, city } = req.body; // items = [{id, quantity, unit_price, title}]
            
            // Lógica simples de frete
            const shipping = await ShippingRate.findOne({ where: { city } });
            const shippingCost = shipping ? parseFloat(shipping.price) : 0;

            const preference = new MercadoPago.Preference(client);
            
            const result = await preference.create({
                body: {
                    items: items.map(item => ({
                        title: item.title,
                        quantity: parseInt(item.quantity),
                        unit_price: parseFloat(item.price),
                        currency_id: 'BRL'
                    })),
                    shipments: {
                        cost: shippingCost,
                        mode: 'not_specified'
                    },
                    back_urls: {
                        success: `${process.env.FRONTEND_URL}/success`,
                        failure: `${process.env.FRONTEND_URL}/failure`,
                        pending: `${process.env.FRONTEND_URL}/pending`
                    },
                    auto_return: "approved",
                }
            });

            res.json({ id: result.id, init_point: result.init_point });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Erro ao criar pagamento" });
        }
    },

    // --- ESTATÍSTICAS ---
    getStats: async (req, res) => {
        const userCount = await User.count();
        const orderCount = await Order.count();
        res.json({ users: userCount, orders: orderCount });
    }
};

module.exports = controllers;
