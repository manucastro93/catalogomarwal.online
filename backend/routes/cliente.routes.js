import express from 'express';
import {
  listarClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  obtenerClientesConVentas,
  obtenerEstadisticasCliente,
  obtenerHistorialCliente
} from '../controllers/cliente.controller.js';
import { registrarAuditoria } from '../middlewares/auditoria.js';

const router = express.Router();

router.get('/', listarClientes);
router.get('/con-ventas', obtenerClientesConVentas);
router.get('/:id/estadisticas', obtenerEstadisticasCliente);
router.get('/:id/historial', obtenerHistorialCliente);
router.post('/', crearCliente, registrarAuditoria('Cliente', 'creado'));
router.put('/:id', actualizarCliente, registrarAuditoria('Cliente', 'modificado'));
router.delete('/:id', eliminarCliente, registrarAuditoria('Cliente', 'eliminado'));

export default router;
