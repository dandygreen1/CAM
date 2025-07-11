// backend/routes/generos.js
import { Router } from 'express';
import { getAllGeneros } from '../controllers/generosController.js';
const router = Router();
router.get('/', getAllGeneros);
export default router;