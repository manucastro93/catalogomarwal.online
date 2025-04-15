import { body } from 'express-validator';

export const validarCliente = [
  body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
  body('telefono').notEmpty().withMessage('El teléfono es obligatorio'),
  body('email').isEmail().withMessage('El email no es válido'),
  body('direccion').notEmpty().withMessage('La dirección es obligatoria'),
  body('cuit_cuil').notEmpty().withMessage('El CUIT/CUIL es obligatorio'),
];
