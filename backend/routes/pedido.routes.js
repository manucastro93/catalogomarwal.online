import express from 'express';
import {
  obtenerPedidos,
  obtenerPedidoPorId,
  crearPedido,
  crearPedidoDesdePanel,
  actualizarEstadoPedido,
  obtenerPedidosPorIp,
  validarCarritoSolo
} from '../controllers/pedido.controller.js';

import { validarPedido } from '../validaciones/pedido.validation.js';
import { registrarAuditoria } from '../middlewares/auditoria.js';

const router = express.Router();

// 📦 Listar pedidos (panel o por IP pública)
router.get('/', obtenerPedidos);
router.get('/:id', obtenerPedidoPorId);
router.get('/ip', obtenerPedidosPorIp);

// 🧾 Crear pedidos
router.post('/', validarPedido, crearPedido, registrarAuditoria('Pedido', 'creado'));
router.post('/desde-panel', validarPedido, crearPedidoDesdePanel, registrarAuditoria('Pedido', 'creado'));

// 🔄 Cambiar estado
router.put('/:id/estado', actualizarEstadoPedido, registrarAuditoria('Pedido', 'modificado'));

// 🧪 Validar carrito (sin registrar)
router.post('/validar', validarCarritoSolo);

export default router;
