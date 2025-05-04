import { z } from 'zod';

export const usuarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Debe ser un email válido'),
  telefono: z.string().min(1, 'El teléfono es obligatorio'),
  rolUsuarioId: z.number({ required_error: 'El rolUsuarioId es obligatorio' }),
  modulo: z.string().optional() 
}).strip();
