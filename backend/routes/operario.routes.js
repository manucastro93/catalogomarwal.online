import express from 'express';
import {
  obtenerOperarios,
  obtenerOperarioPorId,
  crearOperario,
  actualizarOperario,
  eliminarOperario
} from '../controllers/operario.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
// import { validarOperario } from '../validaciones/operario.validation.js';

const router = express.Router();

router.get('/', verificarToken, obtenerOperarios);
router.get('/:id', verificarToken, obtenerOperarioPorId);
router.post('/', verificarToken, /* validarOperario, */ crearOperario);
router.put('/:id', verificarToken, /* validarOperario, */ actualizarOperario);
router.delete('/:id', verificarToken, eliminarOperario);

export default router;
