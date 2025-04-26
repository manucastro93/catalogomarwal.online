import express from 'express';
import {
  listarClientes,
  actualizarCliente,
  obtenerClientesConVentas,
  obtenerEstadisticasCliente,
  obtenerHistorialCliente,
} from '../controllers/cliente.controller.js';

const router = express.Router();

router.get('/', listarClientes);
router.get('/con-ventas', obtenerClientesConVentas);
router.get('/:id/estadisticas', obtenerEstadisticasCliente);
router.get('/:id/historial', obtenerHistorialCliente);
router.put('/:id', actualizarCliente);

export default router;
