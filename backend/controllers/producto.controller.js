import { Producto, Categoria, ImagenProducto } from '../models/index.js';
import { Op } from 'sequelize';
import { leerExcelProductos } from '../utils/leerExcel.js';

export const obtenerProductos = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      orden = 'sku',
      direccion = 'ASC',
      buscar = '',
      categoriaId,
    } = req.query;

    const offset = (page - 1) * limit;

    const where = {};

    if (buscar) {
      where.nombre = { [Op.like]: `%${buscar}%` };
    }

    if (categoriaId) {
      where.categoriaId = categoriaId;
    }

    const { count, rows } = await Producto.findAndCountAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [[orden, direccion.toUpperCase()]],
      include: [
        {
          model: Categoria,
          as: 'Categoria',
          attributes: ['id', 'nombre'],
        },
        {
          model: ImagenProducto,
          as: 'Imagenes',
          attributes: ['id', 'url'],
          required: false,
        },
      ],
    });

    return res.json({
      data: rows,
      pagina: Number(page),
      totalPaginas: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerProductoPorId = async (req, res, next) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [
        {
          model: Categoria,
          as: 'Categoria',
          attributes: ['id', 'nombre'],
        },
        {
          model: ImagenProducto,
          as: 'Imagenes',
          attributes: ['id', 'url'],
          required: false,
        },
      ],
    });

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    return res.json(producto);
  } catch (error) {
    next(error);
  }
};

export const crearProducto = async (req, res, next) => {
  try {
    const producto = await Producto.create(req.body);
    res.status(201).json(producto);
  } catch (error) {
    next(error);
  }
};

export const crearProductoConImagenes = async (req, res, next) => {
  try {
    const {
      sku,
      nombre,
      descripcion,
      hayStock,
      precioUnitario,
      precioPorBulto,
      unidadPorBulto,
      categoriaId,
    } = req.body;

    const producto = await Producto.create({
      sku,
      nombre,
      descripcion,
      hayStock: hayStock === 'true',
      precioUnitario,
      precioPorBulto,
      unidadPorBulto,
      categoriaId,
    });

    if (req.files && req.files.length > 0) {
      const imagenes = req.files.map((file) => ({
        url: `/uploads/productos/${file.filename}`,
        productoId: producto.id,
      }));
      await ImagenProducto.bulkCreate(imagenes);
    }

    res.json({ producto });
  } catch (error) {
    next(error);
  }
};

export const actualizarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByPk(id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });

    await producto.update(req.body);
    res.json(producto);
  } catch (error) {
    next(error);
  }
};

export const actualizarProductoConImagenes = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      sku,
      nombre,
      descripcion,
      hayStock,
      precioUnitario,
      precioPorBulto,
      unidadPorBulto,
      categoriaId,
    } = req.body;

    const producto = await Producto.findByPk(id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    await producto.update({
      sku,
      nombre,
      descripcion,
      hayStock: hayStock === 'true',
      precioUnitario,
      precioPorBulto,
      unidadPorBulto,
      categoriaId,
    });

    if (req.files?.length) {
      const imagenes = req.files.map((file) => ({
        url: `/uploads/productos/${file.filename}`,
        productoId: producto.id,
      }));
      await ImagenProducto.bulkCreate(imagenes);
    }

    res.json({ producto });
  } catch (error) {
    next(error);
  }
};

export const eliminarProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findByPk(id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });

    await producto.destroy();
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

export const eliminarImagenProducto = async (req, res, next) => {
  try {
    const imagen = await ImagenProducto.findByPk(req.params.id);
    if (!imagen) return res.status(404).json({ error: 'Imagen no encontrada' });

    await imagen.destroy();
    res.json({ mensaje: 'Imagen eliminada' });
  } catch (error) {
    next(error);
  }
};

export const importarProductosDesdeExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió archivo' });
    }

    const filas = leerExcelProductos(req.file.path);

    const productosCreados = [];

    for (const fila of filas) {
      const {
        sku,
        nombre,
        descripcion,
        hayStock,
        precioUnitario,
        precioPorBulto,
        unidadPorBulto,
        categoria, // ← ahora recibimos nombre de categoría
      } = fila;

      if (!sku || isNaN(precioUnitario)) continue;

      const yaExiste = await Producto.findOne({ where: { sku } });
      if (yaExiste) continue;

      // Buscar categoría por nombre
      let categoriaExistente = await Categoria.findOne({
        where: { nombre: categoria },
        paranoid: false,
      });

      // Si está eliminada, restaurar
      if (categoriaExistente?.deletedAt) {
        await categoriaExistente.restore();
      }

      // Si no existe, crearla
      if (!categoriaExistente) {
        categoriaExistente = await Categoria.create({
          nombre: categoria,
          estado: true,
        });
      }

      const producto = await Producto.create({
        sku,
        nombre,
        descripcion,
        hayStock: hayStock === 'Sí',
        precioUnitario,
        precioPorBulto,
        unidadPorBulto,
        categoriaId: categoriaExistente.id,
      });

      productosCreados.push(producto);
    }

    res.json({
      mensaje: `${productosCreados.length} productos importados correctamente`,
      productos: productosCreados,
    });
  } catch (error) {
    next(error);
  }
};
