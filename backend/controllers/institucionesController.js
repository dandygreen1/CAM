// backend/controllers/institucionesController.js
import { pool } from '../db.js';

// Obtener todas las instituciones (para lista)
export const getAllInstituciones = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, ct.tipo, ct.descripcion 
         FROM instituciones i
         LEFT JOIN catalogo_tipo_institucion ct ON i.id_tipo = ct.id_tipo`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo instituciones' });
  }
};

// Obtener solo value/label (para selects en formularios, si lo necesitas)
export const getInstitucionesLabel = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_institucion AS value, nombre AS label FROM instituciones'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo instituciones' });
  }
};

// Obtener una sola institución
export const getInstitucionById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM instituciones WHERE id_institucion = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ mensaje: 'No encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo institución' });
  }
};

// Crear nueva institución
export const createInstitucion = async (req, res) => {
  try {
    const institucion = req.body;
    const [result] = await pool.query('INSERT INTO instituciones SET ?', [institucion]);
    res.json({ id: result.insertId, ...institucion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error creando institución' });
  }
};

// Actualizar
export const updateInstitucion = async (req, res) => {
  try {
    await pool.query('UPDATE instituciones SET ? WHERE id_institucion = ?', [req.body, req.params.id]);
    res.json({ mensaje: 'Institución actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error actualizando institución' });
  }
};

// controllers/institucionesController.js
export const deleteInstitucion = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM instituciones WHERE id_institucion = ?', [id]);
    res.json({ mensaje: 'Institución eliminada correctamente' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      // Obtén los alumnos relacionados
      const [alumnos] = await pool.query(
        `SELECT nombre_completo FROM alumnos WHERE id_institucion = ?`,
        [id]
      );
      return res.status(409).json({
        mensaje:
          'No se puede eliminar la institución porque tiene alumnos asignados, reasignalos o eliminalos para poder eliminar la institucion. xd',
        alumnos: alumnos.map(a => a.nombre_completo),
        
      });
    }
    res.status(500).json({ mensaje: 'Error eliminando institución.' });
  }
};




