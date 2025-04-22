import express from 'express';
import {
  listarProductosPublicos,
  listarCategorias,
  listarProvincias,
  listarLocalidadesPorProvinciaInput,
  listarLocalidadesPorProvincia,
  listarBanners,
  obtenerClientePorIp,
  obtenerClientePorId,
  obtenerPedidosClientePorId
} from '../controllers/public.controller.js';

const router = express.Router();

router.get('/productos', listarProductosPublicos);
router.get('/categorias', listarCategorias);
router.get('/provincias', listarProvincias);
router.get('/provincia/:provinciaId/localidades', listarLocalidadesPorProvincia);
router.get('/localidades', listarLocalidadesPorProvinciaInput);
router.get('/banners', listarBanners);
router.get('/cliente-por-ip', obtenerClientePorIp);
router.get('/pedidos/id-cliente', obtenerPedidosClientePorId);
router.get('/cliente/:id', obtenerClientePorId);
router.get('/productos', listarProductosPublicos);
router.get('/categorias', listarCategorias);

export default router;
