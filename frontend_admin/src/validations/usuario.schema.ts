import { z } from 'zod';

export const usuarioSchema = z.object({
  nombre: z
    .string()
    .min(1, { message: "El nombre es obligatorio" })
    .max(100, { message: "El nombre no puede tener más de 100 caracteres" }),

  email: z
    .string()
    .email({ message: "Debe ser un correo electrónico válido" }),

  telefono: z
    .string()
    .min(1, { message: "El teléfono es obligatorio" })
    .max(15, { message: "El teléfono no puede tener más de 15 caracteres" }),
});

export type UsuarioSchema = z.infer<typeof usuarioSchema>;
