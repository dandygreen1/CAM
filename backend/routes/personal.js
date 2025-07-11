import { Router } from 'express';
import {
  getAllPersonal,
  getPersonalById,
  createPersonal,
  updatePersonal,
  deletePersonal,
  getAllProfesores
} from '../controllers/personalController.js';

import {
  authenticateToken,
  authorizeAdmin
} from '../middleware/auth.js';

const router = Router();

router.get('/profesores',authenticateToken, getAllProfesores);

// Todas van protegidas: primero autentica con el token, luego autoriza por el rol de admin
router.get('/', authenticateToken, authorizeAdmin, getAllPersonal);
router.get('/:id', authenticateToken, authorizeAdmin, getPersonalById);
router.post('/', authenticateToken, authorizeAdmin, createPersonal);
router.put('/:id',authenticateToken, authorizeAdmin, updatePersonal);
router.delete('/:id', authenticateToken, authorizeAdmin, deletePersonal);

export default router;
