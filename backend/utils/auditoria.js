import { LogAuditoria } from '../models/index.js';

// Función base para crear auditoría
export const crearAuditoria = async ({
  tabla,
  accion,
  registroId,
  usuarioId,
  descripcion = null,
  datosAntes = null,
  datosDespues = null,
  ip = null,
}) => {
  try {
    await LogAuditoria.create({
      tabla,
      accion,
      registroId,
      usuarioId,
      descripcion,
      datosAntes,
      datosDespues,
      ip,
    });
  } catch (error) {
    console.warn('⚠️ Error registrando auditoría:', error.message);
  }
};