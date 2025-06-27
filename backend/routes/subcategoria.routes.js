import express from 'express';
import {
  listarSubcategorias
} from '../controllers/subcategoria.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verificarToken, listarSubcategorias);

export default router;
