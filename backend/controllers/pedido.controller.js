import sequelize from '../config/database.js';
import { Pedido, DetallePedido, Producto, Cliente, Usuario, Notificacion, EstadoPedido, PedidoDux, DetallePedidoDux, PersonalDux, ClienteDux, Factura } from '../models/index.js';
import { ESTADOS_PEDIDO, ESTADOS_DUX } from '../constants/estadosPedidos.js';
import { ROLES_USUARIOS } from '../constants/rolesUsuarios.js';
import { DATOS_EMPRESA_DUX } from '../constants/datosEmpresaDux.js';
import { QueryTypes, Op, Sequelize } from 'sequelize';
import { enviarEmailPedido } from "../utils/notificaciones/email.js";
import { enviarWhatsappPedido } from "../utils/notificaciones/whatsapp.js";
import { crearClienteConGeocodificacion } from '../helpers/clientes.js';
import { crearAuditoria } from '../utils/auditoria.js';
import { resolverIdVendedor } from '../helpers/resolverIdVendedor.js';

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

    if (req.usuario?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR) {
      where.usuarioId = req.usuario.id;
    }

    if (vendedorIdQuery && req.usuario?.rolUsuarioId !== ROLES_USUARIOS.VENDEDOR) {
      where.usuarioId = vendedorIdQuery;
    }

    if (estado) {
      where.estadoPedidoId = estado;
    }

    const whereCliente = busqueda
      ? { nombre: { [Op.like]: `%${busqueda}%` } }
      : undefined;

    const camposValidos = ['id', 'createdAt', 'updatedAt', 'total']; // Ajustá según tus columnas reales

    const orderBy = (() => {
      if (orden === 'cliente') return [[{ model: Cliente, as: 'cliente' }, 'nombre', direccion]];
      if (orden === 'vendedor') return [[{ model: Usuario, as: 'usuario' }, 'nombre', direccion]];
      if (!camposValidos.includes(orden)) return [['createdAt', 'DESC']];
      return [[orden, direccion]];
    })();
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

export const obtenerPedidosDuxInicio = async (req, res, next) => {
  try {
    const idVendedor = await resolverIdVendedor(req);

    const baseFromJoin = `
      FROM PedidosDux p
      LEFT JOIN (
        SELECT f.nro_pedido, MAX(f.id_vendedor) AS id_vendedor
        FROM Facturas f
        GROUP BY f.nro_pedido
      ) fx ON fx.nro_pedido = p.nro_pedido
      LEFT JOIN ClientesDux c ON c.cliente = p.cliente
      LEFT JOIN PersonalDux pd ON pd.id_personal = COALESCE(fx.id_vendedor, c.vendedorId)
      WHERE (:idVendedor IS NULL OR COALESCE(fx.id_vendedor, c.vendedorId) = :idVendedor)
    `;

    // columnas comunes que queremos devolver al front
    const selectCols = `
      SELECT DISTINCT
        p.*,
        COALESCE(fx.id_vendedor, c.vendedorId) AS vendedorId,
        CASE
          WHEN fx.id_vendedor IS NOT NULL THEN 'FACTURA'
          WHEN c.vendedorId IS NOT NULL THEN 'CLIENTE'
          ELSE NULL
        END AS origen_vendedor,
        pd.nombre AS nombre_vendedor,
        pd.apellido_razon_social AS apellido_vendedor
    `;

    const [pendientes] = await sequelize.query(
      `
      ${selectCols}
      ${baseFromJoin}
          AND p.estado_facturacion IN ('PENDIENTE','FACTURADO_PARCIAL')
        ORDER BY p.fecha DESC, p.nro_pedido DESC
        LIMIT 5
        `,
            { replacements: { idVendedor } }
    );

    const [confirmados] = await sequelize.query(
      `
      ${selectCols}
      ${baseFromJoin}
        AND p.estado_facturacion IN ('FACTURADO','CERRADO')
      ORDER BY p.fecha DESC, p.nro_pedido DESC
      LIMIT 5
      `,
          { replacements: { idVendedor } }
        );

    res.json({ pendientes, confirmados });

  } catch (error) {
    console.error('❌ Error al obtener pedidos Dux de inicio:', error);
    next(error);
  }
};

