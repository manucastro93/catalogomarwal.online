import { z } from "zod";

const capitalizar = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const materiaPrimaSchema = z.object({
  sku: z.string().min(1, "El SKU es obligatorio"),

  nombre: z.string().optional().transform((val) => val ? capitalizar(val) : val),

  descripcion: z.string().optional().transform((val) => val ? capitalizar(val) : val),

  activo: z.enum(["Sí", "No"]).transform((val) => val === "Sí"),

  subcategoriaId: z.string().min(1, "La subcategoría es obligatoria"),
});
