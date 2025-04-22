import express from 'express';
import {
  obtenerPedidos,
  obtenerPedidoPorId,
  crearPedido,
  crearPedidoDesdePanel,
  actualizarEstadoPedido,
  validarCarritoSolo,
  crearOEditarPedido,
  duplicarPedido,
  marcarComoEditando,
  revertirEditando,
  obtenerPedidosInicio,
  cancelarPedidoDesdeCliente
} from '../controllers/pedido.controller.js';

import { validarPedidoBody } from '../validaciones/pedido.validation.js';
import { registrarAuditoria } from '../middlewares/auditoria.js';

const router = express.Router();

// 📦 Listar pedidos (panel o por IP pública)
router.get('/', obtenerPedidos);
router.get('/inicio', obtenerPedidosInicio);
router.get('/:id', obtenerPedidoPorId);

// 🧾 Crear o editar pedidos
router.post('/', validarPedidoBody, crearOEditarPedido, registrarAuditoria('Pedido', 'creado_o_editado'));
router.post('/duplicar', duplicarPedido);
router.post('/desde-panel', validarPedidoBody, crearPedidoDesdePanel, registrarAuditoria('Pedido', 'creado_desde_panel'));

// ✏️ Marcar pedido en edición y revertir
router.put('/:id/editando', marcarComoEditando, registrarAuditoria('Pedido', 'edicion_iniciada'));
router.put('/:id/revertir-editando', revertirEditando, registrarAuditoria('Pedido', 'edicion_revertida'));

// 🔄 Cambiar estado (desde panel, bloqueado si cliente está editando)
router.put('/:id/estado', actualizarEstadoPedido, registrarAuditoria('Pedido', 'estado_modificado'));
router.put('/:id/cancelar-desde-cliente', cancelarPedidoDesdeCliente);

// 🧪 Validar carrito (sin registrar)
router.post('/validar', validarCarritoSolo);

export default router;
