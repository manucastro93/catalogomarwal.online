import express from 'express';
import {
  // Cliente
  obtenerClientePorIp,
  obtenerClientePorId,
  registrarLogPublico,

  // Página
  obtenerPaginaPublica,
  listarBanners,

  // Pedido
  crearOEditarPedido,
  obtenerPedidosClientePorId,
  obtenerPedidoPorId,
  marcarComoEditando,
  revertirEditando,
  actualizarEstadoPedido,
  validarCarritoSolo,
  duplicarPedido,
  cancelarPedidoDesdeCliente,

  // Producto
  listarProductosPublicos,
  obtenerProductoPorId,
  listarCategorias,

  // Ubicación
  listarProvincias,
  listarLocalidadesPorProvincia,
  listarLocalidadesPorProvinciaInput,

  // Vendedor
  buscarVendedorPorLink
} from '../controllers/public.controller.js';
import { validarPedidoBody } from '../validaciones/pedido.validation.js';

const router = express.Router();

// 🧾 Cliente
router.get('/cliente-por-ip', obtenerClientePorIp);
router.get('/cliente/:id', obtenerClientePorId);
router.post('/logs', registrarLogPublico);

// 📄 Página
router.get('/pagina', obtenerPaginaPublica);
router.get('/banners', listarBanners);

// 📦 Pedido
router.post('/pedidos', validarPedidoBody, crearOEditarPedido);
router.get('/pedidos/id-cliente', obtenerPedidosClientePorId);
router.get('/pedidos/:id', obtenerPedidoPorId);
router.put('/pedidos/:id/editando', marcarComoEditando);
router.put('/pedidos/:id/revertir-editando', revertirEditando);
router.put('/pedidos/:id/estado', actualizarEstadoPedido);
router.post('/pedidos/validar', validarCarritoSolo);
router.post('/pedidos/duplicar', duplicarPedido);
router.put('/pedidos/:id/cancelar-desde-cliente', cancelarPedidoDesdeCliente);

// 🛍 Producto
router.get('/productos', listarProductosPublicos);
router.get('/productos/:id', obtenerProductoPorId);
router.get('/categorias', listarCategorias);
router.post('/logs', registrarLogPublico);

// 🌎 Ubicación
router.get('/provincias', listarProvincias);
router.get('/provincia/:provinciaId/localidades', listarLocalidadesPorProvincia);
router.get('/localidades', listarLocalidadesPorProvinciaInput);

// 🧑‍💼 Vendedor
router.get('/usuarios/vendedores/vendedor-por-link/:link', buscarVendedorPorLink);

export default router;
