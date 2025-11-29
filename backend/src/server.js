import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { pool, checkConnection } from './config/database.js';
import routes from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors()); // Allow all origins since we serve static files from same origin now
app.use(express.json());

// API Routes
app.use('/api', routes);

// Serve Static Files (React Build)
// Go up two levels from backend/src to find dist
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// Database Initialization & Admin Seed
const initDb = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('🔄 Checking database initialization...');
    
    // 1. Create Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create Products Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        image_url VARCHAR(2048),
        sizes VARCHAR(255),
        colors VARCHAR(255),
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create Orders Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_address TEXT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_provider VARCHAR(50),
        payment_link VARCHAR(2048),
        external_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create Order Items Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        price_at_time DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // 5. Seed Admin User
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@rosymodas.com']);
    if (users.length === 0) {
      console.log('👤 Admin user not found. Creating default admin...');
      const hashedPassword = await bcrypt.hash('123456', 10);
      await connection.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
        ['Admin Rosy', 'admin@rosymodas.com', hashedPassword]);
      console.log('✅ Admin user created: admin@rosymodas.com / 123456');
    } else {
      console.log('✅ Admin user already exists.');
    }

    // 6. Seed Initial Products (Optional: Only if empty)
    const [products] = await connection.query('SELECT count(*) as count FROM products');
    if (products[0].count === 0) {
      console.log('👗 Seeding initial products...');
      const sampleProducts = [
        ['Vestido Scarlet Night', 'Vestido longo vermelho com fenda lateral.', 299.90, 'Vestidos', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=2583&auto=format&fit=crop', 'P, M, G', 'Vermelho', 10],
        ['Blazer Power Black', 'Blazer preto estruturado com botões.', 189.90, 'Casacos', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=2536&auto=format&fit=crop', 'M, G, GG', 'Preto', 15],
        ['Saia Midi Couro', 'Saia midi em couro sintético premium.', 149.90, 'Saias', 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=2564&auto=format&fit=crop', 'P, M', 'Preto', 8]
      ];
      for (const p of sampleProducts) {
        await connection.query('INSERT INTO products (name, description, price, category, image_url, sizes, colors, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', p);
      }
      console.log('✅ Initial products created.');
    }

  } catch (err) {
    console.error('❌ Init DB Error:', err.message);
  } finally {
    connection.release();
  }
};

// Catch-all route to serve React App for non-API requests
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start
app.listen(config.port, async () => {
  console.log(`🚀 Server running on port ${config.port}`);
  await checkConnection();
  await initDb();
});