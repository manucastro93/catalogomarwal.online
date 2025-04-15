import { Cliente, Provincia, Localidad, Usuario } from '../models/index.js';
import { Op } from 'sequelize';
import { validationResult } from 'express-validator';

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

    // Búsqueda por nombre o email
    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { email: { [Op.like]: `%${buscar}%` } },
      ];
    }

        // 🔒 Si es vendedor, solo sus clientes
        if (req.usuario?.rol === 'vendedor') {
          where.vendedorId = req.usuario.id;
        }

    // Filtros por ubicación
    if (provinciaId) {
      where.provinciaId = provinciaId;
    }

    if (localidadId) {
      where.localidadId = localidadId;
    }

    if (vendedorId) {
      where.vendedorId = vendedorId;
    }


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
    // Validaciones de express-validator
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        mensaje: 'Error de validación',
        errores: errores.array(),
      });
    }

    const {
      nombre,
      telefono,
      email,
      razonSocial,
      direccion,
      provinciaId,
      localidadId,
      cuit_cuil,
    } = req.body;

    // Validaciones manuales (si no usás express-validator)
    if (!nombre || !telefono || !email || !direccion || !cuit_cuil) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    // Validación de provincia/localidad (opcionales)
    if (provinciaId) {
      const provincia = await Provincia.findByPk(provinciaId);
      if (!provincia) return res.status(400).json({ mensaje: 'Provincia no encontrada' });
    }

    if (localidadId) {
      const localidad = await Localidad.findByPk(localidadId);
      if (!localidad) return res.status(400).json({ mensaje: 'Localidad no encontrada' });
    }

    const nuevo = await Cliente.create({
      nombre,
      telefono,
      email,
      razonSocial,
      direccion,
      provinciaId: provinciaId || null,
      localidadId: localidadId || null,
      cuit_cuil,
      vendedorId: req.usuario?.id || null,
    });

    res.status(201).json(nuevo);
  } catch (error) {
    next(error); // Pasamos al middleware centralizado
  }
};

export const actualizarCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Cliente.update(req.body, { where: { id } });
    const actualizado = await Cliente.findByPk(id);
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
