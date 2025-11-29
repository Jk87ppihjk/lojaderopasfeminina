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