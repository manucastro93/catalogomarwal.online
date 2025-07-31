import express from 'express';
import {
  obtenerRubros,
  obtenerRubroPorId,
  crearRubro,
  actualizarRubro,
  eliminarRubro
} from '../controllers/rubro.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
// import { validarRubro } from '../validaciones/rubro.validation.js';

const router = express.Router();

router.get('/', verificarToken, obtenerRubros);
router.get('/:id', verificarToken, obtenerRubroPorId);
router.post('/', verificarToken, /* validarRubro, */ crearRubro);
router.put('/:id', verificarToken, /* validarRubro, */ actualizarRubro);
router.delete('/:id', verificarToken, eliminarRubro);

export default router;
