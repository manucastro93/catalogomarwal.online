import express from 'express';
import {
  resumenAnual,
  gastosPorCategoria,
  gastosProveedoresPorCategoria,
  gastosDetalleMes
} from '../controllers/finanzas.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/resumen-anual', verificarToken, resumenAnual);
router.get('/gastos-por-categoria', verificarToken, gastosPorCategoria);
router.get('/gastos-proveedores', verificarToken, gastosProveedoresPorCategoria);
router.get('/gastos-detalle', verificarToken, gastosDetalleMes);

export default router;
