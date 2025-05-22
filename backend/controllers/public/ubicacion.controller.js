import { Provincia, Localidad } from '../../models/index.js';
import { Op } from 'sequelize';
import cache from '../../utils/cache.js';

export const listarProvincias = async (req, res, next) => {
  try {
    const cacheKey = 'provincias';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const provincias = await Provincia.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']],
    });

    cache.set(cacheKey, provincias);
    res.json(provincias);
  } catch (error) {
    console.error("❌ Error en listarProvincias:", error);
    next(error);
  }
};

export const listarLocalidadesPorProvincia = async (req, res, next) => {
  try {
    const { provinciaId } = req.params;
    if (!provinciaId || isNaN(provinciaId)) {
      return res.status(400).json({ error: 'Provincia inválida' });
    }

    const localidades = await Localidad.findAll({
      where: { provinciaId },
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']],
    });
    res.json(localidades);
  } catch (error) {
    console.error("❌ Error en listarLocalidadesPorProvincia:", error);
    next(error);
  }
};

export const listarLocalidadesPorProvinciaInput = async (req, res, next) => {
  try {
    const { q, provinciaId } = req.query;

    if (!provinciaId || isNaN(provinciaId) || !q) {
      return res.status(400).json({ error: 'Faltan parámetros provinciaId o q' });
    }

    const localidades = await Localidad.findAll({
      where: {
        nombre: { [Op.like]: `%${q}%` },
        provinciaId: Number(provinciaId),
      },
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']],
    });

    res.json(localidades);
  } catch (error) {
    console.error("❌ Error en listarLocalidadesPorProvinciaInput:", error);
    next(error);
  }
};

export const listarUbicaciones = async (req, res, next) => {
  try {
    const localidades = await Localidad.findAll({
      attributes: ['id', 'nombre', 'codigoPostal', 'provinciaId'],
      order: [['nombre', 'ASC']],
    });

    const ubicaciones = localidades.map(loc => ({
      id: loc.id,
      nombre: loc.nombre,
      codigoPostal: loc.codigoPostal,
      localidadId: loc.id,
      provinciaId: loc.provinciaId,
    }));

    res.json(ubicaciones);
  } catch (error) {
    console.error("❌ Error al listar ubicaciones:", error);
    next(error);
  }
};
