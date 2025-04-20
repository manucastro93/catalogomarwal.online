import { Pedido, DetallePedido, Producto, Cliente, Usuario, IpCliente, Notificacion, HistorialCliente } from '../models/index.js';
import { Op } from 'sequelize';
import { enviarEmailPedido } from "../utils/notificaciones/email.js";
import { enviarWhatsappPedido } from "../utils/notificaciones/whatsapp.js";

export const obtenerPedidos = async (req, res, next) => {
  try {
    const {
      pagina = 1,
      limit = 10,
      orden = 'createdAt',
      direccion = 'DESC',
      busqueda = '',
      vendedorId,
      estado,
    } = req.query;

    const offset = (pagina - 1) * limit;
    const where = {};

    if (req.usuario?.rol === 'vendedor') {
      where.usuarioId = req.usuario.id;
    }

    if (vendedorId) {
      where.usuarioId = vendedorId;
    }

    if (estado) {
      where.estado = estado;
    }

    const whereFinal = { ...where };

    if (busqueda) {
      whereFinal['$cliente.nombre$'] = {
        [Op.like]: `%${busqueda}%`,
      };
    }

    let orderBy = [[orden, direccion]];

    if (orden === 'cliente') {
      orderBy = [[{ model: Cliente, as: 'cliente' }, 'nombre', direccion]];
    } else if (orden === 'vendedor') {
      orderBy = [[{ model: Usuario, as: 'usuario' }, 'nombre', direccion]];
    }

    const includeBase = [
      { model: Cliente, as: 'cliente', required: true },
      { model: Usuario, as: 'usuario' },
      {
        model: DetallePedido,
        as: 'detalles',
        include: [{ model: Producto, as: 'producto' }],
      },
    ];
    
    // Paso 1: obtener IDs con paginación limpia
    const includePaginacion = [
      {
        model: Cliente,
        as: 'cliente',
        where: busqueda ? { nombre: { [Op.like]: `%${busqueda}%` } } : undefined,
        required: !!busqueda,
      },
      {
        model: Usuario,
        as: 'usuario',
      },
    ];
    
    const idsPaginados = await Pedido.findAll({
      attributes: ['id'],
      where: whereFinal,
      include: includePaginacion,
      limit: Number(limit),
      offset,
      order: orderBy,
      subQuery: false,
    });
    

    const ids = idsPaginados.map(p => p.id);

    // Paso 2: obtener pedidos completos con include
    const rows = await Pedido.findAll({
      where: { id: ids },
      include: includeBase,
      order: orderBy,
    });
    rows.forEach(p => {
    });
    
    // Paso 3: obtener cantidad total
    const count = await Pedido.count({
      where,
      include: [
        {
          model: Cliente,
          as: 'cliente',
          where: busqueda ? { nombre: { [Op.like]: `%${busqueda}%` } } : undefined,
          required: !!busqueda,
        },
      ],
      distinct: true,
      col: 'id'
    });
    

    const totalPaginas = Math.ceil(count / limit);
    
    res.json({
      data: rows,
      pagina: Number(pagina),
      totalPaginas,
      totalItems: count,
      hasNextPage: Number(pagina) < totalPaginas,
      hasPrevPage: Number(pagina) > 1,
    });
  } catch (error) {
    console.error('❌ ERROR en obtenerPedidos:', error);
    next(error);
  }
};

export const crearPedido = async (req, res, next) => {
  try {
    const { cliente, carrito, usuarioId = null } = req.body;

    if (!cliente || !carrito || !Array.isArray(carrito) || carrito.length === 0) {
      return res.status(400).json({ message: 'Faltan datos del cliente o carrito vacío' });
    }

    let clienteExistente = await Cliente.findOne({
      where: { email: cliente.email },
      paranoid: false,
    });

    let clienteFinal;

    if (clienteExistente) {
      const camposAActualizar = [
        'nombre',
        'telefono',
        'email',
        'razonSocial',
        'direccion',
        'provinciaId',
        'localidadId',
        'cuit_cuil',
        'vendedorId',
      ];

      for (const campo of camposAActualizar) {
        const valorAnterior = clienteExistente[campo];
        const valorNuevo = cliente[campo];

        if (valorAnterior !== valorNuevo) {
          await HistorialCliente.create({
            campo,
            valorAnterior: valorAnterior?.toString() ?? null,
            valorNuevo: valorNuevo?.toString() ?? null,
            clienteId: clienteExistente.id,
            usuarioId,
          });
        }
      }

      await clienteExistente.update(cliente);
      clienteFinal = clienteExistente;
    } else {
      clienteFinal = await Cliente.create(cliente);
    }

    const pedido = await Pedido.create({
      clienteId: clienteFinal.id,
      usuarioId,
      total: 0,
      estado: 'pendiente',
    });

    let total = 0;

    for (const item of carrito) {
      const productoDb = await Producto.findByPk(item.id);
      if (!productoDb) continue;

      const precioUnitario = productoDb.precioUnitario;
      const precioPorBulto = productoDb.precioPorBulto || precioUnitario;
      const subtotal = item.cantidad * precioPorBulto;

      await DetallePedido.create({
        pedidoId: pedido.id,
        clienteId: clienteFinal.id,
        productoId: item.id,
        cantidad: item.cantidad,
        precioUnitario,
        precioXBulto: precioPorBulto,
        subtotal,
      });

      total += subtotal;
    }

    pedido.total = total;
    await pedido.save();

    // 🌐 Registrar IP si no existe
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;

    const yaExisteIp = await IpCliente.findOne({
      where: { ip, clienteId: clienteFinal.id },
    });

    if (!yaExisteIp) {
      await IpCliente.create({ ip, clienteId: clienteFinal.id });
      console.log('📌 IP registrada:', ip);
    }

    // Crear notificación para el vendedor
    if (pedido.usuarioId) {
      await Notificacion.create({
        titulo: 'Nuevo pedido recibido',
        mensaje: `Pedido #${pedido.id} creado por el cliente ${cliente.nombre}.`,
        usuarioId: pedido.usuarioId,
        tipo: 'pedido',
        pedidoId: pedido.id,
      });
    }

    // Crear notificación global para administradores
    const admins = await Usuario.findAll({
      where: {
        rol: { [Op.in]: ['administrador', 'supremo'] },
      },
    });

    for (const admin of admins) {
      await Notificacion.create({
        titulo: 'Nuevo pedido recibido',
        mensaje: `Pedido #${pedido.id} generado.`,
        usuarioId: admin.id,
        tipo: 'pedido',
        pedidoId: pedido.id,
      });
    }

    // ✉️ Email + WhatsApp
    const vendedor = usuarioId ? await Usuario.findByPk(usuarioId) : null;

    await enviarEmailPedido({
      cliente: clienteFinal,
      pedido,
      carrito,
      vendedor,
    });

    await enviarWhatsappPedido({
      cliente: clienteFinal,
      pedido,
      carrito,
      vendedor,
    });

    res.status(201).json({
      message: 'Pedido creado correctamente',
      pedidoId: pedido.id,
      clienteId: clienteFinal.id,
    });
    
  } catch (error) {
    console.error('❌ Error al crear pedido:', error);
    next(error);
  }
};

