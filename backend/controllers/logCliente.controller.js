import { LogCliente, IpCliente } from '../models/index.js';

export const registrarLog = async (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    const { clienteId, ...resto } = req.body;

    // Buscar o crear IpCliente
    const [ipCliente] = await IpCliente.findOrCreate({
      where: { ip, clienteId: clienteId || null },
      defaults: { ip, clienteId: clienteId || null },
    });

    const nuevoLog = await LogCliente.create({
      ...resto,
      ipClienteId: ipCliente.id,
    });

    res.status(201).json({ message: 'Log registrado correctamente', log: nuevoLog });
  } catch (error) {
    console.error('❌ Error al registrar log:', error);
    next(error);
  }
};
