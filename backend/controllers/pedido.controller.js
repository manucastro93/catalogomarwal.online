import sequelize from '../config/database.js';
import { Pedido, DetallePedido, Producto, Cliente, Usuario, Notificacion, EstadoPedido, PedidoDux, DetallePedidoDux, PersonalDux } from '../models/index.js';
import { ESTADOS_PEDIDO, ESTADOS_DUX } from '../constants/estadosPedidos.js';
import { ROLES_USUARIOS } from '../constants/rolesUsuarios.js';
import { DATOS_EMPRESA_DUX } from '../constants/datosEmpresaDux.js';
import { QueryTypes, Op } from 'sequelize';
import { enviarEmailPedido } from "../utils/notificaciones/email.js";
import { enviarWhatsappPedido } from "../utils/notificaciones/whatsapp.js";
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
      where.usuarioId = req.usuario.id;
    }

    // ✅ Si en query viene vendedorId (y el usuario NO es vendedor) filtramos por ese
    if (vendedorIdQuery && req.usuario?.rolUsuarioId !== ROLES_USUARIOS.VENDEDOR) {
      where.usuarioId = vendedorIdQuery;
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

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const pedido = await Pedido.findByPk(id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }],
        },
      ],
    });
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (pedido.estadoEdicion === true) {
      return res.status(409).json({
        message: 'El pedido está siendo editado por el cliente. No se puede cambiar el estado hasta que finalice la edición.',
      });
    }

    const estadoPedido = await EstadoPedido.findByPk(estadoPedidoId);
    if (!estadoPedido) {
      return res.status(400).json({ message: 'Estado de pedido no válido' });
    }

    const estadoAnteriorId = pedido.estadoPedidoId;
    const estadoAnterior = await EstadoPedido.findByPk(estadoAnteriorId);
    await pedido.update({ estadoPedidoId });

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

    const admins = await Usuario.findAll({
      where: { rolUsuarioId: { [Op.in]: [ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR] } },
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

    // ✅ Envío de email y WhatsApp
    try {
      const cliente = pedido.cliente;
      const vendedor = pedido.usuario;
      const carrito = pedido.detalles?.map((d) => ({
        id: d.productoId,
        nombre: d.producto?.nombre || 'Producto sin nombre',
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        unidadPorBulto: d.unidadPorBulto,
        precioPorBulto: d.precioPorBulto,
        subtotal: d.subtotal,
      })) || [];

      if (estadoNombre === 'Cancelado') {
        await enviarWhatsappCancelacion({ cliente, pedido, vendedor });
        await enviarEmailCancelacion({ cliente, pedido, vendedor });
      } else {
        await enviarWhatsappCambioEstadoPedido({ cliente, pedido, estadoNombre });
        await enviarEmailCambioEstado({ cliente, pedido, estadoNombre, vendedor });
      }
      
    } catch (notiError) {
      console.warn("❌ Error al enviar WhatsApp/email en cambio de estado:", notiError.message);
    }

    await crearAuditoria({
      tabla: 'pedidos',
      accion: 'actualiza estado',
      registroId: pedido.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Pedido ${pedido.id} actualizado a estado "${estadoNombre}".`,
      datosAntes: { estadoPedidoId: estadoAnteriorId },
      datosDespues: { estadoPedidoId },
      ip: req.ip,
    });

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
        unidadPorBulto,
        precioPorBulto: precioPorBulto,
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
    await enviarWhatsappPedido({ cliente: clienteFinal, pedido, carrito, vendedor });
    
    
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

export const enviarPedidoADux = async (req, res, next) => {
  const API_KEY = process.env.DUX_API_KEY;
  try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id, {
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }],
        },
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
      ],
    });

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (!pedido.detalles || pedido.detalles.length === 0) {
      return res.status(400).json({ message: 'El pedido no tiene detalles cargados.' });
    }

    const payload = {
      fecha: new Date(pedido.createdAt)
        .toLocaleDateString('es-AR')
        .replaceAll('/', ''),
      id_empresa: DATOS_EMPRESA_DUX.id_empresa,
      id_sucursal_empresa: DATOS_EMPRESA_DUX.id_sucursal_empresa,
      apellido_razon_social: pedido.cliente?.razonSocial || 'Sin nombre',
      categoria_fiscal: 'CONSUMIDOR_FINAL',
      productos: pedido.detalles.map((d) => {
        if (!d.producto?.sku) {
          throw new Error(`El producto "${d.producto?.nombre}" no tiene SKU`);
        }
        return {
          cod_item: d.producto.sku,
          ctd: d.cantidad,
          precio: d.precioUnitario,
        };
      }),
    };

    await axios.post(
      'https://erp.duxsoftware.com.ar/WSERP/rest/services/pedido/nuevopedido',
      payload,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    await pedido.update({ estadoPedidoId: ESTADOS_PEDIDO.PREPARANDO });

    await crearAuditoria({
      tabla: 'pedidos',
      accion: 'envia a Dux',
      registroId: pedido.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Pedido ${pedido.id} enviado a Dux y actualizado a estado PREPARANDO`,
      datosAntes: { estadoPedidoId: pedido.estadoPedidoId },
      datosDespues: { estadoPedidoId: ESTADOS_PEDIDO.PREPARANDO },
      ip: req.ip,
    });

    res.json({ message: 'Pedido enviado a Dux correctamente.' });
  } catch (error) {
    console.error('❌ Error al enviar pedido a Dux:', error);
    next(error);
  }
};

