import express from 'express';
import {
  obtenerUsuariosPorRol,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  obtenerUsuariosPorRolId,
  cambiarContrasena,
  obtenerUsuariosOperarios,
  obtenerUsuarios
} from '../controllers/usuario.controller.js';

import { validarUsuario } from '../validaciones/usuario.validation.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Primero SIEMPRE verificar token
router.use(verificarToken);

// Obtener usuarios por rol
router.get('/', obtenerUsuarios);
router.get('/operarios', checkPermiso(null, 'ver'), obtenerUsuariosOperarios);
router.get('/rol/:rol', checkPermiso(null, 'ver'), obtenerUsuariosPorRol);
router.get('/rol-id/:id', checkPermiso(null, 'ver'), obtenerUsuariosPorRolId);

// Crear usuario
router.post(
  '/',
  checkPermiso(null, 'crear'),
  validarUsuario,
  crearUsuario
);

// Editar usuario
router.put(
  '/:id',
  validarUsuario,
  actualizarUsuario
);

// Cambia contraseña
router.put(
  '/:id/cambiar-contrasena',
  cambiarContrasena
);

// Eliminar usuario
router.delete(
  '/:id',
  checkPermiso(null, 'eliminar'),
  eliminarUsuario
);

export default router;
