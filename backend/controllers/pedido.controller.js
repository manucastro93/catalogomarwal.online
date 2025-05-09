import { Pedido, DetallePedido, Producto, Cliente, Usuario, Notificacion, EstadoPedido } from '../models/index.js';
import { ESTADOS_PEDIDO } from '../constants/estadosPedidos.js';
import { ROLES_USUARIOS } from '../constants/rolesUsuarios.js';
import { crearLeadKommo } from '../services/kommo.service.js';
import { Op } from 'sequelize';
import { enviarEmailPedido } from "../utils/notificaciones/email.js";
import { enviarWhatsappPedido, enviarWhatsappEstadoEditando, enviarWhatsappReversionEditando } from "../utils/notificaciones/whatsapp.js";
import { crearClienteConGeocodificacion } from '../helpers/clientes.js';
import { crearAuditoria } from '../utils/auditoria.js';

export const obtenerPedidos = async (req, res, next) => {
  try {
    const {
      pagina = 1,
      limit = 10,
      orden = 'createdAt',
      direccion = 'DESC',
      busqueda = '',
      vendedorId: vendedorIdQuery,
      estado,
      desde,
      hasta,
    } = req.query;

    const offset = (pagina - 1) * limit;

    // 💡 Filtros dinámicos
    const where = {};

    // ⏱️ Filtro por fecha
    if (desde && hasta) {
      where.createdAt = {
        [Op.between]: [new Date(desde), new Date(hasta)],
      };
    }

    // ✅ Si es VENDEDOR logueado, filtrar por SU ID
    if (req.usuario?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR) {
      where.vendedorId = req.usuario.id;
    }

    // ✅ Si en query viene vendedorId (y el usuario NO es vendedor) filtramos por ese
    if (vendedorIdQuery && req.usuario?.rolUsuarioId !== ROLES_USUARIOS.VENDEDOR) {
      where.vendedorId = vendedorIdQuery;
    }

    if (estado) {
      where.estadoPedidoId = estado;
    }

    const whereCliente = busqueda
      ? { nombre: { [Op.like]: `%${busqueda}%` } }
      : undefined;

    const orderBy = (() => {
      if (orden === 'cliente') return [[{ model: Cliente, as: 'cliente' }, 'nombre', direccion]];
      if (orden === 'vendedor') return [[{ model: Usuario, as: 'usuario' }, 'nombre', direccion]];
      return [[orden, direccion]];
    })();

    // 🥇 Primero paginamos solo los IDs
    const idsPaginados = await Pedido.findAll({
      attributes: ['id'],
      where,
      include: [
        { model: Cliente, as: 'cliente', where: whereCliente, required: !!busqueda },
      ],
      limit: Number(limit),
      offset,
      order: orderBy,
      subQuery: false,
    });

    const ids = idsPaginados.map((p) => p.id);

    // 🥈 Traemos los datos completos
    const pedidos = await Pedido.findAll({
      where: { id: ids },
      include: [
        { model: Cliente, as: 'cliente', required: true },
        { model: Usuario, as: 'usuario' },
        { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto' }] },
        { model: EstadoPedido, as: 'estadoPedido' },
      ],
      order: orderBy,
    });

    const count = await Pedido.count({
      where,
      include: [
        { model: Cliente, as: 'cliente', where: whereCliente, required: !!busqueda },
      ],
      distinct: true,
      col: 'id',
    });

    const totalPaginas = Math.ceil(count / limit);

    res.json({
      data: pedidos,
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

export const actualizarEstadoPedido = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estadoPedidoId } = req.body;

    // Validación rápida del ID de pedido
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const pedido = await Pedido.findByPk(id);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // 🚫 Bloqueo si el pedido está en modo edición por el cliente
    if (pedido.estadoEdicion === true) {
      return res.status(409).json({
        message: 'El pedido está siendo editado por el cliente. No se puede cambiar el estado hasta que finalice la edición.',
      });
    }

    // Validar que el estadoPedidoId recibido sea un estado válido
    const estadoPedido = await EstadoPedido.findByPk(estadoPedidoId);
    if (!estadoPedido) {
      return res.status(400).json({ message: 'Estado de pedido no válido' });
    }

    // Actualizar el estado del pedido
    await pedido.update({ estadoPedidoId });

    // 📣 Crear notificación para el usuario asociado al pedido
    const estadoNombre = estadoPedido.nombre;
    const tituloBase = estadoNombre === 'Cancelado' ? 'Pedido cancelado' : 'Pedido actualizado';
    const mensajeBase = estadoNombre === 'Cancelado'
      ? `El pedido #${pedido.id} ha sido cancelado.`
      : `El estado del pedido #${pedido.id} ahora es "${estadoNombre}".`;

    if (pedido.usuarioId) {
      await Notificacion.create({
        titulo: tituloBase,
        mensaje: mensajeBase,
        tipo: 'pedido',
        usuarioId: pedido.usuarioId,
        pedidoId: pedido.id,
      });
    }

    // 🔔 Notificar también a todos los administradores y supremos
    const admins = await Usuario.findAll({
      where: { rolUsuarioId: { [Op.in]: [ROLES_USUARIO.SUPREMO, ROLES_USUARIO.ADMINISTRADOR] } },
    });

    for (const admin of admins) {
      await Notificacion.create({
        titulo: tituloBase,
        mensaje: mensajeBase,
        tipo: 'pedido',
        usuarioId: admin.id,
        pedidoId: pedido.id,
      });
    }

    // 🕵🏻‍♂️ Auditar la acción de cambio de estado
    await crearAuditoria({
      tabla: 'pedidos',
      accion: 'actualiza estado',
      registroId: pedido.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Pedido ${pedido.id} actualizado a estado "${estadoNombre}".`,
      datosAntes: { estadoPedidoId: pedido.estadoPedidoId },
      datosDespues: { estadoPedidoId },
      ip: req.ip,
    });

    // 🔥 Devolver respuesta final
    res.json({
      message: 'Estado del pedido actualizado correctamente',
      estadoPedidoId,
      estadoNombre,
    });

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

    // Estado por defecto (Recibido o Pendiente)
    const estadoPedidoId = 1; // ID de "Recibido", según tu tabla

    // Crear el pedido
    const pedido = await Pedido.create({
      clienteId: clienteFinal.id,
      usuarioId,
      total: 0,
      estadoPedidoId,
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
      where: { rolUsuarioId: { [Op.in]: [1, 2] } }, // supremo y administrador
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
    
    await crearAuditoria({
      tabla: 'pedidos',
      accion: 'crea pedido desde panel',
      registroId: pedido.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Pedido ${pedido.id} creado desde el panel por ${req.usuario?.nombre || 'sistema'}.`,
      datosAntes: {},
      datosDespues: { clienteId: clienteFinal.id, total },
      ip: req.ip,
    });
    
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
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }],
        },
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
        { model: EstadoPedido, as: 'estadoPedido' }, // ✅ agregado
      ],
    });

    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

    res.json(pedido);
  } catch (error) {
    console.error('❌ Error en obtenerPedidoPorId:', error);
    next(error);
  }
};

