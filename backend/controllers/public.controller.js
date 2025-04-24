import {
  Cliente,
  Pedido,
  DetallePedido,
  Producto,
  ImagenProducto,
  Categoria,
  Provincia,
  Localidad,
  Banner,
  Usuario,
  Pagina,
  IpCliente,
  LogCliente,
  Notificacion,
  HistorialCliente,
  IpClienteCliente
} from '../models/index.js';

import { Op, Sequelize } from 'sequelize';
import cache from '../utils/cache.js';
import { getClientIp } from '../utils/getClientIp.js';
import { geocodificarDireccion } from '../utils/geocodificacion.js';
import { vincularIpConCliente } from './ipCliente.controller.js';
import { crearClienteConGeocodificacion } from '../helpers/clientes.js';
import {
  enviarEmailEstadoEditando,
  enviarEmailReversionEditando,
  enviarEmailPedido
} from '../utils/notificaciones/email.js';
import {
  enviarWhatsappEstadoEditando,
  enviarWhatsappReversionEditando,
  enviarWhatsappPedido
} from '../utils/notificaciones/whatsapp.js';
import { crearLeadKommo } from '../services/kommo.service.js';
import { verificarProductosDelCarrito } from '../utils/validarPedido.js';
import { revertirPedidoEditando } from '../utils/revertirPedidoEditando.js';

// CLIENTE
export const registrarLogPublico = async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    const {
      categoriaId = null,
      busqueda = null,
      tiempoEnPantalla = null,
      ubicacion = null,
      sesion = null,
      referer = null,
      fuente = null,
    } = req.body;

    let ipCliente = await IpCliente.findOne({ where: { ip } });
    if (!ipCliente) ipCliente = await IpCliente.create({ ip });

    if (!busqueda && !categoriaId && !ubicacion) {
      return res.status(400).json({ message: 'Faltan datos relevantes para registrar log' });
    }

    const log = await LogCliente.create({
      ipClienteId: ipCliente.id,
      categoriaId,
      busqueda,
      tiempoEnPantalla,
      ubicacion,
      sesion,
      referer,
      fuente,
    });

    res.status(201).json({ message: 'Log registrado', log });
  } catch (error) {
    console.error('❌ Error al registrar log público:', error);
    next(error);
  }
};

export const obtenerClientePorIp = async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    const registro = await IpCliente.findOne({ where: { ip } });
    if (registro?.clienteId) return res.json({ clienteId: registro.clienteId });
    res.status(200).json({});
  } catch (error) {
    next(error);
  }
};

export const obtenerClientePorId = async (req, res, next) => {
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
    next(error);
  }
};

// PÁGINA
export const obtenerPaginaPublica = async (req, res, next) => {
  try {
    const cacheKey = 'pagina';
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    let pagina = await Pagina.findOne({ include: [{ model: Banner, as: 'Banners' }] });
    if (!pagina) pagina = await Pagina.create({ logo: '' });

    cache.set(cacheKey, pagina);
    res.json(pagina);
  } catch (error) {
    next(error);
  }
};

export const listarBanners = async (req, res, next) => {
  try {
    const now = new Date();

    const banners = await Banner.findAll({
      where: {
        [Op.or]: [
          {
            fechaInicio: { [Op.lte]: now },
            fechaFin: { [Op.gte]: now },
          },
          {
            fechaInicio: null,
            fechaFin: null,
          },
        ],
      },
      order: [['orden', 'ASC']],
    });

    res.json(banners);
  } catch (error) {
    next(error);
  }
};

