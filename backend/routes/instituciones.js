import { Router } from 'express';
import {
  getAllInstituciones,
  getInstitucionesLabel,
  getInstitucionById,
  createInstitucion,
  updateInstitucion,
  deleteInstitucion
} from '../controllers/institucionesController.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, authorizeAdmin, getAllInstituciones);               // Lista completa para CRUD
router.get('/label',authenticateToken, authorizeAdmin, getInstitucionesLabel);        // Solo id/nombre para selects
router.get('/:id' ,authenticateToken, authorizeAdmin, getInstitucionById);             // Una institución por id
router.post('/' ,authenticateToken, authorizeAdmin, createInstitucion);                // Crear
router.put('/:id' ,authenticateToken, authorizeAdmin, updateInstitucion);              // Editar
router.delete('/:id' ,authenticateToken, authorizeAdmin, deleteInstitucion);           // Eliminar

export default router;
