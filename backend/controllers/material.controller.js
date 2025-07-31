import { Material, Rubro } from '../models/index.js';
import { Op } from 'sequelize';

export const obtenerMateriales = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, buscar = '', rubroId } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (buscar) {
      where[Op.or] = [
        { codigo: { [Op.like]: `%${buscar}%` } },
        { descripcion: { [Op.like]: `%${buscar}%` } }
      ];
    }
    if (rubroId) {
      where.rubroId = rubroId;
    }

    const { count, rows } = await Material.findAndCountAll({
      where,
      offset,
      limit: Number(limit),
      order: [['codigo', 'ASC']],
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

export const obtenerMaterialPorId = async (req, res, next) => {
  try {
    const material = await Material.findByPk(req.params.id, {
      include: [
        {
          model: Rubro,
          as: 'rubro',
          attributes: ['id', 'nombre']
        }
      ]
    });
    if (!material) return res.status(404).json({ mensaje: 'Material no encontrado' });
    res.json(material);
  } catch (error) {
    next(error);
  }
};

export const crearMaterial = async (req, res, next) => {
  try {
    const nuevoMaterial = await Material.create(req.body);
    res.status(201).json(nuevoMaterial);
  } catch (error) {
    next(error);
  }
};

export const actualizarMaterial = async (req, res, next) => {
  try {
    const material = await Material.findByPk(req.params.id);
    if (!material) return res.status(404).json({ mensaje: 'Material no encontrado' });
    await material.update(req.body);
    res.json(material);
  } catch (error) {
    next(error);
  }
};

export const eliminarMaterial = async (req, res, next) => {
  try {
    const material = await Material.findByPk(req.params.id);
    if (!material) return res.status(404).json({ mensaje: 'Material no encontrado' });
    await material.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
