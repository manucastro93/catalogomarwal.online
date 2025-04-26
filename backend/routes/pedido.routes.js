import express from 'express';
import {
  obtenerPedidos,
  obtenerPedidoPorId,
  crearPedidoDesdePanel,
  actualizarEstadoPedido,
  validarCarritoSolo,
  obtenerPedidosInicio,
} from '../controllers/pedido.controller.js';

import { validarPedidoBody } from '../validaciones/pedido.validation.js';

const router = express.Router();

router.get('/', obtenerPedidos);
router.get('/inicio', obtenerPedidosInicio);
router.get('/:id', obtenerPedidoPorId);

router.post('/desde-panel', validarPedidoBody, crearPedidoDesdePanel);

router.put('/:id/estado', actualizarEstadoPedido);

router.post('/validar', validarCarritoSolo);

export default router;
