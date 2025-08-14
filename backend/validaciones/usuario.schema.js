// backend/validaciones/usuario.schema.js
import { z } from "zod";

const emptyToUndefined = (v) => (v === "" ? undefined : v);
const emptyToNull = (v) => (v === "" ? null : v);

export const usuarioSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio"),

    // ✅ Primero email(), luego transform a minúsculas
    email: z
      .string()
      .trim()
      .email("Debe ser un email válido")
      .transform((s) => s.toLowerCase()),

    // allowNull en DB → opcional acá; si viene "" lo ignoramos
    telefono: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(5, "Teléfono inválido").optional()
    ),

    // a veces viene como string: coerce a number
    rolUsuarioId: z.coerce.number({ required_error: "El rolUsuarioId es obligatorio" }).int().positive(),

    // FK opcional; "" -> null; coerce a number
    personalDuxId: z.preprocess(
      emptyToNull,
      z.coerce.number().int().positive().nullable().optional()
    ),

    // opcional/nullable en el modelo
    contraseña: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional().nullable(),

    // opcional/nullable; si se envía, validar formato
    link: z.string().length(4, "El link debe tener 4 caracteres").regex(/^[A-Z0-9]+$/, "El link debe ser alfanumérico en mayúsculas").optional().nullable(),

    // campo auxiliar (no está en la tabla)
    modulo: z.string().optional(),
  })
  .strip();

// Para PATCH/updates parciales
export const updateUsuarioSchema = usuarioSchema.partial().strip();
