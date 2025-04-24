import { Cliente, Provincia, Localidad, Usuario, Pedido, DetallePedido, Producto, LogCliente, IpCliente, HistorialCliente } from '../models/index.js';
import { Op, fn, col, literal } from 'sequelize';
import { validationResult } from 'express-validator';
import { geocodificarDireccion } from '../utils/geocodificacion.js';
import { registrarHistorialCliente } from '../utils/registrarHistorialCliente.js';

export const listarClientes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      orden = 'createdAt',
      direccion = 'DESC',
      buscar = '',
      provinciaId,
      localidadId,
      vendedorId,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { email: { [Op.like]: `%${buscar}%` } },
      ];
    }

    if (req.usuario?.rol === 'vendedor') {
      where.vendedorId = req.usuario.id;
    }

    if (provinciaId) where.provinciaId = provinciaId;
    if (localidadId) where.localidadId = localidadId;
    if (vendedorId) where.vendedorId = vendedorId;

    const { count, rows } = await Cliente.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[orden, direccion]],
      include: [
        { model: Provincia, as: 'provincia' },
        { model: Localidad, as: 'localidad' },
        { model: Usuario, as: 'vendedor' },
      ],
    });

    res.json({
      data: rows,
      total: count,
      pagina: Number(page),
      totalPaginas: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('❌ Error al listar clientes:', err);
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
};

export const crearCliente = async (req, res) => {
  try { 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      nombre, telefono, email, razonSocial,
      direccion, provinciaId, localidadId, cuit_cuil
    } = req.body;
    const provinciaNombre = provinciaId ? ((await Provincia.findByPk(provinciaId))?.nombre || '').replace('-GBA', '').trim(): '';
    const localidadNombre = localidadId ? (await Localidad.findByPk(localidadId))?.nombre : '';
    const direccionCompleta = `${direccion}, ${localidadNombre}, ${provinciaNombre}, Argentina`;
    const { latitud, longitud } = await geocodificarDireccion(direccionCompleta);
    const nuevoCliente = await Cliente.create({
      nombre, telefono, email, razonSocial, direccion,
      provinciaId: provinciaId || null,
      localidadId: localidadId || null,
      cuit_cuil,
      latitud, longitud,
    });
    res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error('❌ Error al crear cliente:', error); 
    res.status(500).json({ message: 'Error al crear cliente' });
  }
};  

export const actualizarCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const anterior = await Cliente.findByPk(id);

    const {
      nombre, telefono, email, razonSocial,
      direccion, provinciaId, localidadId, cuit_cuil
    } = req.body;

    const provinciaNombre = provinciaId ? (await Provincia.findByPk(provinciaId))?.nombre : '';
    const localidadNombre = localidadId ? (await Localidad.findByPk(localidadId))?.nombre : '';
    const direccionCompleta = `${direccion}, ${localidadNombre}, ${provinciaNombre}, Argentina`;
    const { latitud, longitud } = await geocodificarDireccion(direccionCompleta);

    await Cliente.update({
      nombre, telefono, email, razonSocial, direccion,
      provinciaId: provinciaId || null,
      localidadId: localidadId || null,
      cuit_cuil,
      latitud, longitud,
    }, { where: { id } });

    const actualizado = await Cliente.findByPk(id);
    await registrarHistorialCliente(anterior, actualizado, req.usuario?.id);

    res.json(actualizado);
  } catch (error) {
    next(error);
  }
};

export const obtenerClientesConVentas = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      include: [{ model: Pedido, as: 'pedidos', attributes: [], required: false }],
      attributes: {
        include: [[fn('SUM', col('pedidos.total')), 'totalVentas']],
      },
      group: ['Cliente.id'],
    });
    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener clientes con ventas' });
  }
};

export const obtenerEstadisticasCliente = async (req, res) => {
  try {
    const { id } = req.params;

    // Total de pedidos y total facturado
    const pedidos = await Pedido.findAll({
      where: { clienteId: id },
      attributes: ['id', 'total', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    // Productos más comprados
    const productosTop = await DetallePedido.findAll({
      where: { clienteId: id },
      attributes: [
        'productoId',
        [fn('SUM', col('cantidad')), 'totalComprado'],
        [fn('SUM', col('subtotal')), 'totalGastado'],
      ],
      include: [{ model: Producto, as: 'producto', attributes: ['nombre'] }],
      group: ['productoId'],
      order: [[literal('totalComprado'), 'DESC']],
      limit: 5,
    });

    // Logs por IP
    const ips = await IpCliente.findAll({ where: { clienteId: id }, attributes: ['id'] });
    const ipIds = ips.map(ip => ip.id);

    const logs = await LogCliente.findAll({
      where: { ipClienteId: { [Op.in]: ipIds } },
      order: [['createdAt', 'DESC']],
    });

    res.json({ pedidos, productosTop, logs });
  } catch (error) {
    console.error("❌ Error en estadísticas de cliente:", error);
    res.status(500).json({ message: 'Error al obtener estadísticas del cliente' });
  }
};

export const obtenerHistorialCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await HistorialCliente.findAll({
      where: { clienteId: id },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json(historial);
  } catch (error) {
    console.error('❌ Error al obtener historial del cliente:', error);
    res.status(500).json({ message: 'Error al obtener historial del cliente' });
  }
};
