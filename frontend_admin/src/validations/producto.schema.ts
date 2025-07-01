
import { z } from "zod";

const capitalizar = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const productoSchema = z.object({
  sku: z
    .string()
    .min(1, "El SKU es obligatorio"),

  nombre: z
    .string()
    .optional()
    .transform((val) => val ? capitalizar(val) : val),

  descripcion: z
    .string()
    .optional()
    .transform((val) => val ? capitalizar(val) : val),

  activo: z.enum(["Sí", "No"]),

  precioUnitario: z
    .string()
    .min(1, "El precio unitario es obligatorio")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Debe ser un número válido mayor a 0",
    }),

  costoDux: z
    .string()
    .min(1, "El costoDux es obligatorio")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Debe ser un número válido mayor a 0",
    }),    

  precioPorBulto: z
    .string()
    .min(1, "El precio por bulto es obligatorio")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Debe ser un número válido mayor a 0",
    }),

  unidadPorBulto: z
    .string()
    .min(1, "Las unidades por bulto son obligatorias")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Debe ser un número válido mayor a 0",
    }),

  categoriaId: z
    .string()
    .min(1, "La categoría es obligatoria"),

  subcategoriaId: z
    .string()
    .min(1, "La categoría es obligatoria"),    
});
