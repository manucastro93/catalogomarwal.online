import express from 'express';
import {
  sincronizarDesdeDuxController,
  getProgresoSync
} from '../controllers/dux.controller.js';

const router = express.Router();

router.post('/sincronizar-dux', sincronizarDesdeDuxController);
router.get('/progreso-sync', getProgresoSync);

export default router;
