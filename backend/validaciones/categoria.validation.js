import { body } from 'express-validator';

export const validarCategoria = [
  body('nombre').notEmpty().withMessage('El nombre de la categoría es obligatorio'),
  body('estado').isBoolean().withMessage('El estado debe ser un valor booleano'),
];
