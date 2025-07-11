// backend/controllers/alumnosController.js
import { pool } from '../db.js';

// Obtener todos los alumnos, incluyendo profesor de su grupo
export const getAllAlumnos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        a.id_alumno,
        i.nombre            AS institucion,
        cg.genero           AS genero,
        -- nombre del profesor individual (si quieres seguir teniéndolo)
        pal.nombre_completo AS maestro,
        -- datos del grupo
        grp.id_grupo,
        grp.nombre_grupo    AS grupo,
        gr.descripcion      AS grado_grupo,
        pgrp.nombre_completo AS profesor_grupo,
        -- resto de campos del alumno
        a.nombre_completo,
        a.curp,
        a.fecha_nacimiento,
        a.edad_calculada,
        a.padre_tutor,
        a.contacto_emergencia,
        a.domicilio,
        a.diagnostico_medico,
        a.medicamentos,
        a.alergias,
        a.promovido,
        a.no_promovido,
        a.observaciones,
        a.fecha_inscripcion,
        a.activo
      FROM alumnos a
      LEFT JOIN instituciones    i    ON a.id_institucion = i.id_institucion
      LEFT JOIN catalogo_genero  cg   ON a.id_genero      = cg.id_genero
      LEFT JOIN grupos           grp  ON a.id_grupo       = grp.id_grupo
      LEFT JOIN catalogo_grado   gr   ON grp.id_grado     = gr.id_grado
      LEFT JOIN personal         pal  ON a.id_maestro     = pal.id_personal
      LEFT JOIN personal         pgrp ON grp.id_maestro   = pgrp.id_personal
      ORDER BY a.nombre_completo
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo alumnos' });
  }
};

// Obtener un alumno por id
export const getAlumnoById = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        a.id_alumno,
        a.id_institucion,
        a.id_genero,
        a.id_grado,
        a.id_grupo,
        a.id_maestro,

        i.nombre              AS institucion_label,
        cg.genero             AS genero_label,
        cg2.descripcion       AS grado_descripcion,
        grp.nombre_grupo      AS grupo_label,
        pgrp.nombre_completo  AS profesor_grupo_label,
        pal.nombre_completo   AS maestro_label,

        a.nombre_completo,
        a.curp,
        a.fecha_nacimiento,
        a.edad_calculada,
        a.padre_tutor,
        a.contacto_emergencia,
        a.domicilio,
        a.diagnostico_medico,
        a.medicamentos,
        a.alergias,
        a.promovido,
        a.no_promovido,
        a.observaciones,
        a.fecha_inscripcion,
        a.activo
      FROM alumnos a
      LEFT JOIN instituciones    i    ON a.id_institucion = i.id_institucion
      LEFT JOIN catalogo_genero  cg   ON a.id_genero      = cg.id_genero
      LEFT JOIN catalogo_grado   cg2  ON a.id_grado       = cg2.id_grado
      LEFT JOIN grupos           grp  ON a.id_grupo       = grp.id_grupo
      LEFT JOIN personal         pgrp ON grp.id_maestro   = pgrp.id_personal
      LEFT JOIN personal         pal  ON a.id_maestro     = pal.id_personal
      WHERE a.id_alumno = ?
    `, [req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ mensaje: 'Alumno no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error obteniendo alumno' });
  }
};

// Crear alumno
export const createAlumno = async (req, res) => {
  try {
    const data = { ...req.body };
    ['id_genero', 'id_grado', 'id_maestro', 'id_grupo'].forEach(field => {
      if (data[field] === '') data[field] = null;
    });

    const [result] = await pool.query(
      'INSERT INTO alumnos SET ?',
      [data]
    );
    res.status(201).json({ id: result.insertId, ...data });
  } catch (err) {
    console.error(err);
    res.status(400).json({ mensaje: 'Error creando alumno', error: err.message });
  }
};

// Actualizar alumno
export const updateAlumno = async (req, res) => {
  try {
    const data = { ...req.body };
    ['id_genero', 'id_grado', 'id_maestro', 'id_grupo'].forEach(field => {
      if (data[field] === '') data[field] = null;
    });

    await pool.query(
      'UPDATE alumnos SET ? WHERE id_alumno = ?',
      [data, req.params.id]
    );
    res.json({ mensaje: 'Alumno actualizado' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ mensaje: 'Error actualizando alumno', error: err.message });
  }
};

// Eliminar alumno
export const deleteAlumno = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Borra todas las relaciones hijas
    await conn.query('DELETE FROM alumno_discapacidad          WHERE id_alumno = ?', [id]);
    await conn.query('DELETE FROM alumno_necesidad_educativa   WHERE id_alumno = ?', [id]);
    await conn.query('DELETE FROM atencion_especialista        WHERE id_alumno = ?', [id]);
    // — si tienes más tablas que referencian alumnos, agrégalas aquí —

    // 2) Finalmente, borra el registro en alumnos
    await conn.query('DELETE FROM alumnos WHERE id_alumno = ?', [id]);

    await conn.commit();
    res.json({ mensaje: 'Alumno y todos sus datos relacionados fueron eliminados.' });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar alumno', error: error.message });
  } finally {
    conn.release();
  }
};

// (Si tienes función para asignar grupo manualmente, también actualízala para usar id_grupo)
export const asignarGrupoAlumno = async (req, res) => {
  const { id } = req.params;           // id del alumno
  const { id_grupo } = req.body;       // nuevo grupo

  if (!id_grupo) {
    return res.status(400).json({ mensaje: 'id_grupo es obligatorio' });
  }

  try {
    await pool.query(
      'UPDATE alumnos SET id_grupo = ? WHERE id_alumno = ?',
      [id_grupo, id]
    );
    res.json({ mensaje: 'Grupo asignado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al asignar grupo', error: error.message });
  }
};