// PEDIDO
export const crearOEditarPedido = async (req, res, next) => {
  try {
    const { cliente, carrito, usuarioId = null, pedidoId = null } = req.body;

    if (!cliente || !carrito?.length) {
      return res.status(400).json({ message: 'Faltan datos del cliente o carrito vacío' });
    }

    // 🧍 Cliente
    let clienteFinal;
    const clienteExistente = await Cliente.findOne({ where: { email: cliente.email }, paranoid: false });

    if (clienteExistente) {
      for (const campo of ['nombre','telefono','email','razonSocial','direccion','provinciaId','localidadId','cuit_cuil','vendedorId']) {
        if (clienteExistente[campo] !== cliente[campo]) {
          await HistorialCliente.create({
            campo,
            valorAnterior: clienteExistente[campo]?.toString(),
            valorNuevo: cliente[campo]?.toString(),
            clienteId: clienteExistente.id,
            usuarioId
          });
        }
      }

      // 🧭 Geocodificar si se actualiza
      const provinciaNombre = cliente.provinciaId ? ((await Provincia.findByPk(cliente.provinciaId))?.nombre || '').replace('-GBA', '').trim(): '';
      const localidadNombre = cliente.localidadId ? (await Localidad.findByPk(cliente.localidadId))?.nombre : '';
      const direccionCompleta = `${cliente.direccion}, ${localidadNombre}, ${provinciaNombre}, Argentina`;
      const { latitud, longitud } = await geocodificarDireccion(direccionCompleta);
      await clienteExistente.update({
        ...cliente,
        latitud,
        longitud,
      });

      clienteFinal = clienteExistente;
    } else {
      clienteFinal = await crearClienteConGeocodificacion(cliente, usuarioId);
    }

    // 🔄 Validación productos
    const { errores, carritoActualizado } = await verificarProductosDelCarrito(carrito);

    if (errores.length > 0) {
      return res.status(400).json({
        mensaje: 'Algunos productos fueron modificados.',
        errores,
        carritoActualizado,
      });
    }

    // 🔒 Evitar múltiples pedidos en edición
    if (!pedidoId) {
      const otroEditando = await Pedido.findOne({
        where: {
          clienteId: clienteFinal.id,
          estadoEdicion: 'editando'
        }
      });

      if (otroEditando) {
        return res.status(409).json({ message: 'Ya hay un pedido en modo edición. Confirmalo o cancelalo.' });
      }
    }

    // 📦 Pedido
    let pedido;

    if (pedidoId) {
      pedido = await Pedido.findByPk(pedidoId);
      if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

      await pedido.update({ estado: 'pendiente', estadoEdicion: 'pendiente' });

      await Notificacion.create({
        titulo: 'Edición confirmada',
        mensaje: `El cliente confirmó los cambios del pedido #${pedido.id}.`,
        tipo: 'pedido',
        usuarioId: pedido.usuarioId,
        pedidoId: pedido.id,
      });

      const admins = await Usuario.findAll({
        where: { rol: { [Op.in]: ['administrador', 'supremo'] } },
      });

      for (const admin of admins) {
        await Notificacion.create({
          titulo: 'Pedido editado y confirmado',
          mensaje: `El pedido #${pedido.id} fue editado por el cliente y ya está pendiente.`,
          tipo: 'pedido',
          usuarioId: admin.id,
          pedidoId: pedido.id,
        });
      }

      await DetallePedido.destroy({ where: { pedidoId: pedido.id } });
    } else {
      pedido = await Pedido.create({
        clienteId: clienteFinal.id,
        usuarioId,
        total: 0,
        estado: 'pendiente',
        estadoEdicion: 'pendiente',
      });
    }

    // 💲 Calcular total
    let total = 0;
    for (const item of carrito) {
      const productoDb = await Producto.findByPk(item.id);
      if (!productoDb) continue;

      const pu = productoDb.precioPorBulto || productoDb.precioUnitario;
      const subtotal = item.cantidad * pu;

      await DetallePedido.create({
        pedidoId: pedido.id,
        clienteId: clienteFinal.id,
        productoId: item.id,
        cantidad: item.cantidad,
        precioUnitario: productoDb.precioUnitario,
        precioXBulto: pu,
        subtotal,
      });

      total += subtotal;
    }

    await pedido.update({ total });

    // 🌐 IP y vinculación
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    let ipCliente = await IpCliente.findOne({ where: { ip } });
    if (!ipCliente) ipCliente = await IpCliente.create({ ip });
    await vincularIpConCliente(ipCliente.id, clienteFinal.id);

    // 📩 Notificaciones
    const vendedor = usuarioId ? await Usuario.findByPk(usuarioId) : null;

    if (!pedidoId) {
      await enviarEmailEstadoEditando({ pedido });
      //await enviarWhatsappEstadoEditando({ pedido });
    } else {
        await enviarEmailPedido({ cliente: clienteFinal, pedido, carrito, vendedor });
        // 📲 Crear lead en Kommo para disparar WhatsApp
        try {
          await crearLeadKommo({
            nombre: clienteFinal.nombre,
            telefono: clienteFinal.telefono,
            total: total,
          });
          console.log('📤 Lead enviado a Kommo');
        } catch (kommoError) {
          console.error('❌ Error al crear lead en Kommo:', kommoError.message);
        }
      //await enviarWhatsappPedido({ cliente: clienteFinal, pedido, carrito, vendedor });
    }

    // ✅ Final
    res.status(201).json({
      message: pedidoId ? 'Pedido editado correctamente' : 'Pedido en edición',
      pedidoId: pedido.id,
      clienteId: clienteFinal.id,
    });

  } catch (error) {
    console.error('❌ Error en crearOEditarPedido:', error);
    res.status(500).json({
      mensaje: "Error al enviar el pedido",
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    });
  }
};

