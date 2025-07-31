import express from 'express';
import {
  obtenerMateriales,
  obtenerMaterialPorId,
  crearMaterial,
  actualizarMaterial,
  eliminarMaterial
} from '../controllers/material.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
// import { validarMaterial } from '../validaciones/material.validation.js';

const router = express.Router();

router.get('/', verificarToken, obtenerMateriales);
router.get('/:id', verificarToken, obtenerMaterialPorId);
router.post('/', verificarToken, /* validarMaterial, */ crearMaterial);
router.put('/:id', verificarToken, /* validarMaterial, */ actualizarMaterial);
router.delete('/:id', verificarToken, eliminarMaterial);

export default router;
