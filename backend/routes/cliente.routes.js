import express from 'express';
import {
  listarClientes,
  listarClientesInactivos,
  actualizarCliente,
  obtenerClientesConVentas,
  obtenerEstadisticasCliente,
  obtenerHistorialCliente,
  obtenerSeguimientoCliente
} from '../controllers/cliente.controller.js';

const router = express.Router();

router.get('/', listarClientes);
router.get('/inactivos', listarClientesInactivos);
router.get('/con-ventas', obtenerClientesConVentas);
router.get('/:id/estadisticas', obtenerEstadisticasCliente);
router.get('/:id/historial', obtenerHistorialCliente);
router.get('/:id/seguimiento', obtenerSeguimientoCliente);
router.put('/:id', actualizarCliente);

export default router;