export const obtenerPedidosClientePorId = async (req, res, next) => {
  try {
    const ip = getClientIp(req);

    // Buscar IP registrada
    const ipCliente = await IpCliente.findOne({ where: { ip } });

    if (!ipCliente) {
      return res.status(200).json([]); // IP no registrada
    }

    // Buscar clienteIds relacionados a esa IP
    const relaciones = await IpClienteCliente.findAll({
      where: {
        ipClienteId: ipCliente.id,
      },
    });

    const clienteIds = relaciones.map((r) => r.clienteId).filter(Boolean);

    if (clienteIds.length === 0) {
      return res.status(200).json([]); // No hay clientes asociados
    }

    // Buscar pedidos con esos clienteIds
    const pedidos = await Pedido.findAll({
      where: {
        clienteId: { [Op.in]: clienteIds },
      },
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [
            {
              model: Producto,
              as: 'producto',
              include: [{ model: ImagenProducto, as: 'Imagenes' }],
            },
          ],
        },
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

export const obtenerPedidoPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

    const pedido = await Pedido.findByPk(id, {
      include: [
        { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto' }] },
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
      ],
    });

    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

    res.json(pedido);
  } catch (error) {
    console.error('❌ Error en obtenerPedidoPorId:', error);
    next(error);
  }
};

export const marcarComoEditando = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findByPk(id);
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

    if (req.usuario?.rol === 'vendedor' || req.usuario?.rol === 'administrador') {
      return res.status(403).json({ message: 'No autorizado a marcar como editando' });
    }

    // ✅ Revertir otros pedidos en edición del mismo cliente
    await Pedido.update(
      { estado: 'pendiente', estadoEdicion: 'pendiente' },
      {
        where: {
          clienteId: pedido.clienteId,
          estadoEdicion: 'editando',
          id: { [Op.ne]: pedido.id }
        }
      }
    );

    // ✅ Activar modo edición en este pedido
    await pedido.update({
      estadoEdicion: 'editando',
      estado: 'editando'
    });

    // Notificaciones
    await enviarEmailEstadoEditando({ pedido });
    await enviarWhatsappEstadoEditando({ pedido });

    res.json({ message: 'Pedido en edición', estado: pedido.estado });
  } catch (error) {
    console.error('❌ Error marcarComoEditando:', error);
    next(error);
  }
};

export const revertirEditando = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pedido = await Pedido.findByPk(id);
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

    await revertirPedidoEditando(pedido);

    // Notificaciones
    await enviarEmailReversionEditando({ pedido });
    await enviarWhatsappReversionEditando({ pedido });

    res.json({ message: 'Edición revertida a pendiente', estado: pedido.estado });
  } catch (error) {
    console.error('❌ Error revertirEditando:', error);
    next(error);
  }
};

export const actualizarEstadoPedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const pedido = await Pedido.findByPk(id);
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

    // Bloquear cambios si cliente está editando
    if (pedido.estadoEdicion === 'editando') {
      return res.status(409).json({ message: 'Pedido en edición por cliente. No se puede cambiar estado.' });
    }

    const estados_validos = ['pendiente','confirmado','preparando','enviado','entregado','cancelado','rechazado','editando'];
    if (!estados_validos.includes(estado)) return res.status(400).json({ message: 'Estado inválido' });

    await pedido.update({ estado });

    // Notificar cambio de estado
    const tituloBase = estado === 'cancelado' ? 'Pedido cancelado' : 'Pedido actualizado';
    const mensajeBase = estado === 'cancelado' ? `El pedido #${pedido.id} fue cancelado.` : `El estado del pedido #${pedido.id} ahora es "${estado}".`;
    await Notificacion.create({ titulo: tituloBase, mensaje: mensajeBase, tipo: 'pedido', usuarioId: pedido.usuarioId });
    const admins = await Usuario.findAll({ where: { rol: { [Op.in]: ['administrador','supremo'] } } });
    for (const admin of admins) Notificacion.create({ titulo: tituloBase, mensaje: mensajeBase, tipo: 'pedido', usuarioId: admin.id });

    res.json({ message: 'Estado actualizado correctamente', estado });
  } catch (error) {
    console.error('❌ Error al actualizar estado del pedido:', error);
    next(error);
  }
};

