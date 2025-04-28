import { z } from "zod";

const capitalizar = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const vendedorSchema = z.object({
  nombre: z
    .string()
    .min(1, "El nombre es obligatorio")
    .transform(capitalizar),

  telefono: z
    .string()
    .min(1, "El teléfono es obligatorio")
    .refine((val) => /^\d{6,}$/.test(val), {
      message: "El formato del teléfono no es válido",
    }),

  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Formato de email inválido"),
});
