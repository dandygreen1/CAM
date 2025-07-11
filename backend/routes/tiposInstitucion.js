// routes/tiposInstitucion.js
import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT id_tipo, tipo, descripcion FROM catalogo_tipo_institucion');
  res.json(rows);
});

export default router;
