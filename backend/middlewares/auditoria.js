import { LogAuditoria } from '../models/index.js';

export const registrarAuditoria = (modelo, accion) => async (req, res, next) => {
  const usuarioId = req.usuario?.id || null;
  const id = req.params?.id || null;

  try {
    await LogAuditoria.create({
      tabla: modelo,
      accion,
      registroId: id,
      usuarioId,
    });
  } catch (error) {
    console.warn('⚠️ Error registrando auditoría:', error.message);
  }

  next();
};
