// backend/routes/grados.js
import { Router } from 'express';
import { getAllGrados } from '../controllers/gradosController.js';
const router = Router();
router.get('/', getAllGrados);
export default router;