import { Producto, Categoria, ImagenProducto, ListaPrecioProducto } from '../models/index.js';
import { Op, Sequelize } from 'sequelize';
import { leerExcelProductos } from '../utils/leerExcel.js';
import cache from '../utils/cache.js';
import { crearAuditoria } from '../utils/auditoria.js';

export const obtenerProductos = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      orden = 'sku',
      direccion = 'ASC',
      buscar = '',
      categoriaId,
      listaPrecioId,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};
    const include = [
      {
        model: ImagenProducto,
        as: 'Imagenes',
        required: false,
        attributes: ['id', 'url', 'orden'],
        separate: true,
        order: [['orden', 'ASC']],
      }
    ];
    
    if (buscar) {
      include.push({
        model: Categoria,
        as: 'Categoria',
        required: false,
        where: {
          nombre: { [Op.like]: `%${buscar}%` },
        },
      });
    
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { sku: { [Op.like]: `%${buscar}%` } },
      ];
    } else {
      include.push({
        model: Categoria,
        as: 'Categoria',
        required: false,
      });
      if (listaPrecioId) {
        include.push({
          model: ListaPrecioProducto,
          as: 'listasPrecio',
          required: true,
          where: { listaPrecioId },
        });
      }
    }

    if (categoriaId) {
      where.categoriaId = categoriaId;
    } else {
      where.categoriaId = { [Op.notIn]: [11, 12] };
    }

    where.precioUnitario = { [Op.gt]: 0 };

    const { count, rows } = await Producto.findAndCountAll({
      where,
      include,
      offset,
      limit: Number(limit),
      order: [[orden, direccion]],
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
    console.error('❌ Error al obtener productos:', error);
    next(error);
  }
};

