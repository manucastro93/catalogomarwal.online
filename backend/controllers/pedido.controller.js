import { Pedido, DetallePedido, Producto, Cliente, Usuario, IpCliente, Notificacion, HistorialCliente } from '../models/index.js';
import { vincularIpConCliente } from './ipCliente.controller.js';
import { verificarProductosDelCarrito } from '../utils/validarPedido.js';
import { Op } from 'sequelize';
import { enviarEmailPedido, enviarEmailEstadoEditando, enviarEmailReversionEditando } from "../utils/notificaciones/email.js";
import { enviarWhatsappPedido, enviarWhatsappEstadoEditando, enviarWhatsappReversionEditando } from "../utils/notificaciones/whatsapp.js";
import dayjs from 'dayjs';


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

    if (vendedorId) where.usuarioId = vendedorId;
    if (estado) where.estado = estado;

    const whereFinal = { ...where };
    if (busqueda) whereFinal['$cliente.nombre$'] = { [Op.like]: `%${busqueda}%` };

    let orderBy = [[orden, direccion]];
    if (orden === 'cliente') orderBy = [[{ model: Cliente, as: 'cliente' }, 'nombre', direccion]];
    else if (orden === 'vendedor') orderBy = [[{ model: Usuario, as: 'usuario' }, 'nombre', direccion]];

    const includeBase = [
      { model: Cliente, as: 'cliente', required: true },
      { model: Usuario, as: 'usuario' },
      { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto' }] },
    ];

    const includePaginacion = [
      { model: Cliente, as: 'cliente', where: busqueda ? { nombre: { [Op.like]: `%${busqueda}%` } } : undefined, required: !!busqueda },
      { model: Usuario, as: 'usuario' },
    ];

    const idsPaginados = await Pedido.findAll({ attributes: ['id'], where: whereFinal, include: includePaginacion, limit: Number(limit), offset, order: orderBy, subQuery: false });
    const ids = idsPaginados.map(p => p.id);
    const rows = await Pedido.findAll({ where: { id: ids }, include: includeBase, order: orderBy });
    const count = await Pedido.count({ where, include: [{ model: Cliente, as: 'cliente', where: busqueda ? { nombre: { [Op.like]: `%${busqueda}%` } } : undefined, required: !!busqueda }], distinct: true, col: 'id' });
    const totalPaginas = Math.ceil(count / limit);

    res.json({ data: rows, pagina: Number(pagina), totalPaginas, totalItems: count, hasNextPage: Number(pagina) < totalPaginas, hasPrevPage: Number(pagina) > 1 });
  } catch (error) {
    console.error('❌ ERROR en obtenerPedidos:', error);
    next(error);
  }
};

export const crearOEditarPedido = async (req, res, next) => {
  try {
    const { cliente, carrito, usuarioId = null, pedidoId = null } = req.body;

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

    const { errores, carritoActualizado } = await verificarProductosDelCarrito(carrito);

if (errores.length > 0) {
  return res.status(400).json({
    mensaje: 'Algunos productos fueron modificados.',
    errores,
    carritoActualizado,
  });
}


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
      await clienteExistente.update(cliente);
      clienteFinal = clienteExistente;
    } else {
      clienteFinal = await Cliente.create(cliente);
    }

    // 📦 Pedido
    let pedido;

    if (pedidoId) {
      pedido = await Pedido.findByPk(pedidoId);
      if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

      // ✅ Restaurar estado
      await pedido.update({ estado: 'pendiente', estadoEdicion: 'pendiente' });

      // 🔔 Notificación al vendedor
      await Notificacion.create({
        titulo: 'Edición confirmada',
        mensaje: `El cliente confirmó los cambios del pedido #${pedido.id}.`,
        tipo: 'pedido',
        usuarioId: pedido.usuarioId,
        pedidoId: pedido.id,
      });

      // 🔔 Notificaciones a administradores
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

    // 📩 Notificaciones por Email y WhatsApp
    const vendedor = usuarioId ? await Usuario.findByPk(usuarioId) : null;

    if (!pedidoId) {
      await enviarEmailEstadoEditando({ pedido });
      await enviarWhatsappEstadoEditando({ pedido });
    } else {
      await enviarEmailPedido({ cliente: clienteFinal, pedido, carrito, vendedor });
      await enviarWhatsappPedido({ cliente: clienteFinal, pedido, carrito, vendedor });
    }

    // ✅ Respuesta final
    res.status(201).json({
      message: pedidoId ? 'Pedido editado correctamente' : 'Pedido en edición',
      pedidoId: pedido.id,
      clienteId: clienteFinal.id,
    });

  } catch (error) {
    console.error('❌ Error en crearOEditarPedido:', error);
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

    if (!cliente || !Array.isArray(carrito) || carrito.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos para el pedido.' });
    }

    // Crear cliente si no existe
    let clienteFinal = null;

    if (!cliente.id || cliente.id === 0) {
      clienteFinal = await Cliente.create({
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        direccion: cliente.direccion || '',
        razonSocial: cliente.razonSocial || '',
        cuit_cuil: cliente.cuit_cuil,
        provinciaId: cliente.provinciaId || null,
        localidadId: cliente.localidadId || null,
        vendedorId: usuarioId,
      });
    } else {
      const buscado = await Cliente.findByPk(cliente.id);
      if (!buscado) {
        return res.status(404).json({ error: 'Cliente no encontrado.' });
      }
      clienteFinal = buscado;
    }

    // Crear el pedido
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

    // Notificación al vendedor
    await Notificacion.create({
      titulo: 'Nuevo pedido creado desde el panel',
      mensaje: `El cliente ${clienteFinal.nombre} tiene un nuevo pedido.`,
      tipo: 'pedido',
      usuarioId,
    });

    // Notificaciones a administradores
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

    // Envío por email y WhatsApp
    await enviarEmailPedido({ cliente: clienteFinal, pedido, carrito, vendedor });
    await enviarWhatsappPedido({ cliente: clienteFinal, pedido, carrito, vendedor });

    res.status(201).json({ message: 'Pedido creado correctamente', pedidoId: pedido.id });
  } catch (err) {
    console.error('❌ Error al crear pedido desde panel:', err);
    res.status(500).json({ error: 'Error interno al crear el pedido.' });
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
    const ip = getClientIp(req);
    const ipCliente = await IpCliente.findOne({ where: { ip } });

    if (!ipCliente || !ipCliente.clienteId) {
      return res.status(200).json([]); // sin error, pero sin pedidos
    }

    const pedidos = await Pedido.findAll({
      where: {
        clienteId: ipCliente.clienteId,
        // Podés dejar la restricción si querés
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

export const obtenerPedidosInicio = async (req, res) => {
  try {
    const { vendedorId } = req.query;
    const where = {};

    if (vendedorId) where.usuarioId = vendedorId;

    const pendientes = await Pedido.findAll({
      where: { ...where, estado: "pendiente" },
      include: [{ model: Cliente, as: "cliente" }],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    const confirmados = await Pedido.findAll({
      where: {
        ...where,
        estado: { [Op.in]: ["confirmado", "preparando"] },
      },
      include: [{ model: Cliente, as: "cliente" }],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    res.json({ pendientes, confirmados });
  } catch (error) {
    console.error("Error al obtener pedidos de inicio:", error);
    res.status(500).json({ message: "Error al obtener pedidos" });
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
