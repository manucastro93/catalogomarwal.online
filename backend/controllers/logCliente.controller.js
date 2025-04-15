import { LogCliente, IpCliente } from '../models/index.js';
import { getClientIp } from '../utils/getClientIp.js';

export const registrarLog = async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    // Detectar fuente
      const referer = req.headers.referer || '';
      const userAgent = req.headers['user-agent'] || '';

      let fuente = 'desconocida';

      if (referer.includes('whatsapp.com') || referer.includes('wa.me')) {
        fuente = 'whatsapp';
      } else if (userAgent.toLowerCase().includes('whatsapp')) {
        fuente = 'whatsapp';
      } else if (referer.includes('instagram.com')) {
        fuente = 'instagram';
      } else if (referer.includes('facebook.com')) {
        fuente = 'facebook';
      } else if (referer.includes('google.')) {
        fuente = 'google';
      } else if (!referer) {
        fuente = 'directo';
      }

    const { clienteId, ...resto } = req.body;

    // Buscar o crear IpCliente
    const [ipCliente] = await IpCliente.findOrCreate({
      where: { ip, clienteId: clienteId || null },
      defaults: { ip, clienteId: clienteId || null },
    });

    const nuevoLog = await LogCliente.create({
      ...resto,
      ipClienteId: ipCliente.id,
      referer,
      fuente, // ✅ se guarda la fuente detectada
    });

    res.status(201).json({ message: 'Log registrado correctamente', log: nuevoLog });
  } catch (error) {
    console.error('❌ Error al registrar log:', error);
    next(error);
  }
};
