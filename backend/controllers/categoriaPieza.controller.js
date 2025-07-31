import { CategoriaPieza, Rubro } from '../models/index.js';
import { Op } from 'sequelize';

export const obtenerCategoriasPiezas = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, buscar = '', rubroId } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (buscar) {
      where.nombre = { [Op.like]: `%${buscar}%` };
    }
    if (rubroId) {
      where.rubroId = rubroId;
    }

    const { count, rows } = await CategoriaPieza.findAndCountAll({
      where,
      offset,
      limit: Number(limit),
      order: [['nombre', 'ASC']],
      include: [
        {
          model: Rubro,
          as: 'rubro',
          attributes: ['id', 'nombre']
        }
      ]
    });

    res.json({
      data: rows,
      pagina: Number(page),
      totalPaginas: Math.ceil(count / limit),
      totalItems: count,
      hasNextPage: Number(page) < Math.ceil(count / limit),
      hasPrevPage: Number(page) > 1,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerCategoriaPiezaPorId = async (req, res, next) => {
  try {
    const categoria = await CategoriaPieza.findByPk(req.params.id, {
      include: [
        {
          model: Rubro,
          as: 'rubro',
          attributes: ['id', 'nombre']
        }
      ]
    });
    if (!categoria) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    res.json(categoria);
  } catch (error) {
    next(error);
  }
};

export const crearCategoriaPieza = async (req, res, next) => {
  try {
    const nuevaCategoria = await CategoriaPieza.create(req.body);
    res.status(201).json(nuevaCategoria);
  } catch (error) {
    next(error);
  }
};

export const actualizarCategoriaPieza = async (req, res, next) => {
  try {
    const categoria = await CategoriaPieza.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    await categoria.update(req.body);
    res.json(categoria);
  } catch (error) {
    next(error);
  }
};

export const eliminarCategoriaPieza = async (req, res, next) => {
  try {
    const categoria = await CategoriaPieza.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    await categoria.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
