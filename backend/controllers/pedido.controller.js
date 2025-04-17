import { Pedido, DetallePedido, Producto, Cliente, Usuario, IpCliente, Notificacion } from '../models/index.js';
import { Op } from 'sequelize';
import { enviarEmailPedido } from "../utils/notificaciones/email.js";
import { enviarWhatsappPedido } from "../utils/notificaciones/whatsapp.js";

export const obtenerPedidos = async (req, res, next) => {
  try {
    const { pagina = 1, limit = 10, orden = 'createdAt', direccion = 'DESC', busqueda = '', vendedorId } = req.query;
    const offset = (pagina - 1) * limit;

    const where = {};

    if (busqueda) {
      where.estado = { [Op.like]: `%${busqueda}%` };
    }

    // 🔒 Si es vendedor, solo sus pedidos
    if (req.usuario?.rol === 'vendedor') {
      where.usuarioId = req.usuario.id;
    }

    // Si se proporciona un vendedorId (por admin)
    if (vendedorId) {
      where.usuarioId = vendedorId;
    }

    const { count, rows } = await Pedido.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[orden, direccion]],
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [Producto],
        },
      ],
    });

    res.json({
      data: rows,
      total: count,
      pagina: Number(pagina),
      totalPaginas: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};


export const obtenerPedidoPorId = async (req, res, next) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [Producto],
        },
      ],
    });
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.json(pedido);
  } catch (error) {
    next(error);
  }
};

export const actualizarEstadoPedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    console.log('🟡 Actualizar estado pedido:', { id, estado });

    const pedido = await Pedido.findByPk(id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
      ]
    });

    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

    // Solo se puede cancelar si está pendiente
    if (estado === 'cancelado' && pedido.estado.toLowerCase().trim() !== 'pendiente') {
      return res.status(400).json({ message: 'Solo se pueden cancelar pedidos pendientes' });
    }

    await pedido.update({ estado });

    // 🔔 Notificación para admins
    const administradores = await Usuario.findAll({
      where: { rol: { [Op.in]: ['administrador', 'supremo'] } }
    });

    for (const admin of administradores) {
      await Notificacion.create({
        titulo: `Estado del pedido #${pedido.id} actualizado`,
        mensaje: `El estado ahora es "${estado}"`,
        tipo: 'pedido',
        usuarioId: admin.id,
      });
    }

    // ✉️ WhatsApp y Email al cliente y vendedor
    try {
      await enviarEmailPedido({
        cliente: pedido.cliente,
        pedido,
        carrito: [], // no disponible aquí, podrías cargarlo si querés
        vendedor: pedido.usuario,
      });

      await enviarWhatsappPedido({
        cliente: pedido.cliente,
        pedido,
        carrito: [],
        vendedor: pedido.usuario,
      });
    } catch (notiErr) {
      console.warn('⚠️ Error al enviar notificaciones:', notiErr.message);
    }

    console.log("🧾 Estado anterior:", pedido.estado);
    console.log("🧾 Nuevo estado:", estado);

    res.json({ message: 'Estado actualizado correctamente', pedido });
  } catch (error) {
    console.error("❌ Error al actualizar estado:", error);
    next(error);
  }
};

export const crearPedido = async (req, res, next) => {
  const t = await Pedido.sequelize.transaction();

  try {
    const { cliente, carrito, usuarioId, vendedor } = req.body;
    if (!usuarioId) {
      return res.status(400).json({ error: 'No tiene vendedor asignado.' });
    }

    if (!cliente?.email || !cliente?.telefono || !cliente?.nombre || !carrito?.length) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    // 🔎 Buscar cliente por email
    let clienteExistente = await Cliente.findOne({
      where: { email: cliente.email },
      transaction: t,
    });

    if (clienteExistente) {

      await clienteExistente.update({
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        razonSocial: cliente.razonSocial,
        cuit_cuil: cliente.cuit_cuil || '',
        provinciaId: cliente.provinciaId || null,
        localidadId: cliente.localidadId || null,
        vendedorId: cliente.vendedorId || clienteExistente.vendedorId,
      }, { transaction: t });

    } else {

      clienteExistente = await Cliente.create({
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email,
        direccion: cliente.direccion,
        razonSocial: cliente.razonSocial,
        cuit_cuil: cliente.cuit_cuil || '',
        provinciaId: cliente.provinciaId || null,
        localidadId: cliente.localidadId || null,
        vendedorId: cliente.vendedorId || null,
      }, { transaction: t });
    }

    // 🧠 Asociar IP actual
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;

    const yaTieneIp = await IpCliente.findOne({
      where: { ip, clienteId: clienteExistente.id },
      transaction: t,
    });

    if (!yaTieneIp) {
      await IpCliente.create({
        ip,
        clienteId: clienteExistente.id,
      }, { transaction: t });
      console.log('🌐 IP registrada:', ip);
    }

    // 🧾 Crear pedido
    const pedido = await Pedido.create({
      estado: 'pendiente',
      observaciones: '',
      total: 0,
      clienteId: clienteExistente.id,
      usuarioId: usuarioId || null,
    }, { transaction: t });

    let totalPedido = 0;

    for (const item of carrito) {
      const subtotal = item.precio * item.cantidad;
      totalPedido += subtotal;

      await DetallePedido.create({
        cantidad: item.cantidad,
        precioUnitario: item.precio / (item.unidadPorBulto || 1),
        precioXBulto: item.precio,
        subtotal,
        clienteId: clienteExistente.id,
        pedidoId: pedido.id,
        productoId: item.id,
        usuarioId: usuarioId || null,
      }, { transaction: t });
    }

    await pedido.update({ total: totalPedido }, { transaction: t });

    await t.commit();
    // Notificación para el vendedor
await Notificacion.create({
  titulo: 'Nuevo pedido recibido',
  mensaje: `El cliente ${clienteExistente.nombre} hizo un pedido.`,
  tipo: 'pedido',
  usuarioId: usuarioId, // vendedor
});

// Notificación para todos los administradores
const administradores = await Usuario.findAll({
  where: {
    rol: { [Op.in]: ['administrador', 'supremo'] },
  },
});

for (const admin of administradores) {
  await Notificacion.create({
    titulo: 'Nuevo pedido recibido',
    mensaje: `El cliente ${clienteExistente.nombre} hizo un pedido.`,
    tipo: 'pedido',
    usuarioId: admin.id,
  });
}
    try {
      await enviarEmailPedido({
        cliente: clienteExistente,
        pedido,
        carrito,
        vendedor
      });
    
      await enviarWhatsappPedido({
        cliente: clienteExistente,
        pedido,
        carrito,
        vendedor
      });
    } catch (notiError) {
      console.warn("⚠️ Error al enviar notificaciones:", notiError.message);
    }
    res.status(201).json({ message: 'Pedido creado correctamente', pedidoId: pedido.id });
  } catch (error) {
    await t.rollback();
    console.error('❌ Error al crear pedido:', error.message);
    next(error);
  }
};

export const obtenerPedidosPorIp = async (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    const ipCliente = await IpCliente.findOne({
      where: { ip },
      include: [{ model: Cliente, as: 'cliente' }]
    });

    if (!ipCliente || !ipCliente.clienteId) {
      return res.status(404).json({ message: 'Cliente no encontrado por IP' });
    }
    const pedidos = await Pedido.findAll({
      where: { clienteId: ipCliente.clienteId },
      include: [
        { model: DetallePedido, as: 'detalles', include: [Producto] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(pedidos);
  } catch (error) {
    console.error('❌ Error al obtener pedidos por IP:', error);
    next(error);
  }
};
