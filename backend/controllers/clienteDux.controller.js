import { ClienteDux } from '../models/index.js';
import { Op } from 'sequelize';

export const listarClientesDux = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      orden = 'fechaCreacion',
      direccion = 'DESC',
      buscar = '',
      provincia,
      localidad,
      vendedor,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // 🔍 Filtro por texto libre
    if (buscar) {
      where[Op.or] = [
        { cliente: { [Op.like]: `%${buscar}%` } },
        { cuitCuil: { [Op.like]: `%${buscar}%` } },
        { vendedor: { [Op.like]: `%${buscar}%` } },
        { correoElectronico: { [Op.like]: `%${buscar}%` } },
      ];
    }

    // 🔍 Filtros específicos opcionales
    if (provincia) where.provincia = provincia;
    if (localidad) where.localidad = localidad;
    if (vendedor) where.vendedor = vendedor;

    const { count, rows } = await ClienteDux.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[orden, direccion.toUpperCase()]],
    });

    res.json({
      data: rows,
      total: count,
      pagina: Number(page),
      totalPaginas: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('❌ Error al listar clientes Dux:', err);
    res.status(500).json({ message: 'Error al obtener clientes Dux' });
  }
};
