import mysql from 'mysql2/promise';
import { config } from './env.js';

export const pool = mysql.createPool(config.db);

export const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully to ' + config.db.host);
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};