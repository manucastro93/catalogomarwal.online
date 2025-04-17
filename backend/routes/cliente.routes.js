import express from 'express';
import {
  listarClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  obtenerClientesConVentas
} from '../controllers/cliente.controller.js';
import { validarCliente } from '../validaciones/cliente.validation.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/',verificarToken, listarClientes);
router.get('/mapa', verificarToken, obtenerClientesConVentas);
router.post('/', verificarToken, validarCliente, crearCliente);
router.put('/:id', actualizarCliente);
router.delete('/:id', eliminarCliente);

export default router;
