import express from 'express';
import { listarFacturas } from '../controllers/factura.controller.js';
import { listarEstadosFactura } from '../controllers/estadoFactura.controller.js';

const router = express.Router();

router.get('/estados-factura', listarEstadosFactura);
router.get('/', listarFacturas);

export default router;
