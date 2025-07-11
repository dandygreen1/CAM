// backend/controllers/gruposController.js
import { pool } from '../db.js';

// Obtener todos los grupos
export const getAllGrupos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        g.id_grupo,
        g.nombre_grupo AS grupo,
        gr.descripcion    AS grado,
        g.ciclo_escolar,
        CONCAT(p.nombre_completo) AS profesor
      FROM grupos g
      LEFT JOIN catalogo_grado gr ON g.id_grado = gr.id_grado
      LEFT JOIN personal p         ON g.id_maestro = p.id_personal
      ORDER BY gr.descripcion, g.nombre_grupo
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo grupos' });
  }
};

// Obtener un grupo por ID (ahora con descripción de grado)
export const getGrupoById = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        g.id_grupo,
        g.nombre_grupo,
        g.id_grado,
        g.id_maestro,
        g.ciclo_escolar,
        gr.descripcion      AS grado_descripcion,
        p.nombre_completo   AS profesor
      FROM grupos g
      LEFT JOIN catalogo_grado gr ON g.id_grado   = gr.id_grado
      LEFT JOIN personal       p  ON g.id_maestro = p.id_personal
      WHERE g.id_grupo = ?
    `, [req.params.id]);

    if (rows.length === 0)
      return res.status(404).json({ mensaje: 'Grupo no encontrado' });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo grupo' });
  }
};

// Crear grupo
export const createGrupo = async (req, res) => {
  const { nombre_grupo, id_grado, id_maestro, ciclo_escolar } = req.body;
  try {
    if (!nombre_grupo || !id_grado) {
      return res.status(400).json({ mensaje: 'Grupo y grado son obligatorios' });
    }
    const [result] = await pool.query(
      'INSERT INTO grupos (nombre_grupo, id_grado, id_maestro, ciclo_escolar) VALUES (?, ?, ?, ?)',
      [nombre_grupo, id_grado, id_maestro || null, ciclo_escolar || null]
    );
    res.status(201).json({
      id_grupo: result.insertId,
      nombre_grupo,
      id_grado,
      id_maestro,
      ciclo_escolar
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error creando grupo', error: err.message });
  }
};

// Actualizar grupo
export const updateGrupo = async (req, res) => {
  const { nombre_grupo, id_grado, id_maestro, ciclo_escolar } = req.body;
  try {
    if (!nombre_grupo || !id_grado) {
      return res.status(400).json({ mensaje: 'Grupo y grado son obligatorios' });
    }
    await pool.query(
      'UPDATE grupos SET nombre_grupo = ?, id_grado = ?, id_maestro = ?, ciclo_escolar = ? WHERE id_grupo = ?',
      [nombre_grupo, id_grado, id_maestro || null, ciclo_escolar || null, req.params.id]
    );
    res.json({ mensaje: 'Grupo actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error actualizando grupo', error: err.message });
  }
};

// Eliminar grupo
export const deleteGrupo = async (req, res) => {
  try {
    await pool.query('DELETE FROM grupos WHERE id_grupo = ?', [req.params.id]);
    return res.json({ mensaje: 'Grupo eliminado correctamente' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        mensaje: 'No se puede eliminar este grupo porque hay alumnos asignados. Primero reasigna o elimina esos alumnos.'
      });
    }
    return res.status(500).json({ mensaje: 'Error eliminando grupo', error: err.message });
  }
};

// Devuelve los alumnos asignados a un grupo
export const getAlumnosByGrupo = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT 
         id_alumno,
         nombre_completo,
         curp,
         edad_calculada,
         padre_tutor,
         contacto_emergencia,
         domicilio,
         diagnostico_medico,
         medicamentos,
         alergias,
         observaciones
       FROM alumnos
       WHERE id_grupo = ?`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo alumnos del grupo' });
  }
};


// Placeholder para futuras asignaciones masivas
export const setAlumnosToGrupo = (req, res) => {
  res.status(501).json({ mensaje: 'setAlumnosToGrupo no implementado' });
};
export const setProfesToGrupo = (req, res) => {
  res.status(501).json({ mensaje: 'setProfesToGrupo no implementado' });
};

// Devuelve los grupos asignados a un profesor
export const getGruposByProfesor = async (req, res) => {
  const { id } = req.params; // id del profesor
  try {
    const [rows] = await pool.query(
      `SELECT
         g.id_grupo,
         g.nombre_grupo AS grupo,
         gr.descripcion AS grado,
         g.ciclo_escolar
       FROM grupos g
       LEFT JOIN catalogo_grado gr ON g.id_grado = gr.id_grado
       WHERE g.id_maestro = ?
       ORDER BY FIELD(gr.descripcion, 'Preescolar','Primaria','Secundaria','Media Superior'), g.nombre_grupo
      `,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo grupos del profesor' });
  }
};

export const getGruposPorProfesor = async (req, res) => {
  const idProf = req.params.id;
  try {
    const [rows] = await pool.query(`
      SELECT
        g.id_grupo,
        g.nombre_grupo AS grupo,
        gr.descripcion   AS grado,
        g.ciclo_escolar
      FROM grupos g
      LEFT JOIN catalogo_grado gr ON g.id_grado = gr.id_grado
      WHERE g.id_maestro = ?
      ORDER BY gr.descripcion, g.nombre_grupo
    `, [idProf]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo grupos del profesor' });
  }
};