export const listarPedidosDux = async (req, res, next) => {
  try {
    const {
      pagina = 1,
      limit = 50,
      busqueda = "",
      vendedorId,
      desde,
      hasta,
    } = req.query;

    const offset = (parseInt(pagina) - 1) * parseInt(limit);
    const filtros = [];
    const replacements = {};

    // 📌 Busqueda por cliente
    if (busqueda) {
      filtros.push("p.cliente LIKE :busqueda");
      replacements.busqueda = `%${busqueda}%`;
    }

    // ✅ Estados: puede venir como array o string
let estadoQuery = req.query.estado;
console.log("estadoquery: ", estadoQuery)
const estadoIds = Array.isArray(estadoQuery)
  ? estadoQuery
  : estadoQuery
  ? [estadoQuery]
  : [];
console.log("estadoIds: ", estadoIds)
const estadosTexto = estadoIds
  .map((id) =>
    Object.entries(ESTADOS_DUX).find(([_, val]) => Number(id) === Number(val))?.[0]
  )
  .filter(Boolean);
console.log("estadosTexto: ", estadosTexto)
if (estadosTexto.length > 0) {
  const estadoPlaceholders = estadosTexto.map((_, i) => `:estado${i}`).join(", ");
  filtros.push(`UPPER(p.estado_facturacion) IN (${estadoPlaceholders})`);
  estadosTexto.forEach((estadoNombre, i) => {
    replacements[`estado${i}`] = estadoNombre.toUpperCase();
  });
}
 else {
  // Filtro por defecto si no hay estados
  filtros.push("p.estado_facturacion IN ('FACTURADO_PARCIAL', 'PENDIENTE')");
}

    // 📌 Filtro por vendedor
    if (vendedorId) {
      filtros.push("f.id_vendedor = :vendedorId");
      replacements.vendedorId = vendedorId;
    }

    // 📌 Filtro por fecha
    if (desde && hasta) {
      filtros.push("p.fecha BETWEEN :desde AND :hasta");
      replacements.desde = desde;
      replacements.hasta = hasta;
    }

    const whereClause = filtros.length ? "WHERE " + filtros.join(" AND ") : "";

    const data = await sequelize.query(
      `
      SELECT p.*, MIN(pd.nombre) AS nombre_vendedor, MIN(pd.apellido_razon_social) AS apellido_vendedor
      FROM PedidosDux p
      LEFT JOIN Facturas f ON f.nro_pedido = p.nro_pedido AND f.anulada_boolean = false
      LEFT JOIN PersonalDux pd ON pd.id_personal = f.id_vendedor
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.fecha DESC
      LIMIT :limit OFFSET :offset
      `,
      {
        replacements: {
          ...replacements,
          limit: parseInt(limit),
          offset,
        },
        type: QueryTypes.SELECT,
      }
    );

    const countRes = await sequelize.query(
      `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM PedidosDux p
      LEFT JOIN Facturas f ON f.nro_pedido = p.nro_pedido AND f.anulada_boolean = false
      LEFT JOIN PersonalDux pd ON pd.id_personal = f.id_vendedor
      ${whereClause}
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    );

    const count = countRes[0].total;
    console.log("🧪 SQL WHERE:", filtros.join(" AND "));
console.log("🧪 replacements:", replacements);

    res.json({
      data,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(count / parseInt(limit)),
      totalItems: count,
      hasNextPage: offset + data.length < count,
      hasPrevPage: offset > 0,
    });
  } catch (error) {
    console.error("❌ Error al listar pedidos Dux:", error);
    next(error);
  }
};


export const obtenerDetallesPedidoDux = async (req, res, next) => {
  try {
    const { id } = req.params;
    const detalles = await DetallePedidoDux.findAll({
      where: { pedidoDuxId: id },
    });
    res.json(detalles);
  } catch (error) {
    console.error("❌ Error al obtener detalles pedido Dux:", error);
    next(error);
  }
};
