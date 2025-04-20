import { body } from 'express-validator';

export const validarUsuario = [
  body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
  body('email').isEmail().withMessage('Debe ser un email válido'),
  body('telefono').notEmpty().withMessage('El teléfono es obligatorio'),
  body('rol').isIn(['vendedor', 'administrador', 'supremo']).withMessage('Rol inválido'),
];
