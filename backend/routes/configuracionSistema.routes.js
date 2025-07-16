import express from 'express';
import {
  listarConfiguraciones,
  crearConfiguracion,
  editarConfiguracion,
  eliminarConfiguracion,
  obtenerConfiguracionPorClave,
} from '../controllers/configuracionSistema.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { validarConfiguracion } from '../validaciones/configuracionSistema.validation.js';

const router = express.Router();

router.get('/', verificarToken, listarConfiguraciones);
router.post('/', verificarToken, validarConfiguracion, crearConfiguracion);
router.put('/:id', verificarToken, validarConfiguracion, editarConfiguracion);
router.delete('/:id', verificarToken, eliminarConfiguracion);
router.get('/clave/:clave', verificarToken, obtenerConfiguracionPorClave);

export default router;
