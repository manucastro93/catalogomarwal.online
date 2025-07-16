import { z } from 'zod';

export const configuracionSchema = z.object({
  clave: z.string().min(1, 'La clave es obligatoria'),
  valor: z.string().min(1, 'El valor es obligatorio'),
  descripcion: z.string().optional(),
});

export const validarConfiguracion = (req, res, next) => {
  try {
    const data = req.method === 'POST'
      ? configuracionSchema.parse(req.body)
      : configuracionSchema.omit({ clave: true }).parse(req.body); // en PUT no se edita la clave

    req.body = data;
    next();
  } catch (error) {
    return res.status(400).json({ error: error.errors?.[0]?.message || 'Datos inválidos' });
  }
};
