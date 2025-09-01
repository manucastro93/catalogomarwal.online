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
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/',verificarToken, listarClientesDux);
router.get('/informes',verificarToken, obtenerInformeClientesDux);
router.get('/listas-precio',verificarToken, obtenerListasPrecioClientesDux);
router.get('/reporte-ejecutivo',verificarToken, reporteEjecutivoClientesDux);
router.get('/informe-ultima-compra',verificarToken, obtenerInformeClientesUltimaCompra);
router.get('/reporte-ejecutivo-ultima-compra',verificarToken, reporteEjecutivoUltimaCompra);
router.get('/geo', obtenerClientesDuxGeo);
router.post('/geocode', geocodificarBatchClientesDux);

export default router;