export const obtenerProductosProduccion = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      orden = 'sku',
      direccion = 'ASC',
      buscar = '',
      categoriaId,
      listaPrecioId,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};
    const include = [
      {
        model: ImagenProducto,
        as: 'Imagenes',
        required: false,
        attributes: ['id', 'url', 'orden'],
        separate: true,
        order: [['orden', 'ASC']],
      }
    ];
    
    if (buscar) {
      include.push({
        model: Categoria,
        as: 'Categoria',
        required: false,
        where: {
          nombre: { [Op.like]: `%${buscar}%` },
        },
      });
    
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { sku: { [Op.like]: `%${buscar}%` } },
      ];
    } else {
      include.push({
        model: Categoria,
        as: 'Categoria',
        required: false,
      });
      if (listaPrecioId) {
        include.push({
          model: ListaPrecioProducto,
          as: 'listasPrecio',
          required: true,
          where: { listaPrecioId },
        });
      }
    }

    if (categoriaId) {
      where.categoriaId = categoriaId;
    } else {
      where.categoriaId = { [Op.notIn]: [11, 12] };
    }

    const { count, rows } = await Producto.findAndCountAll({
      where,
      include,
      offset,
      limit: Number(limit),
      order: [[orden, direccion]],
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
    console.error('❌ Error al obtener productos:', error);
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
          attributes: ['id', 'url', 'orden'],
          required: false,
        },
      ],
      order: [[{ model: ImagenProducto, as: 'Imagenes' }, 'orden', 'ASC']],
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
    cache.flushAll();
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
      activo,
      precioUnitario,
      precioPorBulto,
      unidadPorBulto,
      categoriaId,
    } = req.body;

    const producto = await Producto.create({
      sku,
      nombre,
      descripcion,
      activo: activo === 'true',
      precioUnitario,
      precioPorBulto,
      unidadPorBulto,
      categoriaId,
    });

    if (req.files && req.files.length > 0) {
      const imagenes = req.files.map((file, index) => ({
        url: `/uploads/productos/${file.filename}`,
        productoId: producto.id,
        orden: index,
      }));
      await ImagenProducto.bulkCreate(imagenes);
    }
    
    await crearAuditoria({
      tabla: 'productos',
      accion: 'crea producto',
      registroId: producto.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se creó el prodcuto ${producto.nombre}`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });
    
    
    cache.flushAll();
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
    cache.flushAll();
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
      activo,
      precioUnitario,
      precioPorBulto,
      unidadPorBulto,
      categoriaId,
    } = req.body;

    const producto = await Producto.findByPk(id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    const datosAntes = { ...producto.get() };
    await producto.update({
      sku,
      nombre,
      descripcion,
      activo: activo === 'true',
      precioUnitario,
      precioPorBulto,
      unidadPorBulto,
      categoriaId,
    });

    if (req.files?.length) {
      const imagenes = req.files.map((file, index) => ({
        url: `/uploads/productos/${file.filename}`,
        productoId: producto.id,
        orden: index,
      }));
      await ImagenProducto.bulkCreate(imagenes);
    }

    await crearAuditoria({
      tabla: 'productos',
      accion: 'actualiza producto',
      registroId: producto.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se actualizó el producto ${producto.nombre}`,
      datosAntes: datosAntes,
      datosDespues: req.body,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    cache.flushAll();
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
    await crearAuditoria('productos', 'eliminar', id, req.usuario?.id || null);
    cache.flushAll();
    res.json({ message: 'Producto eliminado correctamente' });
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
        activo,
        precioUnitario,
        precioPorBulto,
        unidadPorBulto,
        categoria,
      } = fila;

      if (!sku || isNaN(precioUnitario)) continue;

      const yaExiste = await Producto.findOne({ where: { sku } });
      if (yaExiste) continue;

      let categoriaExistente = await Categoria.findOne({
        where: { nombre: categoria },
        paranoid: false,
      });

      if (categoriaExistente?.deletedAt) {
        await categoriaExistente.restore();
      }

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
        activo: activo === 'Sí',
        precioUnitario,
        precioPorBulto,
        unidadPorBulto,
        categoriaId: categoriaExistente.id,
      });

      productosCreados.push(producto);
    }
    await crearAuditoria('productos', 'importar', null, req.usuario?.id || null);
    cache.flushAll();
    res.json({
      mensaje: `${productosCreados.length} productos importados correctamente`,
      productos: productosCreados,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarOrdenImagenes = async (req, res, next) => {
  try {
    const { imagenes } = req.body;

    for (const { id, orden } of imagenes) {
      await ImagenProducto.update({ orden }, { where: { id } });
    }
    await crearAuditoria('productos', 'actualizar orden imagenes', null, req.usuario?.id || null);
    res.json({ mensaje: 'Orden actualizado correctamente' });
  } catch (error) {
    next(error);
  }
};

export const eliminarImagenProducto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const imagen = await ImagenProducto.findByPk(id);
    if (!imagen) return res.status(404).json({ message: 'Imagen no encontrada' });

    await imagen.destroy();

    await crearAuditoria({
      tabla: 'productos',
      accion: 'eliminar imagen',
      registroId: imagen.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se creó el usuario ${imagen.url}`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });
    

    res.json({ message: 'Imagen eliminada correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar imagen del producto:', error);
    next(error);
  }
};

export const obtenerProductosRelacionadosPorTexto = async (texto = '', limite = 5) => {
  const whereProducto = {
    activo: true,
    precioUnitario: { [Op.gt]: 0 },
    [Op.or]: [
      { nombre: { [Op.like]: `%${texto}%` } },
      { descripcion: { [Op.like]: `%${texto}%` } },
      { sku: { [Op.like]: `%${texto}%` } },
    ],
  };

  const include = [
    {
      model: ImagenProducto,
      as: 'Imagenes',
      required: false,
      attributes: ['id', 'url', 'orden'],
      separate: true,
      order: [['orden', 'ASC']],
    },
    {
      model: Categoria,
      as: 'Categoria',
      required: false,
      attributes: ['id', 'nombre'],
      where: {
        nombre: { [Op.like]: `%${texto}%` },
      },
    },
  ];

  const productos = await Producto.findAll({
    where: whereProducto,
    include,
    limit: Number(limite),
    order: [['precioUnitario', 'ASC']],
    distinct: true,
  });

  return productos;
};

