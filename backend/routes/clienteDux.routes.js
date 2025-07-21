import express from 'express';
import {
  listarClientesDux,
  obtenerInformeClientesDux,
  obtenerListasPrecioClientesDux,
  reporteEjecutivoClientesDux
} from '../controllers/clienteDux.controller.js';

const router = express.Router();

router.get('/', listarClientesDux);
router.get('/informes', obtenerInformeClientesDux);
router.get('/listas-precio', obtenerListasPrecioClientesDux);
router.get('/reporte-ejecutivo', reporteEjecutivoClientesDux);

export default router;
