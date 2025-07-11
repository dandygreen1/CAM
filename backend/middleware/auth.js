import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// 1) Validar que el token exista y sea válido
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader)
    return res.status(401).json({ mensaje: 'Token faltante' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ mensaje: 'Token inválido' });
    req.user = user;  // { id_usuario, tipo_usuario }
    next();
  });
};

// 2) Solo admin
export const authorizeAdmin = (req, res, next) => {
  if (req.user.tipo_usuario !== 'admin')
    return res.status(403).json({ mensaje: 'Acceso denegado: solo admin' });
  next();
};
