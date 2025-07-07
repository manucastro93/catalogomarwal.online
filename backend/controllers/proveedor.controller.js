import { Proveedor } from '../models/index.js';
import { Op } from 'sequelize';

export const listarProveedores = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      orden = 'createdAt',
      direccion = 'DESC',
      buscar = '',
      provincia, // ahora por texto
      localidad  // ahora por texto
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { email: { [Op.like]: `%${buscar}%` } },
        { nroDoc: { [Op.like]: `%${buscar}%` } }
      ];
    }

    if (provincia) {
      where.provincia = { [Op.like]: `%${provincia}%` };
    }

    if (localidad) {
      where.localidad = { [Op.like]: `%${localidad}%` };
    }

    const { count, rows } = await Proveedor.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[orden, direccion]]
    });

    res.json({
      data: rows,
      total: count,
      pagina: Number(page),
      totalPaginas: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error('❌ Error al listar proveedores:', err);
    res.status(500).json({ message: 'Error al obtener proveedores' });
  }
};
