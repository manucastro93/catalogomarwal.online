import { Cliente, Provincia, Localidad, Usuario, Pedido, DetallePedido, Producto, LogCliente, IpCliente, HistorialCliente, MensajeAutomatico } from '@/models';
import { Op, fn, col, literal } from 'sequelize';
import { validationResult } from 'express-validator';
import { registrarHistorialCliente } from '@/utils/registrarHistorialCliente';
import { crearAuditoria } from '@/utils/auditoria';
import { crearClienteConGeocodificacion, actualizarClienteExistenteConGeocodificacion } from '@/helpers/clientes';

export const listarClientes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      orden = 'createdAt',
      direccion = 'DESC',
      buscar = '',
      provinciaId,
      localidadId,
      vendedorId,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { email: { [Op.like]: `%${buscar}%` } },
      ];
    }

    if (req.usuario?.rol === 'vendedor') {
      where.vendedorId = req.usuario.id;
    }

    if (provinciaId) where.provinciaId = provinciaId;
    if (localidadId) where.localidadId = localidadId;
    if (vendedorId) where.vendedorId = vendedorId;

    const { count, rows } = await Cliente.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[orden, direccion]],
      include: [
        { model: Provincia, as: 'provincia' },
        { model: Localidad, as: 'localidad' },
        { model: Usuario, as: 'vendedor' },
      ],
    });

    reson({
      data: rows,
      total: count,
      pagina: Number(page),
      totalPaginas: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('❌ Error al listar clientes:', err);
    res.status(500)on({ message: 'Error al obtener clientes' });
  }
};

export const crearCliente = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400)on({ errors: errors.array() });
    }

    const nuevoCliente = await crearClienteConGeocodificacion(req.body);
    res.status(201)on(nuevoCliente);
  } catch (error) {
    console.error('❌ Error al crear cliente:', error);
    res.status(500)on({ message: 'Error al crear cliente' });
  }
};

export const actualizarCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const clienteExistente = await Cliente.findByPk(id);
    if (!clienteExistente) return res.status(404)on({ message: 'Cliente no encontrado' });

    const actualizado = await actualizarClienteExistenteConGeocodificacion(clienteExistente, req.body, req.usuario?.id);

    await registrarHistorialCliente(clienteExistente, actualizado, req.usuario?.id);

    await crearAuditoria({
      tabla: 'clientes',
      accion: 'actualiza cliente',
      registroId: actualizado.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Cliente ${actualizado.nombre} actualizado.`,
      datosAntes: clienteExistente,
      datosDespues: actualizado,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    reson(actualizado);
  } catch (error) {
    next(error);
  }
};

export const obtenerClientesConVentas = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      include: [{ model: Pedido, as: 'pedidos', attributes: [], required: false }],
      attributes: {
        include: [[fn('SUM', col('pedidos.total')), 'totalVentas']],
      },
      group: ['Cliente.id'],
    });
    reson(clientes);
  } catch (error) {
    console.error(error);
    res.status(500)on({ mensaje: 'Error al obtener clientes con ventas' });
  }
};

export const obtenerEstadisticasCliente = async (req, res) => {
  try {
    const { id } = req.params;

    // Total de pedidos y total facturado
    const pedidos = await Pedido.findAll({
      where: { clienteId: id },
      attributes: ['id', 'total', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    // Productos más comprados
    const productosTop = await DetallePedido.findAll({
      where: { clienteId: id },
      attributes: [
        'productoId',
        [fn('SUM', col('cantidad')), 'totalComprado'],
        [fn('SUM', col('subtotal')), 'totalGastado'],
      ],
      include: [{ model: Producto, as: 'producto', attributes: ['nombre'] }],
      group: ['productoId'],
      order: [[literal('totalComprado'), 'DESC']],
      limit: 5,
    });

    // Logs por IP
    const ips = await IpCliente.findAll({ where: { clienteId: id }, attributes: ['id'] });
    const ipIds = ips.map(ip => ip.id);

    const logs = await LogCliente.findAll({
      where: { ipClienteId: { [Op.in]: ipIds } },
      order: [['createdAt', 'DESC']],
    });

    reson({ pedidos, productosTop, logs });
  } catch (error) {
    console.error("❌ Error en estadísticas de cliente:", error);
    res.status(500)on({ message: 'Error al obtener estadísticas del cliente' });
  }
};

export const obtenerHistorialCliente = async (req, res) => {
  try {
    const { id } = req.params;

    const historial = await HistorialCliente.findAll({
      where: { clienteId: id },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] }],
      order: [['createdAt', 'DESC']],
    });

    reson(historial);
  } catch (error) {
    console.error('❌ Error al obtener historial del cliente:', error);
    res.status(500)on({ message: 'Error al obtener historial del cliente' });
  }
};

export const listarClientesInactivos = async (req, res) => {
  try {
    const tresMesesAtras = new Date();
    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);

    const clientes = await Cliente.findAll({
      where: {
        id: {
          [Op.notIn]: literal(`(
            SELECT DISTINCT clienteId FROM pedidos
            WHERE createdAt >= '${tresMesesAtras.toISOString().slice(0, 19).replace('T', ' ')}'
          )`)
        }
      },
      include: [
        { model: Provincia, as: 'provincia' },
        { model: Localidad, as: 'localidad' },
        { model: Usuario, as: 'vendedor' },
      ],
      order: [['createdAt', 'DESC']]
    });

    reson({ data: clientes, total: clientes.length });
  } catch (error) {
    console.error('❌ Error al listar clientes inactivos:', error);
    res.status(500)on({ message: 'Error al listar clientes inactivos' });
  }
};

export const obtenerSeguimientoCliente = async (req, res) => {
  try {
    const clienteId = req.params.id;

    const mensajes = await MensajeAutomatico.findAll({
      where: { clienteId },
      order: [['fechaEnvio', 'ASC']]
    });

    reson({ data: mensajes });
  } catch (error) {
    console.error('Error al obtener seguimiento del cliente:', error);
    res.status(500)on({ mensaje: 'Error al obtener seguimiento del cliente' });
  }
};
