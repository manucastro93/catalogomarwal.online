import express from 'express';
import {
  listarCategorias,
  crearCategoria,
  editarCategoria,
  eliminarCategoria
} from '../controllers/categoria.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { validarCategoria } from '../validaciones/categoria.validation.js';

const router = express.Router();

router.get('/', verificarToken, listarCategorias);
router.post('/', verificarToken, validarCategoria, crearCategoria);
router.put('/:id', verificarToken, validarCategoria, editarCategoria);
router.delete('/:id', verificarToken, eliminarCategoria);

export default router;
