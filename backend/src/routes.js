import express from 'express';
import * as ProductController from './controllers/productController.js';
import * as OrderController from './controllers/orderController.js';
import * as AuthController from './controllers/authController.js';
import jwt from 'jsonwebtoken';
import { config } from './config/env.js';

const router = express.Router();

// Middleware for JWT Authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ error: 'Acesso negado' });

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Public Routes
router.get('/products', ProductController.getProducts);
router.get('/products/:id', ProductController.getProductById);
router.post('/checkout', OrderController.createOrder);
router.post('/auth/login', AuthController.login);

// Protected Routes (Admin)
router.post('/products', authenticateToken, ProductController.createProduct);
router.put('/products/:id', authenticateToken, ProductController.updateProduct);
router.delete('/products/:id', authenticateToken, ProductController.deleteProduct);

router.get('/health', (req, res) => res.send('OK'));

export default router;
