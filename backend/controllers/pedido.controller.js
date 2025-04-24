import { Pedido, DetallePedido, Producto, Cliente, Usuario, IpCliente, Notificacion, HistorialCliente, Provincia, Localidad } from '../models/index.js';
import { vincularIpConCliente } from './ipCliente.controller.js';
import { verificarProductosDelCarrito } from '../utils/validarPedido.js';
import { geocodificarDireccion } from '../utils/geocodificacion.js';
import { crearLeadKommo } from '../services/kommo.service.js';
import { Op } from 'sequelize';
import { enviarEmailPedido, enviarEmailEstadoEditando, enviarEmailReversionEditando } from "../utils/notificaciones/email.js";
import { enviarWhatsappPedido, enviarWhatsappEstadoEditando, enviarWhatsappReversionEditando } from "../utils/notificaciones/whatsapp.js";
import { crearClienteConGeocodificacion } from '../helpers/clientes.js';
import dayjs from 'dayjs';

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

export const crearPedidoDesdePanel = async (req, res, next) => {
  try {
    const { cliente, carrito, usuarioId } = req.body;

    if (!cliente || !Array.isArray(carrito) || carrito.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos para el pedido.' });
    }

    // Crear cliente si no existe
    let clienteFinal = null;

    if (!cliente.id || cliente.id === 0) {
      clienteFinal = await crearClienteConGeocodificacion(cliente, usuarioId);
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

