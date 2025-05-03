import express from 'express';
import {
  listarRolesUsuario,
  crearRolUsuario,
  actualizarRolUsuario,
  eliminarRolUsuario,
  obtenerPermisosPorRol,
  actualizarPermisosPorRol
} from '../controllers/rolUsuario.controller.js';

const router = express.Router();


router.get('/', listarRolesUsuario);
router.post('/', crearRolUsuario);
router.put('/:id', actualizarRolUsuario);
router.delete('/:id', eliminarRolUsuario);

router.get('/:id/permisos', obtenerPermisosPorRol); 
router.put('/:id/permisos', actualizarPermisosPorRol);

export default router;
