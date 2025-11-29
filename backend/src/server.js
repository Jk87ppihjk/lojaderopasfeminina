import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { config } from './config/env.js';
import { pool, checkConnection } from './config/database.js';
import routes from './routes.js';

const app = express();

// Middleware
// Use config.frontendUrl or allow all ('*') to prevent CORS errors during dev/deploy mismatches
app.use(cors({ origin: config.frontendUrl || '*' }));
app.use(express.json());

// Routes
app.use('/api', routes);

// Database Initialization & Admin Seed
const initDb = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('🔄 Checking database initialization...');
    
    // 1. Create Users Table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Check and Create Admin User
    const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@rosymodas.com']);
    
    if (rows.length === 0) {
      console.log('👤 Admin user not found. Creating default admin...');
      const hashedPassword = await bcrypt.hash('123456', 10);
      await connection.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
        ['Admin Rosy', 'admin@rosymodas.com', hashedPassword]);
      console.log('✅ Admin user created: admin@rosymodas.com / 123456');
    } else {
      console.log('✅ Admin user already exists.');
    }

  } catch (err) {
    console.error('❌ Init DB Error:', err.message);
  } finally {
    connection.release();
  }
};

// Start
app.listen(config.port, async () => {
  console.log(`🚀 Server running on port ${config.port}`);
  await checkConnection();
  await initDb();
});