export const validarCarritoSolo = async (req, res, next) => {
  try {
    const { carrito } = req.body;

    if (!Array.isArray(carrito) || carrito.length === 0) {
      return res.status(400).json({ message: 'Carrito vacío' });
    }

    const detalles = [];
    let total = 0;

    for (const item of carrito) {
      const productoDb = await Producto.findByPk(item.id);
      if (!productoDb) continue;

      const precioUnitario = productoDb.precioUnitario;
      const precioPorBulto = productoDb.precioPorBulto || precioUnitario;
      const subtotal = item.cantidad * precioPorBulto;

      detalles.push({
        productoId: item.id,
        nombre: productoDb.nombre,
        cantidad: item.cantidad,
        precioUnitario,
        precioPorBulto,
        subtotal,
      });

      total += subtotal;
    }

    res.json({ detalles, total });
  } catch (error) {
    console.error('❌ Error al validar carrito:', error);
    next(error);
  }
};

export const duplicarPedido = async (req, res, next) => {
  try {
    const { pedidoId } = req.body; 

    if (!pedidoId) {
      return res.status(400).json({ message: 'Pedido ID es obligatorio' });
    }

    // Buscar el pedido original
    const pedidoOriginal = await Pedido.findByPk(pedidoId, {
      include: [
        { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto' }] },
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
      ],
    });

    if (!pedidoOriginal) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Crear un nuevo pedido duplicado
    const nuevoPedido = await Pedido.create({
      clienteId: pedidoOriginal.clienteId,
      usuarioId: pedidoOriginal.usuarioId,
      total: 0,
      estado: 'pendiente', // Cambiar el estado si es necesario
    });

    // Duplicar los detalles del pedido original
    let total = 0;
    for (const item of pedidoOriginal.detalles) {
      const productoDb = await Producto.findByPk(item.productoId);
      if (!productoDb) continue;

      const precioUnitario = productoDb.precioUnitario;
      const precioPorBulto = productoDb.precioPorBulto || precioUnitario;
      const subtotal = item.cantidad * precioPorBulto;

      await DetallePedido.create({
        pedidoId: nuevoPedido.id,
        clienteId: pedidoOriginal.clienteId,
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario,
        precioXBulto: precioPorBulto,
        subtotal,
      });

      total += subtotal;
    }

    // Actualizar el total del nuevo pedido
    nuevoPedido.total = total;
    await nuevoPedido.save();

    res.status(201).json({
      message: 'Pedido duplicado correctamente',
      pedidoId: nuevoPedido.id,
      clienteId: pedidoOriginal.clienteId,
    });
    
    // Notificaciones (no deben bloquear la respuesta)
    try {
      const vendedor = await Usuario.findByPk(nuevoPedido.usuarioId);
      await enviarEmailPedido({
        cliente: pedidoOriginal.cliente,
        pedido: nuevoPedido,
        carrito: pedidoOriginal.detalles,
        vendedor,
      });
      try {
      await enviarWhatsappPedido({
        cliente: pedidoOriginal.cliente,
        pedido: nuevoPedido,
        carrito: pedidoOriginal.detalles,
        vendedor,
      });} catch (e) {
        console.warn("⚠️ WhatsApp no enviado:", e.message);
      }
    } catch (e) {
      console.warn("⚠️ Error enviando notificaciones duplicado:", e.message);
    }
    
  } catch (error) {
    console.error('❌ Error en duplicarPedido:', error);
    next(error);
  }
};

export const cancelarPedidoDesdeCliente = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id);
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

    // ⚠️ Permitimos cancelar incluso si está en edición
    await pedido.update({
      estado: 'cancelado',
      estadoEdicion: 'pendiente',
    });

    const cliente = await pedido.getCliente();
    const vendedor = await pedido.getUsuario();

    await enviarEmailPedido({
      cliente,
      pedido,
      carrito: [],
      vendedor,
      extraMensaje: `🛑 El cliente canceló el pedido #${pedido.id} mientras estaba en modo edición.`,
    });

    await enviarWhatsappPedido({
      cliente,
      pedido,
      carrito: [],
      vendedor,
      extraMensaje: `🛑 El cliente canceló el pedido *#${pedido.id}* mientras lo estaba editando.`,
    });

    res.json({ message: 'Pedido cancelado correctamente' });
  } catch (error) {
    console.error('❌ Error cancelarPedidoDesdeCliente:', error);
    next(error);
  }
};

// PRODUCTO
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

// UBICACIÓN
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

// VENDEDOR
export const buscarVendedorPorLink = async (req, res, next) => {
  try {
    const { link } = req.params;

    const vendedor = await Usuario.findOne({
      where: { link, rol: 'vendedor' },
      attributes: ['id', 'nombre', 'email', 'telefono', 'link'],
    });

    if (!vendedor) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }

    res.json(vendedor);
  } catch (error) {
    next(error);
  }
};



