// backend/controllers/generosController.js
import { pool } from '../db.js';
export const getAllGeneros = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_genero AS value, genero AS label FROM catalogo_genero'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo géneros' });
  }
};