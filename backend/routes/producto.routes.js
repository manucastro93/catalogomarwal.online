import express from 'express';
import {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  crearProductoConImagenes,
  actualizarProductoConImagenes,
  eliminarImagenProducto,
  importarProductosDesdeExcel,
  actualizarOrdenImagenes,
  obtenerProductosProduccion
} from '../controllers/producto.controller.js';

import { validarProducto } from '../validaciones/producto.validation.js';
import { uploadImagenesProducto } from '../middlewares/upload.js';

const router = express.Router();

router.get('/', obtenerProductos);
router.get('/produccion', obtenerProductosProduccion);
router.get('/:id', obtenerProductoPorId);

router.post('/', validarProducto, crearProducto);
router.post(
  '/con-imagenes',
  uploadImagenesProducto.array('imagenes'),
  crearProductoConImagenes
);

router.put('/:id', validarProducto, actualizarProducto);
router.put(
  '/:id/con-imagenes',
  uploadImagenesProducto.array('imagenes'),
  actualizarProductoConImagenes
);


router.delete('/:id', eliminarProducto);

router.delete('/imagenes/:id', eliminarImagenProducto);

router.post('/importar', importarProductosDesdeExcel);
router.put('/imagenes/ordenar', actualizarOrdenImagenes); 

export default router;