export const obtenerPedidosInicio = async (req, res, next) => {
  try {
    const { vendedorId: vendedorIdQuery } = req.query;

    const wherePedido = {};

    // Si el logueado es vendedor, filtra por su propio usuarioId
    if (req.usuario?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR) {
      wherePedido.usuarioId = req.usuario.id;
    }

    // Si en query mandan vendedorId (ej: admin quiere ver otro vendedor)
    if (vendedorIdQuery && req.usuario?.rolUsuarioId !== ROLES_USUARIOS.VENDEDOR) {
      wherePedido.usuarioId = vendedorIdQuery;
    }

    const pendientes = await Pedido.findAll({
      where: {
        ...wherePedido,
        estadoPedidoId: ESTADOS_PEDIDO.PENDIENTE,
      },
      include: [
        { model: Cliente, as: "cliente" },
        { model: EstadoPedido, as: "estadoPedido" },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    const confirmados = await Pedido.findAll({
      where: {
        ...wherePedido,
        estadoPedidoId: {
          [Op.in]: [ESTADOS_PEDIDO.CONFIRMADO, ESTADOS_PEDIDO.PREPARANDO],
        },
      },
      include: [
        { model: Cliente, as: "cliente" },
        { model: EstadoPedido, as: "estadoPedido" },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    res.json({ pendientes, confirmados });
  } catch (error) {
    console.error("❌ Error al obtener pedidos de inicio:", error);
    next(error);
  }
};
