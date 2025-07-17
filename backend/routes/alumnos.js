import { Router } from 'express';
import {
  getAllAlumnos, getAlumnoById,
  createAlumno, updateAlumno, deleteAlumno
} from '../controllers/alumnosController.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import { asignarGrupoAlumno } from '../controllers/alumnosController.js';

const router = Router();

// (no necesitan token para consultarlas)
router.get('/', authenticateToken, getAllAlumnos);
router.get('/:id', authenticateToken, getAlumnoById);

// protegidas (requieren token y rol admin)
router.post('/',   authenticateToken, authorizeAdmin, createAlumno);
router.put('/:id', authenticateToken, authorizeAdmin, updateAlumno);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteAlumno);
router.patch('/:id/grupo', authenticateToken, authorizeAdmin, asignarGrupoAlumno);

export default router;
