import express from 'express';
import {
  obtenerPedidos,
  obtenerPedidoPorId,
  crearPedidoDesdePanel,
  actualizarEstadoPedido,
  validarCarritoSolo,
  obtenerPedidosInicio,
  enviarPedidoADux,
  listarPedidosDux,
  obtenerDetallesPedidoDux,
  obtenerProductosPedidosPendientes,
  obtenerPedidosPendientesPorProducto,
  obtenerPedidoPorClienteYFecha,
  obtenerPedidosDuxInicio,
  obtenerPedidoDuxPorId
} from '../controllers/pedido.controller.js';

import { validarPedidoBody } from '../validaciones/pedido.validation.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/',verificarToken, obtenerPedidos);
router.get('/buscar-por-cliente-y-fecha', obtenerPedidoPorClienteYFecha);
//router.get('/inicio',verificarToken, obtenerPedidosInicio);
router.get('/inicio',verificarToken, obtenerPedidosDuxInicio);
router.get('/productos-pendientes', verificarToken, obtenerProductosPedidosPendientes);
router.get('/dux', listarPedidosDux);
router.get('/dux/:id', obtenerDetallesPedidoDux);
router.get('/pedido-dux/:id', obtenerPedidoDuxPorId);
router.get('/productos-pendientes/:codItem', verificarToken, obtenerPedidosPendientesPorProducto);
router.get('/:id', obtenerPedidoPorId);
router.post('/desde-panel', validarPedidoBody, crearPedidoDesdePanel);
router.post('/validar', validarCarritoSolo);
router.post('/:id/enviar-a-dux', enviarPedidoADux);

router.put('/:id/estado', actualizarEstadoPedido);



export default router;
