import express from 'express';
import {
  listarEstadosPedido,
  crearEstadoPedido,
  actualizarEstadoPedido,
  eliminarEstadoPedido,
} from '../controllers/estadoPedido.controller.js';

const router = express.Router();

router.get('/', listarEstadosPedido);
router.post('/', crearEstadoPedido);
router.put('/:id', actualizarEstadoPedido);
router.delete('/:id', eliminarEstadoPedido);

export default router;