export const obtenerPedidoDuxPorId = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID inválido' });

    const pedido = await PedidoDux.findByPk(id);
    if (!pedido) return res.status(404).json({ message: 'Pedido Dux no encontrado' });

    const [detalles, clienteDux, vendedorPorFactura] = await Promise.all([
      DetallePedidoDux.findAll({
        where: { pedidoDuxId: id },        // <-- FIX
        order: [['id', 'ASC']],
      }),
      ClienteDux.findOne({
        where: { cliente: pedido.cliente },
        paranoid: false,
      }),
      Factura.findOne({
        where: { nro_pedido: pedido.nro_pedido },
        attributes: [[Sequelize.fn('MAX', Sequelize.col('id_vendedor')), 'id_vendedor']],
        raw: true,
      }),
    ]);

    const vendedorIdResuelto =
      vendedorPorFactura?.id_vendedor ||
      clienteDux?.vendedorId ||
      null;

    let nombre_vendedor = null;
    let apellido_vendedor = null;
    if (vendedorIdResuelto) {
      const vendedor = await PersonalDux.findOne({
        where: { id_personal: vendedorIdResuelto },
        attributes: ['nombre', 'apellido_razon_social', 'id_personal'],
        paranoid: false,
      });
      if (vendedor) {
        nombre_vendedor = vendedor.nombre || null;
        apellido_vendedor = vendedor.apellido_razon_social || null;
      }
    }

    const data = {
      ...pedido.toJSON(),
      tipo: 'dux',
      clienteDux: clienteDux ? clienteDux.toJSON() : null,
      detalles: detalles.map(d => d.toJSON()),
      nombre_vendedor,
      apellido_vendedor,
    };

    return res.json(data);
  } catch (error) {
    console.error('❌ Error en obtenerPedidoDuxPorId:', error);
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
      desde,
      hasta,
    } = req.query;

    const idVendedor = await resolverIdVendedor(req);

    const limitNum = parseInt(limit);
    const offset = (parseInt(pagina) - 1) * limitNum;

    // ---------------- Estados ----------------
    // Puede venir ?estado=1&estado=2 ... (ids de ESTADOS_DUX) o nada -> default PENDIENTE/FACTURADO_PARCIAL
    let estadoQuery = req.query.estado;
    const estadoIds = Array.isArray(estadoQuery) ? estadoQuery : estadoQuery ? [estadoQuery] : [];

    const estadosTexto = estadoIds
      .map((id) => Object.entries(ESTADOS_DUX).find(([_, val]) => Number(id) === Number(val))?.[0])
      .filter(Boolean)
      .map((s) => String(s).toUpperCase());

    const usarEstados = estadosTexto.length
      ? estadosTexto
      : ['PENDIENTE', 'FACTURADO_PARCIAL']; // default

    // ---------------- Filtros dinámicos ----------------
    const filtros = [];
    const params = { limit: limitNum, offset, estados: usarEstados, idVendedor: idVendedor ?? null };

    if (busqueda) {
      filtros.push("(p.cliente LIKE :busqueda OR CAST(p.nro_pedido AS CHAR) LIKE :busqueda)");
      params.busqueda = `%${busqueda}%`;
    }

    if (desde && hasta) {
      filtros.push("p.fecha BETWEEN :desde AND :hasta");
      params.desde = desde;
      params.hasta = hasta;
    }

    // Si llegó un vendedor resuelto, se filtra por él (vendedor de factura o del cliente)
    if (idVendedor) {
      filtros.push("t.vendedorId = :idVendedor");
    }

    const whereClause = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

    // ---------------- Subconsulta para vendedorId / origen ----------------
    // fx: colapsa facturas por pedido (ignorando anuladas)
    const subVendedor = `
      SELECT
        p2.id,
        COALESCE(fx.id_vendedor, c.vendedorId) AS vendedorId,
        CASE
          WHEN fx.id_vendedor IS NOT NULL THEN 'FACTURA'
          WHEN c.vendedorId IS NOT NULL THEN 'CLIENTE'
          ELSE NULL
        END AS origen_vendedor
      FROM PedidosDux p2
      LEFT JOIN (
        SELECT f.nro_pedido, MAX(f.id_vendedor) AS id_vendedor
        FROM Facturas f
        WHERE (f.anulada_boolean IS NULL OR f.anulada_boolean = 0)
        GROUP BY f.nro_pedido
      ) fx ON fx.nro_pedido = p2.nro_pedido
      LEFT JOIN ClientesDux c ON c.cliente = p2.cliente
    `;

    // ---------------- Data ----------------
    const data = await sequelize.query(
      `
      SELECT
        p.*,
        t.vendedorId,
        t.origen_vendedor,
        pd.nombre AS nombre_vendedor,
        pd.apellido_razon_social AS apellido_vendedor
      FROM PedidosDux p
      LEFT JOIN (${subVendedor}) t ON t.id = p.id
      LEFT JOIN PersonalDux pd ON pd.id_personal = t.vendedorId
      ${whereClause}
        ${whereClause ? 'AND' : 'WHERE'} UPPER(p.estado_facturacion) IN (:estados)
      ORDER BY p.fecha DESC, p.nro_pedido DESC
      LIMIT :limit OFFSET :offset
      `,
      { type: QueryTypes.SELECT, replacements: params }
    );

    // ---------------- Count ----------------
    const countRow = await sequelize.query(
      `
      SELECT COUNT(*) AS total
      FROM (
        SELECT p.id
        FROM PedidosDux p
        LEFT JOIN (${subVendedor}) t ON t.id = p.id
        ${whereClause}
          ${whereClause ? 'AND' : 'WHERE'} UPPER(p.estado_facturacion) IN (:estados)
        GROUP BY p.id
      ) x
      `,
      { type: QueryTypes.SELECT, replacements: params }
    );

    const count = Number(countRow[0]?.total ?? 0);

    res.json({
      data,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(count / limitNum),
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

export const obtenerProductosPedidosPendientes = async (req, res, next) => {
  try {
    const { desde, hasta, textoProducto, categoriaId } = req.query;
    const replacements = {};
    const condiciones = ["p.estado_facturacion != 'CERRADO'"];

    if (desde && hasta) {
      condiciones.push("p.fecha BETWEEN :desde AND :hasta");
      replacements.desde = desde;
      replacements.hasta = hasta;
    }

    if (textoProducto) {
      condiciones.push(`(dp.descripcion LIKE :textoProducto OR dp.codItem LIKE :textoProducto)`);
      replacements.textoProducto = `%${textoProducto}%`;
    }

    if (categoriaId) {
      condiciones.push("cat.id = :categoriaId");
      replacements.categoriaId = categoriaId;
    }

    const whereClause = condiciones.length ? "WHERE " + condiciones.join(" AND ") : "";

    const resultados = await sequelize.query(
      `
      SELECT
        codItem,
        descripcion,
        categoria,
        MAX(stock) AS stock,
        SUM(cantidad_pedida) AS cantidad_pedida,
        SUM(cantidad_facturada) AS cantidad_facturada,
        SUM(pendiente) AS cantidad_pendiente
      FROM (
        SELECT
          dp.codItem AS codItem,
          dp.descripcion,
          prod.stock AS stock,
          cat.nombre AS categoria,
          dp.cantidad AS cantidad_pedida,
          COALESCE(SUM(df.cantidad), 0) AS cantidad_facturada,
          (dp.cantidad - COALESCE(SUM(df.cantidad), 0)) AS pendiente
        FROM DetallePedidosDux dp
        INNER JOIN PedidosDux p ON p.id = dp.pedidoDuxId
        LEFT JOIN Productos prod ON CONVERT(prod.sku USING utf8mb4) COLLATE utf8mb4_general_ci = dp.codItem
        LEFT JOIN Categorias cat ON cat.id = prod.categoriaId
        LEFT JOIN Facturas f ON f.nro_pedido = p.nro_pedido AND f.anulada_boolean = false
        LEFT JOIN DetalleFacturas df 
          ON df.codItem = dp.codItem 
          AND df.facturaId = f.id
          AND f.nro_pedido = p.nro_pedido
        ${whereClause}
        GROUP BY dp.pedidoDuxId, dp.codItem, dp.descripcion, cat.nombre, dp.cantidad, prod.stock
        HAVING pendiente > 0
      ) AS sub
      GROUP BY codItem, descripcion, categoria
      ORDER BY cantidad_pendiente DESC
      `,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json(resultados);
  } catch (error) {
    console.error("❌ Error en obtenerProductosPedidosPendientes:", error);
    next(error);
  }
};

export const obtenerPedidosPendientesPorProducto = async (req, res, next) => {
  try {
    const { codItem } = req.params;
    const { desde, hasta, vendedorId } = req.query;

    const replacements = { codItem };
    const condiciones = [
      "dp.codItem = :codItem",
      "p.estado_facturacion != 'CERRADO'"
    ];

    if (desde && hasta) {
      condiciones.push("p.fecha BETWEEN :desde AND :hasta");
      replacements.desde = desde;
      replacements.hasta = hasta;
    }

    if (vendedorId) {
      condiciones.push("f.id_vendedor = :vendedorId");
      replacements.vendedorId = vendedorId;
    }

    const whereClause = condiciones.length ? "WHERE " + condiciones.join(" AND ") : "";

    const pedidos = await sequelize.query(
      `
      SELECT
        p.nro_pedido,
        p.cliente,
        p.fecha,
        dp.cantidad AS cantidad_pedida,
        COALESCE(SUM(df.cantidad), 0) AS cantidad_facturada,
        (dp.cantidad - COALESCE(SUM(df.cantidad), 0)) AS cantidad_pendiente
      FROM DetallePedidosDux dp
      INNER JOIN PedidosDux p ON p.id = dp.pedidoDuxId
      LEFT JOIN Facturas f ON f.nro_pedido = p.nro_pedido AND f.anulada_boolean = false
      LEFT JOIN DetalleFacturas df 
        ON df.codItem = dp.codItem 
        AND df.facturaId = f.id
        AND f.nro_pedido = p.nro_pedido
      ${whereClause}
      GROUP BY p.nro_pedido, p.cliente, p.fecha, dp.cantidad
      HAVING cantidad_pendiente > 0
      ORDER BY p.fecha DESC
      `,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json(pedidos);
  } catch (error) {
    console.error("❌ Error en obtenerPedidosPendientesPorProducto:", error);
    next(error);
  }
};

export const obtenerPedidoPorClienteYFecha = async (req, res) => {
  const { cliente, fecha } = req.query;

  try {
    const pedido = await PedidoDux.findOne({
      where: {
        cliente,
        fecha: new Date(fecha)
      },
      include: [
        {
          model: DetallePedidoDux,
          as: 'items',
          required: false,
        }
      ]
    });

    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (pedido) {
      pedido.dataValues.detalles = pedido.dataValues.items;
      delete pedido.dataValues.items;
    }

    res.json(pedido);
  } catch (err) {
    console.error('❌ Error al buscar pedido:', err);
    res.status(500).json({ message: 'Error al buscar pedido' });
  }
};