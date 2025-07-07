import express from 'express';
import { listarProveedores } from '../controllers/proveedor.controller.js';

const router = express.Router();

router.get('/', listarProveedores);

export default router;
