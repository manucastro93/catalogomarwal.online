import { body } from 'express-validator';

export const validarPedido = [
  body('carrito')
    .isArray({ min: 1 })
    .withMessage('El carrito no puede estar vacío'),
  
  body('carrito.*.id')
    .notEmpty()
    .withMessage('Cada producto del carrito debe tener un ID'),

  body('carrito.*.cantidad')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser al menos 1'),

  body('carrito.*.precio')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),

  body('cliente.nombre')
    .notEmpty()
    .withMessage('El nombre del cliente es obligatorio'),

  body('cliente.email')
    .isEmail()
    .withMessage('El email del cliente no es válido'),

  body('cliente.telefono')
    .notEmpty()
    .withMessage('El teléfono del cliente es obligatorio'),

  body('cliente.direccion')
    .notEmpty()
    .withMessage('La dirección del cliente es obligatoria'),

  body('cliente.cuit_cuil')
    .notEmpty()
    .withMessage('El CUIT/CUIL del cliente es obligatorio'),
];
