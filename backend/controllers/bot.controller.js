import { procesarMensaje } from '../services/bot.service.js';

export const recibirMensajeWhatsapp = async (req, res, next) => {
  try {
    const mensaje = req.body;
    const respuesta = await procesarMensaje(mensaje);
    res.status(200).json({ mensaje: 'Procesado correctamente', respuesta });
  } catch (error) {
    console.error('❌ Error al procesar mensaje de WhatsApp:', error);
    next(error);
  }
};
