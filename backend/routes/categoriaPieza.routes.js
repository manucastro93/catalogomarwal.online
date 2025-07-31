import express from 'express';
import {
  obtenerCategoriasPiezas,
  obtenerCategoriaPiezaPorId,
  crearCategoriaPieza,
  actualizarCategoriaPieza,
  eliminarCategoriaPieza
} from '../controllers/categoriaPieza.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
// import { validarCategoriaPieza } from '../validaciones/categoriaPieza.validation.js';

const router = express.Router();

router.get('/', verificarToken, obtenerCategoriasPiezas);
router.get('/:id', verificarToken, obtenerCategoriaPiezaPorId);
router.post('/', verificarToken, /* validarCategoriaPieza, */ crearCategoriaPieza);
router.put('/:id', verificarToken, /* validarCategoriaPieza, */ actualizarCategoriaPieza);
router.delete('/:id', verificarToken, eliminarCategoriaPieza);

export default router;
