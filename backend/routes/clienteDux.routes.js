import express from 'express';
import {
  listarClientesDux,
  obtenerInformeClientesDux,
  obtenerListasPrecioClientesDux,
  reporteEjecutivoClientesDux,
  obtenerInformeClientesUltimaCompra,
  reporteEjecutivoUltimaCompra,
  obtenerClientesDuxGeo,
  geocodificarBatchClientesDux,
} from '../controllers/clienteDux.controller.js';

const router = express.Router();

router.get('/', listarClientesDux);
router.get('/informes', obtenerInformeClientesDux);
router.get('/listas-precio', obtenerListasPrecioClientesDux);
router.get('/reporte-ejecutivo', reporteEjecutivoClientesDux);
router.get('/informe-ultima-compra', obtenerInformeClientesUltimaCompra);
router.get('/reporte-ejecutivo-ultima-compra', reporteEjecutivoUltimaCompra);
router.get('/geo', obtenerClientesDuxGeo);
router.post('/geocode', geocodificarBatchClientesDux);

export default router;
