import { enviarMensajeValidacionUsuario } from '../../helpers/enviarMensajeWhatsapp.js';

const codigos = new Map(); // temporal, ideal usar Redis

export const enviarCodigoWhatsapp = async (req, res) => {
  const { telefono } = req.body;
  if (!telefono) return res.status(400).json({ message: 'Teléfono requerido' });

  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  codigos.set(telefono, { codigo, creado: Date.now() });
  const telefonoSoporte = process.env.WHATSAPP_SOPORTE ;

  try {
    await enviarMensajeValidacionUsuario(telefono, codigo, telefonoSoporte);
    res.status(200).json({ message: 'Código enviado' });
  } catch (err) {
    console.error('❌ Error al enviar WhatsApp:', err);
    res.status(500).json({ message: 'No se pudo enviar el mensaje' });
  }
};

export const validarCodigoWhatsapp = async (req, res) => {
  const { telefono, codigo } = req.body;
  const registro = codigos.get(telefono);
  if (!registro || registro.codigo !== codigo) {
    return res.status(400).json({ message: 'Código inválido' });
  }
  const expirado = Date.now() - registro.creado > 10 * 60 * 1000; // 10 minutos
  if (expirado) {
    codigos.delete(telefono);
    return res.status(400).json({ message: 'Código expirado' });
  }

  codigos.delete(telefono);
  res.status(200).json({ message: 'Código verificado correctamente' });
};
