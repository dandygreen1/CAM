// backend/controllers/gradosController.js
import { pool } from '../db.js';

export const getAllGrados = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id_grado  AS value,
        CONCAT(grado, ' ', descripcion) AS label
      FROM catalogo_grado
      ORDER BY id_nivel, grado
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo grados' });
  }
};
