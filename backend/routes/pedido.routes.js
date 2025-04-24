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
import { registrarAuditoria } from '../middlewares/auditoria.js';

const router = express.Router();

// 📦 Listar pedidos (panel o por IP pública)
router.get('/', obtenerPedidos);
router.get('/inicio', obtenerPedidosInicio);
router.get('/:id', obtenerPedidoPorId);

// 🧾 Crear o editar pedidos
router.post('/desde-panel', validarPedidoBody, crearPedidoDesdePanel, registrarAuditoria('Pedido', 'creado_desde_panel'));

// 🔄 Cambiar estado (desde panel, bloqueado si cliente está editando)
router.put('/:id/estado', actualizarEstadoPedido, registrarAuditoria('Pedido', 'estado_modificado'));

// 🧪 Validar carrito (sin registrar)
router.post('/validar', validarCarritoSolo);

export default router;
