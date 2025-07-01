import express from 'express';
import {
  obtenerMateriasPrimas,
  obtenerMateriaPrimaPorId,
  actualizarMateriaPrima,
} from '../controllers/materiaPrima.controller.js';

const router = express.Router();

router.get('/', obtenerMateriasPrimas);
router.get('/:id', obtenerMateriaPrimaPorId);
router.put('/:id', actualizarMateriaPrima);

export default router;
