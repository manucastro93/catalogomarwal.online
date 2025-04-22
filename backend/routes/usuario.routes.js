import express from 'express';
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  obtenerVendedores,
  crearVendedor,
  actualizarVendedor,
  eliminarVendedor,
  buscarVendedorPorLink,
  obtenerAdministradores,
  crearAdministrador,
  actualizarAdministrador,
  eliminarAdministrador,
  obtenerEstadisticasVendedor
} from '../controllers/usuario.controller.js';

import { validarUsuario } from '../validaciones/usuario.validation.js';
import { registrarAuditoria } from '../middlewares/auditoria.js';

const router = express.Router();

// ================== USUARIOS GENERALES ==================
router.get('/', obtenerUsuarios);
router.post('/', validarUsuario, crearUsuario, registrarAuditoria('Usuario', 'creado'));
router.put('/:id', validarUsuario, actualizarUsuario, registrarAuditoria('Usuario', 'modificado'));
router.delete('/:id', eliminarUsuario, registrarAuditoria('Usuario', 'eliminado'));

// ================== VENDEDORES ==================
router.get('/vendedores', obtenerVendedores);
router.get('/vendedores/vendedor-por-link/:link', buscarVendedorPorLink);
router.get('/:id/estadisticas-vendedor', obtenerEstadisticasVendedor);
router.post('/vendedores', validarUsuario, crearVendedor, registrarAuditoria('Usuario', 'creado'));
router.put('/vendedores/:id', validarUsuario, actualizarVendedor, registrarAuditoria('Usuario', 'modificado'));
router.delete('/vendedores/:id', eliminarVendedor, registrarAuditoria('Usuario', 'eliminado'));

// ================== ADMINISTRADORES ==================
router.get('/administradores', obtenerAdministradores);
router.post('/administradores', validarUsuario, crearAdministrador, registrarAuditoria('Usuario', 'creado'));
router.put('/administradores/:id', validarUsuario, actualizarAdministrador, registrarAuditoria('Usuario', 'modificado'));
router.delete('/administradores/:id', eliminarAdministrador, registrarAuditoria('Usuario', 'eliminado'));

export default router;
