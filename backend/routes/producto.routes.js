import express from 'express';
import uploadExcel from '../middlewares/uploadExcel.middleware.js';

import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  crearProductoConImagenes,
  actualizarProductoConImagenes,
  eliminarImagenProducto,
  obtenerProductoPorId,
  importarProductosDesdeExcel
} from '../controllers/producto.controller.js';
import { uploadImagenesProducto } from '../middlewares/upload.js';

const router = express.Router();

router.get('/', obtenerProductos);
router.get('/:id', obtenerProductoPorId);
router.post('/', crearProducto);
router.post('/con-imagenes',uploadImagenesProducto.array('imagenes'),crearProductoConImagenes);
router.post('/importar', uploadExcel.single('archivo'), importarProductosDesdeExcel);
router.put('/:id', actualizarProducto);
router.put('/:id/con-imagenes',uploadImagenesProducto.array('imagenes'),actualizarProductoConImagenes);
router.delete('/:id', eliminarProducto);
router.delete('/imagenes/:id', eliminarImagenProducto);

export default router;
