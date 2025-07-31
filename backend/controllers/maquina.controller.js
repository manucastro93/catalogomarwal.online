import { Maquina, Rubro } from '../models/index.js';
import { Op } from 'sequelize';

export const obtenerMaquinas = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, buscar = '', rubroId } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (buscar) {
      where[Op.or] = [
        { codigo: { [Op.like]: `%${buscar}%` } },
        { nombre: { [Op.like]: `%${buscar}%` } }
      ];
    }
    if (rubroId) {
      where.rubroId = rubroId;
    }

    const { count, rows } = await Maquina.findAndCountAll({
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

export const obtenerMaquinaPorId = async (req, res, next) => {
  try {
    const maquina = await Maquina.findByPk(req.params.id, {
      include: [
        {
          model: Rubro,
          as: 'rubro',
          attributes: ['id', 'nombre']
        }
      ]
    });
    if (!maquina) return res.status(404).json({ mensaje: 'Máquina no encontrada' });
    res.json(maquina);
  } catch (error) {
    next(error);
  }
};

export const crearMaquina = async (req, res, next) => {
  try {
    const nuevaMaquina = await Maquina.create(req.body);
    res.status(201).json(nuevaMaquina);
  } catch (error) {
    next(error);
  }
};

export const actualizarMaquina = async (req, res, next) => {
  try {
    const maquina = await Maquina.findByPk(req.params.id);
    if (!maquina) return res.status(404).json({ mensaje: 'Máquina no encontrada' });
    await maquina.update(req.body);
    res.json(maquina);
  } catch (error) {
    next(error);
  }
};

export const eliminarMaquina = async (req, res, next) => {
  try {
    const maquina = await Maquina.findByPk(req.params.id);
    if (!maquina) return res.status(404).json({ mensaje: 'Máquina no encontrada' });
    await maquina.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
