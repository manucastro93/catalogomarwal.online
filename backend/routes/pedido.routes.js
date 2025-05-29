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
router.get('/dux', listarPedidosDux);
router.get('/:id', obtenerPedidoPorId);


router.post('/desde-panel', validarPedidoBody, crearPedidoDesdePanel);
router.post('/validar', validarCarritoSolo);
router.post('/:id/enviar-a-dux', enviarPedidoADux);

router.put('/:id/estado', actualizarEstadoPedido);



export default router;
