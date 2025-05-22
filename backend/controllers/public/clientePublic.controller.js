import { Cliente, Provincia, Localidad, Usuario, LogCliente, IpCliente } from '../../models/index.js';
import { getClientIp } from '../../utils/getClientIp.js';

export const registrarLogPublico = async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    const {
      categoriaId = null,
      busqueda = null,
      tiempoEnPantalla = null,
      ubicacion = null,
      sesion = null,
      referer = null,
      fuente = null,
    } = req.body;

    let ipCliente = await IpCliente.findOne({ where: { ip } });
    if (!ipCliente) ipCliente = await IpCliente.create({ ip });

    if (!busqueda && !categoriaId && !ubicacion) {
      return res.status(400).json({ message: 'Faltan datos relevantes para registrar log' });
    }

    const log = await LogCliente.create({
      ipClienteId: ipCliente.id,
      categoriaId,
      busqueda,
      tiempoEnPantalla,
      ubicacion,
      sesion,
      referer,
      fuente,
    });

    res.status(201).json({ message: 'Log registrado', log });
  } catch (error) {
    console.error('❌ Error al registrar log público:', error);
    next(error);
  }
};

export const obtenerClientePorIp = async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    const registro = await IpCliente.findOne({ where: { ip } });
    if (registro?.clienteId) return res.json({ clienteId: registro.clienteId });
    res.status(200).json({});
  } catch (error) {
    next(error);
  }
};

export const obtenerClientePorId = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id, {
      include: [
        { model: Provincia, as: 'provincia' },
        { model: Localidad, as: 'localidad' },
        { model: Usuario, as: 'vendedor' },
      ],
    });
    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (error) {
    next(error);
  }
};
