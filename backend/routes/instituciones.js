import { Router } from 'express';
import {
  getAllInstituciones,
  getInstitucionesLabel,
  getInstitucionById,
  createInstitucion,
  updateInstitucion,
  deleteInstitucion
} from '../controllers/institucionesController.js';

const router = Router();

router.get('/', getAllInstituciones);               // Lista completa para CRUD
router.get('/label', getInstitucionesLabel);        // Solo id/nombre para selects
router.get('/:id', getInstitucionById);             // Una institución por id
router.post('/', createInstitucion);                // Crear
router.put('/:id', updateInstitucion);              // Editar
router.delete('/:id', deleteInstitucion);           // Eliminar

export default router;
