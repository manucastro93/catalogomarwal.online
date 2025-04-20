import express from 'express';
import {
  listarCategorias,
  crearCategoria,
  editarCategoria,
  eliminarCategoria
} from '../controllers/categoria.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { esAdminOSupremo } from '../middlewares/roleMiddleware.js';
import { validarCategoria } from '../validaciones/categoria.validation.js';

const router = express.Router();

router.get('/', verificarToken, listarCategorias);
router.post('/', verificarToken, esAdminOSupremo, validarCategoria, crearCategoria);
router.put('/:id', verificarToken, esAdminOSupremo, validarCategoria, editarCategoria);
router.delete('/:id', verificarToken, esAdminOSupremo, eliminarCategoria);

export default router;
