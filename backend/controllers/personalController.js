// backend/controllers/personalController.js
import { pool } from '../db.js';

// Obtener todo el personal (con nombre de institución)
export const getAllPersonal = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id_personal,
        IFNULL(i.nombre, p.id_institucion) AS institucion,
        p.nombre_completo,
        p.rfc,
        p.curp,
        p.puesto,
        p.especialidad,
        p.telefono,
        p.email,
        p.fecha_ingreso,
        p.activo
      FROM personal p
      LEFT JOIN instituciones i ON p.id_institucion = i.id_institucion
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo personal' });
  }
};

// Obtener personal por ID
export const getPersonalById = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id_personal,
        p.id_institucion,
        IFNULL(i.nombre, p.id_institucion) AS institucion_label,
        p.nombre_completo,
        p.rfc,
        p.curp,
        p.puesto,
        p.especialidad,
        p.telefono,
        p.email,
        p.fecha_ingreso,
        p.activo
      FROM personal p
      LEFT JOIN instituciones i
        ON p.id_institucion = i.id_institucion
      WHERE p.id_personal = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Registro no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo registro' });
  }
};

// Crear personal
export const createPersonal = async (req, res) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO personal SET ?',
      [req.body]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(400).json({ mensaje: 'Error creando registro', error: err.message });
  }
};

// Actualizar personal
export const updatePersonal = async (req, res) => {
  try {
    await pool.query(
      'UPDATE personal SET ? WHERE id_personal = ?',
      [req.body, req.params.id]
    );
    res.json({ mensaje: 'Registro actualizado' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ mensaje: 'Error actualizando registro', error: err.message });
  }
};

// Eliminar personal
export const deletePersonal = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Si tienes atenciones relacionadas, podrías borrarlas aquí, si no omite esto
    // await conn.query('DELETE FROM atencion_especialista WHERE id_especialista = ?', [id]);

    // Si usas esta persona como maestro en alumnos, limpia también ahí:
    await conn.query('UPDATE alumnos SET id_maestro = NULL WHERE id_maestro = ?', [id]);

    // Finalmente borra del personal
    await conn.query(
      'DELETE FROM personal WHERE id_personal = ?',
      [id]
    );

    await conn.commit();
    res.json({ mensaje: 'Personal eliminado correctamente.' });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar personal', error: error.message });
  } finally {
    conn.release();
  }
};

// Devuelve todo el personal activo (todos los tratamos como 'profesores')
export const getAllProfesores = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id_personal, nombre_completo
      FROM personal
      WHERE activo = 1
      ORDER BY nombre_completo
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo profesores' });
  }
};

