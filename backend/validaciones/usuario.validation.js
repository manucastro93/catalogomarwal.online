import { usuarioSchema } from './usuario.schema.js';
export const validarUsuario = (req, res, next) => {

  const resultado = usuarioSchema.safeParse(req.body);

  if (!resultado.success) {
    const errores = resultado.error.flatten().fieldErrors;
    console.error('❌ Errores de validación:', errores);
    return res.status(400).json({ message: 'Datos inválidos', errores });
  }

  req.body = resultado.data;
  next();
};