export const crearPedidoDesdePanel = async (req, res, next) => {
  try {
    const { cliente, carrito, usuarioId } = req.body;

    if (!cliente?.id || !Array.isArray(carrito) || carrito.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos para el pedido.' });
    }

    const clienteFinal = await Cliente.findByPk(cliente.id);
    if (!clienteFinal) {
      return res.status(404).json({ error: 'Cliente no encontrado.' });
    }

    const pedido = await Pedido.create({
      clienteId: clienteFinal.id,
      usuarioId,
      total: 0,
      estado: 'pendiente',
    });

    let total = 0;

    for (const item of carrito) {
      const productoDb = await Producto.findByPk(item.id);
      if (!productoDb) continue;

      const precioUnitario = productoDb.precioUnitario;
      const precioPorBulto = productoDb.precioPorBulto || precioUnitario;
      const subtotal = item.cantidad * precioPorBulto;

      await DetallePedido.create({
        pedidoId: pedido.id,
        clienteId: clienteFinal.id,
        productoId: item.id,
        cantidad: item.cantidad,
        precioUnitario,
        precioXBulto: precioPorBulto,
        subtotal,
        dispositivo: 'panel',
        usuarioId,
      });

      total += subtotal;
    }

    await pedido.update({ total });

    const vendedor = usuarioId ? await Usuario.findByPk(usuarioId) : null;

    await Notificacion.create({
      titulo: 'Nuevo pedido creado desde el panel',
      mensaje: `El cliente ${clienteFinal.nombre} tiene un nuevo pedido.`,
      tipo: 'pedido',
      usuarioId,
    });

    const admins = await Usuario.findAll({
      where: { rol: { [Op.in]: ['administrador', 'supremo'] } },
    });

    for (const admin of admins) {
      await Notificacion.create({
        titulo: 'Pedido desde el panel',
        mensaje: `El cliente ${clienteFinal.nombre} tiene un nuevo pedido.`,
        tipo: 'pedido',
        usuarioId: admin.id,
      });
    }

    await enviarEmailPedido({ cliente: clienteFinal, pedido, carrito, vendedor });
    await enviarWhatsappPedido({ cliente: clienteFinal, pedido, carrito, vendedor });

    res.status(201).json({ message: 'Pedido creado correctamente', pedidoId: pedido.id });
  } catch (err) {
    console.error('❌ Error al crear pedido desde panel:', err);
    res.status(500).json({ error: 'Error interno al crear el pedido.' });
  }
};


export const actualizarEstadoPedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const estados_validos = [
      'pendiente',
      'confirmado',
      'preparando',
      'enviado',
      'entregado',
      'cancelado',
      'rechazado',
    ];

    const pedido = await Pedido.findByPk(id);
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

    if (!estados_validos.includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    await pedido.update({ estado });

    // 🔔 Notificación por cambio de estado
    const tituloBase = estado === 'cancelado'
      ? 'Pedido cancelado'
      : `Pedido actualizado`;

    const mensajeBase = estado === 'cancelado'
      ? `El pedido #${pedido.id} fue cancelado.`
      : `El estado del pedido #${pedido.id} ahora es "${estado}".`;

    // Vendedor
    await Notificacion.create({
      titulo: tituloBase,
      mensaje: mensajeBase,
      tipo: 'pedido',
      usuarioId: pedido.usuarioId,
    });

    // Admins
    const admins = await Usuario.findAll({
      where: { rol: { [Op.in]: ['administrador', 'supremo'] } },
    });

    for (const admin of admins) {
      await Notificacion.create({
        titulo: tituloBase,
        mensaje: mensajeBase,
        tipo: 'pedido',
        usuarioId: admin.id,
      });
    }


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

export const obtenerPedidosPorIp = async (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
    const ipCliente = await IpCliente.findOne({ where: { ip } });

    if (!ipCliente) return res.status(404).json({ message: 'IP no registrada' });

    const pedidos = await Pedido.findAll({
      where: {
        clienteId: ipCliente.clienteId,
        createdAt: { [Op.gte]: dayjs().subtract(6, 'month').toDate() },
      },
      include: [
        { model: Cliente, as: 'cliente' },
        { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto' }] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(pedidos);
  } catch (error) {
    console.error('❌ Error en obtenerPedidosPorIp:', error);
    next(error);
  }
};
