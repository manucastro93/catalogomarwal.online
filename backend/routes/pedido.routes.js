import express from 'express';
import {
  obtenerPedidos,
  obtenerPedidoPorId,
  crearPedidoDesdePanel,
  actualizarEstadoPedido,
  validarCarritoSolo,
  obtenerPedidosInicio,
  enviarPedidoADux,
  listarPedidosDux
} from '../controllers/pedido.controller.js';

import { validarPedidoBody } from '../validaciones/pedido.validation.js';

const router = express.Router();

router.get('/', obtenerPedidos);
router.get('/inicio', obtenerPedidosInicio);
router.get('/:id', obtenerPedidoPorId);
router.get('/dux', listarPedidosDux);

router.post('/desde-panel', validarPedidoBody, crearPedidoDesdePanel);
router.post('/:id/enviar-a-dux', enviarPedidoADux);

router.put('/:id/estado', actualizarEstadoPedido);

router.post('/validar', validarCarritoSolo);

export default router;
