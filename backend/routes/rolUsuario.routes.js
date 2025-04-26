import express from 'express';
import {
  listarRolesUsuario,
  crearRolUsuario,
  actualizarRolUsuario,
  eliminarRolUsuario,
} from '../controllers/rolUsuario.controller.js';

const router = express.Router();

router.get('/', listarRolesUsuario);
router.post('/', crearRolUsuario);
router.put('/:id', actualizarRolUsuario);
router.delete('/:id', eliminarRolUsuario);

export default router;
