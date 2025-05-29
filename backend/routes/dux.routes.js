import express from 'express';
import {
  sincronizarDesdeDuxController,
  getProgresoSync,
  obtenerPedidosDux
} from '../controllers/dux.controller.js';

const router = express.Router();

router.post('/sincronizar-dux', sincronizarDesdeDuxController);
router.get('/progreso-sync', getProgresoSync);
router.get('/pedidos', obtenerPedidosDux);

export default router;
