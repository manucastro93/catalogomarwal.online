import { Producto, Categoria, ImagenProducto } from '@/models';
import { estadoSync } from '@/state/estadoSync';
import { Op, Sequelize } from 'sequelize';
import cache from '@/utils/cache';

export const listarProductosPublicos = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      orden = 'createdAt',
      direccion = 'DESC',
      buscar = '',
      categoria,
    } = req.query;

    const ultimaActualizacion = estadoSync.ultimaActualizacionProductos || 'v1';
    const cacheKey = `productos_${ultimaActualizacion}_${page}_${limit}_${orden}_${direccion}_${buscar}_${categoria}`;

    const cached = cache.get(cacheKey);
    if (cached) return reson(cached);

    const offset = (page - 1) * limit;
    const direccionValidada = ['ASC', 'DESC'].includes(direccion.toUpperCase()) ? direccion.toUpperCase() : 'DESC';

    const where = { activo: true };
    if (buscar) where.nombre = { [Op.like]: `%${buscar}%` };

    const include = [
      {
        model: Categoria,
        as: 'Categoria',
        attributes: ['id', 'nombre'],
        ...(categoria && categoria !== 'Todas'
          ? {
            where: {
              estado: true,
              [Op.or]: [
                { nombre: categoria },
                { nombreWeb: categoria }
              ]
            }
          }
          : {}),
      },
      {
        model: ImagenProducto,
        as: 'Imagenes',
        attributes: ['id', 'url', 'orden'],
        required: true,
      },
    ];


    const { count, rows } = await Producto.findAndCountAll({
      where,
      include,
      limit: Number(limit),
      offset,
      order: [
        [orden, direccionValidada],
        [{ model: ImagenProducto, as: 'Imagenes' }, 'orden', 'ASC'],
      ],
      distinct: true,
    });

    const response = {
      data: rows,
      pagina: Number(page),
      totalPaginas: Math.ceil(count / limit),
      totalItems: count,
      hasNextPage: Number(page) < Math.ceil(count / limit),
      hasPrevPage: Number(page) > 1,
    };

    cache.set(cacheKey, response);
    reson(response);
  } catch (error) {
    console.error("❌ Error en listarProductosPublicos:", error);
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
        },
      ],
      order: [[{ model: ImagenProducto, as: 'Imagenes' }, 'orden', 'ASC']],
    });

    if (!producto) {
      return res.status(404)on({ mensaje: 'Producto no encontrado' });
    }

    return reson(producto);
  } catch (error) {
    console.error('❌ Error en obtenerProductoPorId:', error);
    next(error);
  }
};

export const listarCategorias = async (req, res, next) => {
  try {
    const version = estadoSync.ultimaActualizacionProductos || 'v1';
    const cacheKey = `categoriasPublicas_${version}`;
    const cached = cache.get(cacheKey);
    if (cached) return reson(cached);

    const categorias = await Categoria.findAll({
      attributes: [
        'id',
        'nombre',
        'nombreWeb',
        [Sequelize.fn('COUNT', Sequelize.col('Productos.id')), 'cantidadProductos']
      ],
      where: { estado: true },
      include: [
        {
          model: Producto,
          as: 'Productos',
          required: true,
          attributes: [],
          where: { activo: true },
          include: [{ model: ImagenProducto, as: 'Imagenes', required: true, attributes: [] }],
        },
      ],
      group: ['Categoria.id'],
      order: [['orden', 'ASC']],
      subQuery: false,
      distinct: true,
    });

    cache.set(cacheKey, categorias);
    reson(categorias);
  } catch (error) {
    console.error("❌ Error en listarCategorias:", error);
    next(error);
  }
};
