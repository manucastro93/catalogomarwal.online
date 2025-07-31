import { Pieza, Rubro, Material, CategoriaPieza } from '../models/index.js';
import { Op } from 'sequelize';

export const obtenerPiezas = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      buscar = '', 
      rubroId, 
      materialId, 
      categoriaId 
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (buscar) {
      where[Op.or] = [
        { codigo: { [Op.like]: `%${buscar}%` } },
        { descripcion: { [Op.like]: `%${buscar}%` } }
      ];
    }
    if (rubroId) where.rubroId = rubroId;
    if (materialId) where.material = materialId;
    if (categoriaId) where.categoria = categoriaId;

    const { count, rows } = await Pieza.findAndCountAll({
      where,
      offset,
      limit: Number(limit),
      order: [['codigo', 'ASC']],
      include: [
        {
          model: Rubro,
          as: 'rubro',
          attributes: ['id', 'nombre']
        },
        {
          model: Material,
          as: 'materialObj',
          attributes: ['id', 'codigo', 'descripcion']
        },
        {
          model: CategoriaPieza,
          as: 'categoriaPieza',
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

export const obtenerPiezaPorId = async (req, res, next) => {
  try {
    const pieza = await Pieza.findByPk(req.params.id, {
      include: [
        {
          model: Rubro,
          as: 'rubro',
          attributes: ['id', 'nombre']
        },
        {
          model: Material,
          as: 'materialObj',
          attributes: ['id', 'codigo', 'descripcion']
        },
        {
          model: CategoriaPieza,
          as: 'categoriaPieza',
          attributes: ['id', 'nombre']
        }
      ]
    });
    if (!pieza) return res.status(404).json({ mensaje: 'Pieza no encontrada' });
    res.json(pieza);
  } catch (error) {
    next(error);
  }
};

export const crearPieza = async (req, res, next) => {
  try {
    const nuevaPieza = await Pieza.create(req.body);
    res.status(201).json(nuevaPieza);
  } catch (error) {
    next(error);
  }
};

export const actualizarPieza = async (req, res, next) => {
  try {
    const pieza = await Pieza.findByPk(req.params.id);
    if (!pieza) return res.status(404).json({ mensaje: 'Pieza no encontrada' });
    await pieza.update(req.body);
    res.json(pieza);
  } catch (error) {
    next(error);
  }
};

export const eliminarPieza = async (req, res, next) => {
  try {
    const pieza = await Pieza.findByPk(req.params.id);
    if (!pieza) return res.status(404).json({ mensaje: 'Pieza no encontrada' });
    await pieza.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
