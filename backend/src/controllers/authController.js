import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.log(`⚠️ Login falhou: Usuário não encontrado para email ${email}`);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`⚠️ Login falhou: Senha incorreta para usuário ${email}`);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    console.log(`✅ Login com sucesso para ${email}`);
    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: { name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('❌ Erro no servidor durante login:', error);
    res.status(500).json({ error: 'Erro no servidor durante login' });
  }
};