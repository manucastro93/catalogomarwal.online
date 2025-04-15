import express from 'express';
import {
  listarProductosPublicos,
  listarCategorias,
  listarProvincias,
  listarLocalidadesPorProvinciaInput,
  listarLocalidadesPorProvincia,
  listarBanners,
} from '../controllers/public.controller.js';

const router = express.Router();

router.get('/productos', listarProductosPublicos);
router.get('/categorias', listarCategorias);
router.get('/provincias', listarProvincias);
router.get('/provincia/:provinciaId/localidades', listarLocalidadesPorProvincia);
router.get('/localidades', listarLocalidadesPorProvinciaInput);
router.get('/banners', listarBanners);

export default router;
