// backend/routes/grupos.js
import { Router } from 'express';
import * as gruposController from '../controllers/gruposController.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';

const router = Router();

// 1) Consultar todos los grupos (cualquier usuario logueado)
router.get('/', authenticateToken, gruposController.getAllGrupos);

// ─────────────────────────────────────────────────────────────
// 2) RUTA NUEVA: grupos de un profesor (cualquier usuario)
router.get(
  '/profesor/:id',
  authenticateToken,
  gruposController.getGruposByProfesor
);

// 3) Consultar un grupo por ID
router.get('/:id', authenticateToken, gruposController.getGrupoById);

// 4) Crear / editar / borrar — sólo admin
router.post('/', authenticateToken, authorizeAdmin, gruposController.createGrupo);
router.put('/:id', authenticateToken, authorizeAdmin, gruposController.updateGrupo);
router.delete('/:id', authenticateToken, authorizeAdmin, gruposController.deleteGrupo);

// 5) Rutas opcionales de asignaciones
router.patch('/:id/alumnos', authenticateToken, authorizeAdmin, gruposController.setAlumnosToGrupo);
router.patch('/:id/profesores', authenticateToken, authorizeAdmin, gruposController.setProfesToGrupo);

// 6) Obtener alumnos de un grupo
router.get('/:id/alumnos', authenticateToken, gruposController.getAlumnosByGrupo);

// RUTA PÚBLICA para usuarios autenticados:
router.get('/profesor/:id',authenticateToken, gruposController.getGruposPorProfesor
);

export default router;
