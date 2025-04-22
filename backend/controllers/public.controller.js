import { Producto, Categoria, ImagenProducto, Provincia, Localidad, Banner, IpCliente, Cliente, Usuario, Pedido, DetallePedido } from '../models/index.js';
import { Op, Sequelize } from 'sequelize';
import { getClientIp } from '../utils/getClientIp.js';
import cache from '../utils/cache.js';

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

    const cacheKey = `productos_${page}_${limit}_${orden}_${direccion}_${buscar}_${categoria}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

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
          ? { where: { nombre: categoria, estado: true } }
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
    res.json(response);
  } catch (error) {
    console.error("❌ Error en listarProductosPublicos:", error);
    next(error);
  }
};

export const listarCategorias = async (req, res, next) => {
  try {
    const cacheKey = 'categoriasPublicas';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const categorias = await Categoria.findAll({
      attributes: [
        'id',
        'nombre',
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
      distinct: true
    });

    cache.set(cacheKey, categorias);
    res.json(categorias);
  } catch (error) {
    console.error("❌ Error en listarCategorias:", error);
    next(error);
  }
};

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

export const listarBanners = async (req, res, next) => {
  try {
    const cacheKey = 'bannersActivos';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const banners = await Banner.findAll({
      where: {
        fechaInicio: { [Op.lte]: new Date() },
        fechaFin: { [Op.gte]: new Date() },
      },
      order: [['orden', 'ASC']],
    });

    cache.set(cacheKey, banners);
    res.json(banners);
  } catch (error) {
    next(error);
  }
};

export const obtenerClientePorIp = async (req, res, next) => {
  try {
    const ip = getClientIp(req);

    // Buscar primero uno que tenga clienteId asignado
    let registro = await IpCliente.findOne({
      where: { ip, clienteId: { [Op.ne]: null } },
      order: [['createdAt', 'DESC']], // opcional
    });
    // Si no existe uno con cliente asignado, buscar cualquier otro
    if (!registro) {
      registro = await IpCliente.findOne({ where: { ip } });
    }

    // Si no existe ningún registro, crear uno vacío
    if (!registro) {
      registro = await IpCliente.create({ ip, clienteId: null });
      console.log(`🆕 IP registrada sin cliente: ${ip}`);
      return res.status(200).json({});
    }

    // Si ya tiene cliente asociado
    if (registro.clienteId) {
      return res.json({ clienteId: registro.clienteId });
    }

    // Existe pero sin cliente asignado
    return res.status(200).json({});
  } catch (error) {
    console.error('❌ Error al buscar cliente por IP:', error);
    next(error);
  }
};

export const obtenerClientePorId = async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id, {
      include: [
        { model: Provincia, as: 'provincia' },
        { model: Localidad, as: 'localidad' },
        { model: Usuario, as: 'vendedor' },
      ],
    });

    if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.json(cliente);
  } catch (error) {
    console.error('❌ Error al obtener cliente por ID:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const obtenerPedidosClientePorId = async (req, res, next) => {
  try {
    const ip = getClientIp(req);

    // Buscar todos los registros con esa IP y clienteId válido
    const registros = await IpCliente.findAll({
      where: {
        ip,
        clienteId: { [Op.ne]: null }
      }
    });

    const clienteIds = registros.map((r) => r.clienteId).filter(Boolean);

    if (clienteIds.length === 0) {
      return res.status(200).json([]); // No hay clientes asociados
    }

    const pedidos = await Pedido.findAll({
      where: {
        clienteId: { [Op.in]: clienteIds },
      },
      include: [
        { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto',
                                                            include: [{ model: ImagenProducto, as: 'Imagenes' }] }] },
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(pedidos);
  } catch (error) {
    console.error('❌ Error en obtenerPedidosClientePorId:', error);
    next(error);
  }
};
