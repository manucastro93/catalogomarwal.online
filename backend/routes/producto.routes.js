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
  actualizarOrdenImagenes
} from '../controllers/producto.controller.js';

import { validarProducto } from '../validaciones/producto.validation.js';
import { registrarAuditoria } from '../middlewares/auditoria.js';

const router = express.Router();

router.get('/', obtenerProductos);
router.get('/:id', obtenerProductoPorId);

router.post('/', validarProducto, crearProducto, registrarAuditoria('Producto', 'creado'));
router.post('/con-imagenes', validarProducto, crearProductoConImagenes, registrarAuditoria('Producto', 'creado'));

router.put('/:id', validarProducto, actualizarProducto, registrarAuditoria('Producto', 'modificado'));
router.put('/:id/con-imagenes', validarProducto, actualizarProductoConImagenes, registrarAuditoria('Producto', 'modificado'));

router.delete('/:id', eliminarProducto, registrarAuditoria('Producto', 'eliminado'));

router.delete('/imagen/:id', eliminarImagenProducto); // sin validación/auditoría porque es un recurso secundario

router.post('/importar', importarProductosDesdeExcel); // Excel: validación se hace adentro
router.put('/imagenes/ordenar', actualizarOrdenImagenes); // Orden de imágenes

export default router;
