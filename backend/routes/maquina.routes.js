import express from 'express';
import {
  obtenerMaquinas,
  obtenerMaquinaPorId,
  crearMaquina,
  actualizarMaquina,
  eliminarMaquina
} from '../controllers/maquina.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
// import { validarMaquina } from '../validaciones/maquina.validation.js';

const router = express.Router();

router.get('/', verificarToken, obtenerMaquinas);
router.get('/:id', verificarToken, obtenerMaquinaPorId);
router.post('/', verificarToken, /* validarMaquina, */ crearMaquina);
router.put('/:id', verificarToken, /* validarMaquina, */ actualizarMaquina);
router.delete('/:id', verificarToken, eliminarMaquina);

export default router;
