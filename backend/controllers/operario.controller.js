import { Operario, Rubro } from '../models/index.js';
import { Op } from 'sequelize';

export const obtenerOperarios = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, buscar = '', rubroId } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (buscar) {
      where[Op.or] = [
        { codigo: { [Op.like]: `%${buscar}%` } },
        { nombre: { [Op.like]: `%${buscar}%` } },
        { apellido: { [Op.like]: `%${buscar}%` } }
      ];
    }
    if (rubroId) {
      where.rubroId = rubroId;
    }

    const { count, rows } = await Operario.findAndCountAll({
      where,
      offset,
      limit: Number(limit),
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
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

export const obtenerOperarioPorId = async (req, res, next) => {
  try {
    const operario = await Operario.findByPk(req.params.id, {
      include: [
        {
          model: Rubro,
          as: 'rubro',
          attributes: ['id', 'nombre']
        }
      ]
    });
    if (!operario) return res.status(404).json({ mensaje: 'Operario no encontrado' });
    res.json(operario);
  } catch (error) {
    next(error);
  }
};

export const crearOperario = async (req, res, next) => {
  try {
    const nuevoOperario = await Operario.create(req.body);
    res.status(201).json(nuevoOperario);
  } catch (error) {
    next(error);
  }
};

export const actualizarOperario = async (req, res, next) => {
  try {
    const operario = await Operario.findByPk(req.params.id);
    if (!operario) return res.status(404).json({ mensaje: 'Operario no encontrado' });
    await operario.update(req.body);
    res.json(operario);
  } catch (error) {
    next(error);
  }
};

export const eliminarOperario = async (req, res, next) => {
  try {
    const operario = await Operario.findByPk(req.params.id);
    if (!operario) return res.status(404).json({ mensaje: 'Operario no encontrado' });
    await operario.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
