import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // 1) Buscar usuario
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE username = ?',
      [username]
    );
    if (rows.length === 0)
      return res.status(401).json({ mensaje: 'Usuario no encontrado' });
      
    const user = rows[0];
    // 2) Verificar contraseña (esperamos que esté hasheada con bcrypt)
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

    // 3) Firmar JWT
    const payload = {
      id_usuario:   user.id_usuario,
      tipo_usuario: user.tipo_usuario
    };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

res.json({
  token,
  tipo_usuario: user.tipo_usuario,
  id_usuario:   user.id_usuario
});
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al autenticar' });
  }
};
