import { pool } from '../config/database.js';

export const getProducts = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProduct = async (req, res) => {
  const { name, description, price, category, image_url, sizes, colors, stock } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, category, image_url, sizes, colors, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, category, image_url, sizes, colors, stock || 0]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, image_url, sizes, colors, stock } = req.body;
  
  try {
    await pool.query(
      'UPDATE products SET name=?, description=?, price=?, category=?, image_url=?, sizes=?, colors=?, stock=? WHERE id=?',
      [name, description, price, category, image_url, sizes, colors, stock, id]
    );
    res.json({ message: 'Produto atualizado com sucesso', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
