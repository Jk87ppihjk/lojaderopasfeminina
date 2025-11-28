import express from 'express';
import * as ProductController from './controllers/productController.js';
import * as OrderController from './controllers/orderController.js';
import { config } from './config/env.js';

const router = express.Router();

// Middleware for internal API key protection
const checkApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (config.internalApiKey && apiKey !== config.internalApiKey) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

// Public Routes
router.get('/products', ProductController.getProducts);
router.get('/products/:id', ProductController.getProductById);
router.post('/checkout', OrderController.createOrder);

// Protected Routes (Example for Admin)
router.post('/products', checkApiKey, ProductController.createProduct);

router.get('/health', (req, res) => res.send('OK'));

export default router;