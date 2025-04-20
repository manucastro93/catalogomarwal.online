import { body } from 'express-validator';

export const validarProducto = [
  body('sku').notEmpty().withMessage('El SKU es obligatorio'),
  body('precioUnitario')
    .notEmpty().withMessage('El precio unitario es obligatorio')
    .isNumeric().withMessage('Debe ser un número'),
  body('categoriaId').notEmpty().withMessage('La categoría es obligatoria'),
];
