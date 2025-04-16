import { z } from "zod";

// Función para mayúscula en la primera letra
const capitalizar = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const clienteSchema = z
  .object({
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

    cuit_cuil: z
      .string()
      .min(1, "El CUIT/CUIL es obligatorio")
      .refine((val) => /^\d{11}$/.test(val), {
        message: "Formato de CUIT/CUIL inválido",
      }),

    razonSocial: z
      .string()
      .optional()
      .transform((val) => (val ? capitalizar(val) : val)),

    direccion: z
      .string()
      .min(1, "La dirección es obligatoria")
      .transform(capitalizar),

    provinciaId: z
      .number({ invalid_type_error: "Seleccioná una provincia" }),

    localidadId: z
      .number({ invalid_type_error: "Seleccioná una localidad" }),
  });
