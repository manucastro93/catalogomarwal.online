import { Producto, Categoria, ImagenProducto, Provincia, Localidad, Banner, IpCliente } from '../models/index.js';
import { Op } from 'sequelize';

export const listarProductosPublicos = async (req, res, next) => {
  try {
    const productos = await Producto.findAll({
      include: [Categoria, ImagenProducto],
      order: [['sku', 'ASC']],
    });
    res.json(productos);
  } catch (error) {
    next(error);
  }
};

export const listarCategorias = async (req, res, next) => {
  try {
    const categorias = await Categoria.findAll({ order: [['orden', 'ASC']] });
    res.json(categorias);
  } catch (error) {
    next(error);
  }
};

export const listarProvincias = async (req, res, next) => {
    try {
    const provincias = await Provincia.findAll({
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']],
    });
    res.json(provincias);
  } catch (error) {
    next(error);
  }
};

export const listarLocalidadesPorProvincia = async (req, res, next) => {
  try {
    const { provinciaId } = req.params;
    const localidades = await Localidad.findAll({
      where: { provinciaId },
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']],
    });
    res.json(localidades);
  } catch (error) {
    next(error);
  }
};

export const listarLocalidadesPorProvinciaInput = async (req, res, next) => {
  try {
    const { q, provinciaId } = req.query;

    if (!provinciaId || !q) {
      return res.status(400).json({ error: 'Faltan parámetros provinciaId o q' });
    }

    const localidades = await Localidad.findAll({
      where: {
        nombre: { [Op.like]: `%${q}%` },
        provinciaId: provinciaId,
      },
      attributes: ['id', 'nombre'],
      order: [['nombre', 'ASC']],
    });

    res.json(localidades);
  } catch (error) {
    next(error);
  }
};

export const listarBanners = async (req, res, next) => {
  try {
    const banners = await Banner.findAll({
      where: {
        fechaInicio: { [Op.lte]: new Date() },
        fechaFin: { [Op.gte]: new Date() },
      },
      order: [['orden', 'ASC']],
    });
    res.json(banners);
  } catch (error) {
    next(error);
  }
};

export const obtenerClientePorIp = async (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;

    const registro = await IpCliente.findOne({ where: { ip } });

    if (!registro) {
      return res.status(404).json({ message: 'IP no asociada a ningún cliente' });
    }
    res.json({ clienteId: registro.clienteId });
  } catch (error) {
    console.error('❌ Error al buscar cliente por IP:', error);
    next(error);
  }
};
