import { Cliente, Provincia, Localidad, Usuario, Pedido } from '../models/index.js';
import { Op, fn, col } from 'sequelize';
import { validationResult } from 'express-validator';
import { geocodificarDireccion } from '../utils/geocodificarDireccion.js';
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

export const crearCliente = async (req, res, next) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ mensaje: 'Error de validación', errores: errores.array() });
    }

    const {
      nombre, telefono, email, razonSocial,
      direccion, provinciaId, localidadId, cuit_cuil
    } = req.body;

    if (!nombre || !telefono || !email || !direccion || !cuit_cuil) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    if (provinciaId && !(await Provincia.findByPk(provinciaId))) {
      return res.status(400).json({ mensaje: 'Provincia no encontrada' });
    }
    if (localidadId && !(await Localidad.findByPk(localidadId))) {
      return res.status(400).json({ mensaje: 'Localidad no encontrada' });
    }

    const provinciaNombre = provinciaId ? (await Provincia.findByPk(provinciaId))?.nombre : '';
    const localidadNombre = localidadId ? (await Localidad.findByPk(localidadId))?.nombre : '';
    const direccionCompleta = `${direccion}, ${localidadNombre}, ${provinciaNombre}, Argentina`;
    const { latitud, longitud } = await geocodificarDireccion(direccionCompleta);

    const nuevo = await Cliente.create({
      nombre, telefono, email, razonSocial, direccion,
      provinciaId: provinciaId || null,
      localidadId: localidadId || null,
      cuit_cuil,
      vendedorId: req.usuario?.id || null,
      latitud, longitud,
    });

    res.status(201).json(nuevo);
  } catch (error) {
    next(error);
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

export const eliminarCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Cliente.destroy({ where: { id } });
    res.json({ mensaje: 'Cliente eliminado correctamente' });
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