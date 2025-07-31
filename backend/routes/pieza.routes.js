import express from 'express';
import {
  obtenerPiezas,
  obtenerPiezaPorId,
  crearPieza,
  actualizarPieza,
  eliminarPieza
} from '../controllers/pieza.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
// import { validarPieza } from '../validaciones/pieza.validation.js'; 

const router = express.Router();

router.get('/', verificarToken, obtenerPiezas);
router.get('/:id', verificarToken, obtenerPiezaPorId);
router.post('/', verificarToken, /* validarPieza, */ crearPieza);
router.put('/:id', verificarToken, /* validarPieza, */ actualizarPieza);
router.delete('/:id', verificarToken, eliminarPieza);

export default router;
