import { z } from "zod";

const capitalizar = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const categoriaSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre de la categoría es obligatorio')
    .transform(capitalizar),

  nombreWeb: z
    .string()
    .nullable()
    .transform((val) => (val ? capitalizar(val) : '')),

  orden: z
    .string()
    .refine((val) => val === '' || !isNaN(Number(val)), {
      message: 'El orden debe ser un número',
    }),

  estado: z.boolean({
    invalid_type_error: 'El estado debe ser verdadero o falso',
  }),
});
