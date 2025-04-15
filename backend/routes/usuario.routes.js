// routes/usuario.routes.js
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
  obtenerAdministradores,
  crearAdministrador,
  actualizarAdministrador,
  eliminarAdministrador,
  buscarVendedorPorLink
} from '../controllers/usuario.controller.js';

const router = express.Router();

// CRUD general de usuarios
router.get('/', obtenerUsuarios);
router.post('/', crearUsuario);
router.put('/:id', actualizarUsuario);
router.delete('/:id', eliminarUsuario);


// Vendedores
router.get('/vendedores', obtenerVendedores);
router.post('/vendedores', crearVendedor);
router.put('/vendedores/:id', actualizarVendedor);
router.delete('/vendedores/:id', eliminarVendedor);
router.get('/vendedores/vendedor-por-link/:link', buscarVendedorPorLink);

// Administradores
router.get('/administradores', obtenerAdministradores);
router.post('/administradores', crearAdministrador);
router.put('/administradores/:id', actualizarAdministrador);
router.delete('/administradores/:id', eliminarAdministrador);

export default router;
