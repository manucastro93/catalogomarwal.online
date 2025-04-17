import express from 'express';
import {
  crearNotificacion,
  obtenerNotificaciones,
  marcarComoLeida,
} from '../controllers/notificacion.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/',verificarToken, obtenerNotificaciones);
router.post('/', crearNotificacion);
router.put('/:id/leida', marcarComoLeida);

export default router;
