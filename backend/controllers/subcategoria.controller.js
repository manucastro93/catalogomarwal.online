import { Subcategoria } from '../models/index.js';
import Sequelize from 'sequelize';

export const listarSubcategorias = async (req, res) => {
  try {
    const { page = 1, limit = 10, buscar = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (buscar) {
      where.nombre = { [Sequelize.Op.like]: `%${buscar}%` };
    }

    const { count, rows } = await Subcategoria.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['orden', 'ASC']],
    });

    const totalPaginas = Math.ceil(count / limit);
    res.json({
      data: rows,
      pagina: Number(page),
      totalPaginas,
      totalItems: count,
      hasNextPage: Number(page) < totalPaginas,
      hasPrevPage: Number(page) > 1,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al listar las subcategorías' });
  }
};
