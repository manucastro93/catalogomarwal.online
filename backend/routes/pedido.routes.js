import express from 'express';
import {
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarEstadoPedido,
  crearPedido,
  obtenerPedidosPorIp
} from '../controllers/pedido.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🟢 rutas específicas PRIMERO
router.get('/mis-pedidos', obtenerPedidosPorIp);
router.put('/:id/estado', actualizarEstadoPedido);

// 🔵 rutas genéricas DESPUÉS
router.get('/:id', obtenerPedidoPorId);
router.get('/', verificarToken, obtenerPedidos);
router.post('/', crearPedido);


export default router;
