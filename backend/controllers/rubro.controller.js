import { Rubro } from '../models/index.js';
import { Op } from 'sequelize';

export const obtenerRubros = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, buscar = '' } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (buscar) {
      where.nombre = { [Op.like]: `%${buscar}%` };
    }

    const { count, rows } = await Rubro.findAndCountAll({
      where,
      offset,
      limit: Number(limit),
      order: [['nombre', 'ASC']],
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

export const obtenerRubroPorId = async (req, res, next) => {
  try {
    const rubro = await Rubro.findByPk(req.params.id);
    if (!rubro) return res.status(404).json({ mensaje: 'Rubro no encontrado' });
    res.json(rubro);
  } catch (error) {
    next(error);
  }
};

export const crearRubro = async (req, res, next) => {
  try {
    const nuevoRubro = await Rubro.create(req.body);
    res.status(201).json(nuevoRubro);
  } catch (error) {
    next(error);
  }
};

export const actualizarRubro = async (req, res, next) => {
  try {
    const rubro = await Rubro.findByPk(req.params.id);
    if (!rubro) return res.status(404).json({ mensaje: 'Rubro no encontrado' });
    await rubro.update(req.body);
    res.json(rubro);
  } catch (error) {
    next(error);
  }
};

export const eliminarRubro = async (req, res, next) => {
  try {
    const rubro = await Rubro.findByPk(req.params.id);
    if (!rubro) return res.status(404).json({ mensaje: 'Rubro no encontrado' });
    await rubro.destroy(); // Paranoid: borra lógicamente
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
