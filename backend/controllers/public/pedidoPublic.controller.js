import {
  Cliente,
  Pedido,
  DetallePedido,
  Producto,
  ImagenProducto,
  Usuario,
  EstadoPedido,
  IpCliente,
  IpClienteCliente,
} from '../../models/index.js';

import { Op } from 'sequelize';
import { getClientIp } from '../../utils/getClientIp.js';
import { enviarEmailEstadoEditando, enviarEmailReversionEditando, enviarEmailPedido, enviarEmailCancelacion } from '../../utils/notificaciones/email.js';
import { enviarWhatsappEstadoEditando, enviarWhatsappReversionEditando, enviarWhatsappPedido, enviarWhatsappCancelacion } from '../../utils/notificaciones/whatsapp.js';
import { verificarProductosDelCarrito } from '../../utils/validarPedido.js';
import { vincularIpConCliente } from '../../controllers/ipCliente.controller.js';
import { crearClienteConGeocodificacion, actualizarClienteExistenteConGeocodificacion } from '../../helpers/clientes.js';
import { ESTADOS_PEDIDO } from '../../constants/estadosPedidos.js';

export const crearOEditarPedido = async (req, res, next) => {
  try {
    const { cliente, carrito, usuarioId = null, pedidoId = null } = req.body;

    if (!cliente || !carrito?.length) {
      return res.status(400).json({ message: 'Faltan datos del cliente o carrito vacío' });
    }

    let clienteFinal;
    const clienteExistente = await Cliente.findOne({ where: { cuit_cuil: cliente.cuit_cuil }, paranoid: false });

    if (clienteExistente) {
      clienteFinal = await actualizarClienteExistenteConGeocodificacion(clienteExistente, cliente, usuarioId);
    } else {
      clienteFinal = await crearClienteConGeocodificacion(cliente, usuarioId);
    }

    const { errores, carritoActualizado } = await verificarProductosDelCarrito(carrito);
    if (errores.length > 0) {
      return res.status(400).json({ mensaje: 'Algunos productos fueron modificados.', errores, carritoActualizado });
    }

    if (!pedidoId) {
      const otroEditando = await Pedido.findOne({
        where: {
          clienteId: clienteFinal.id,
          estadoEdicion: true,
        }
      });
      if (otroEditando) {
        return res.status(409).json({ message: 'Ya hay un pedido en modo edición. Confirmalo o cancelalo.' });
      }
    }

    let pedido;
    if (pedidoId) {
      pedido = await Pedido.findByPk(pedidoId);
      if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

      await pedido.update({ estadoPedidoId: ESTADOS_PEDIDO.PENDIENTE, estadoEdicion: false });

      await Usuario.findAll({
        where: { rolUsuarioId: { [Op.in]: [1, 2] } }, // SUPREMO, ADMINISTRADOR
      }).then(admins =>
        Promise.all(admins.map(admin =>
          enviarEmailPedido({
            cliente: clienteFinal,
            pedido,
            carrito,
            vendedor: admin,
          })
        ))
      );

      await DetallePedido.destroy({ where: { pedidoId: pedido.id } });
    } else {
      pedido = await Pedido.create({
        clienteId: clienteFinal.id,
        usuarioId,
        total: 0,
        estadoPedidoId: ESTADOS_PEDIDO.PENDIENTE,
        estadoEdicion: false,
      });
    }

    let total = 0;
    for (const item of carrito) {
      const productoDb = await Producto.findByPk(item.id);
      if (!productoDb) continue;

      const pxb = productoDb.precioUnitario * productoDb.unidadPorBulto;
      const subtotal = item.cantidad * pxb;

      await DetallePedido.create({
        pedidoId: pedido.id,
        clienteId: clienteFinal.id,
        productoId: item.id,
        cantidad: item.cantidad,
        unidadPorBulto: productoDb.unidadPorBulto,
        precioUnitario: productoDb.precioUnitario,
        precioPorBulto: pxb,
        subtotal,
      });

      total += subtotal;
    }

    await pedido.update({ total });

    const ip = getClientIp(req);
    let ipCliente = await IpCliente.findOne({ where: { ip } });
    if (!ipCliente) ipCliente = await IpCliente.create({ ip });
    await vincularIpConCliente(ipCliente.id, clienteFinal.id);

    const vendedor = usuarioId ? await Usuario.findByPk(usuarioId) : null;

    await enviarEmailPedido({ cliente: clienteFinal, pedido, carrito, vendedor });
    await enviarWhatsappPedido({ cliente: clienteFinal, pedido, carrito, vendedor });

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

export const obtenerPedidosClientePorId = async (req, res, next) => {
  try {
    const ip = getClientIp(req);

    const ipCliente = await IpCliente.findOne({ where: { ip } });
    if (!ipCliente) return res.status(200).json([]);

    const relaciones = await IpClienteCliente.findAll({ where: { ipClienteId: ipCliente.id } });
    const clienteIds = relaciones.map((r) => r.clienteId).filter(Boolean);

    if (clienteIds.length === 0) return res.status(200).json([]);

    const pedidos = await Pedido.findAll({
      where: { clienteId: { [Op.in]: clienteIds } },
      include: [
        { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto', include: [{ model: ImagenProducto, as: 'Imagenes' }] }] },
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
        { model: EstadoPedido, as: 'estadoPedido' },
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
        { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto', include: [{ model: ImagenProducto, as: 'Imagenes' }] }] },
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
        { model: EstadoPedido, as: 'estadoPedido' },
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

    await Pedido.update(
      { estadoEdicion: false },
      {
        where: {
          clienteId: pedido.clienteId,
          estadoEdicion: true,
          id: { [Op.ne]: pedido.id },
        },
      }
    );

    await pedido.update({ estadoEdicion: true });

    await enviarEmailEstadoEditando({ pedido });
    await enviarWhatsappEstadoEditando({ pedido });

    res.json({ message: 'Pedido en edición', estadoEdicion: true });
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

    await pedido.update({ estadoEdicion: false });

    await enviarEmailReversionEditando({ pedido });
    await enviarWhatsappReversionEditando({ pedido });

    res.json({ message: 'Edición revertida', estadoEdicion: false });
  } catch (error) {
    console.error('❌ Error revertirEditando:', error);
    next(error);
  }
};

export const cancelarPedidoDesdeCliente = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id);
    if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

    await pedido.update({
      estadoPedidoId: ESTADOS_PEDIDO.CANCELADO,
      estadoEdicion: false,
    });

    const cliente = await pedido.getCliente();
    const vendedor = await pedido.getUsuario();

    await enviarEmailCancelacion({ cliente, pedido, vendedor });
    await enviarWhatsappCancelacion({ cliente, pedido, vendedor });

    res.json({ message: 'Pedido cancelado correctamente' });
  } catch (error) {
    console.error('❌ Error cancelarPedidoDesdeCliente:', error);
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
      const precioPorBulto =  precioUnitario * productoDb.unidadPorBulto;
      const subtotal = item.cantidad * precioPorBulto;

      detalles.push({
        productoId: item.id,
        nombre: productoDb.nombre,
        cantidad: item.cantidad,
        unidadPorBulto: productoDb.unidadPorBulto,
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

    if (!pedidoId) return res.status(400).json({ message: 'Pedido ID es obligatorio' });

    const pedidoOriginal = await Pedido.findByPk(pedidoId, {
      include: [
        { model: DetallePedido, as: 'detalles', include: [{ model: Producto, as: 'producto' }] },
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario' },
      ],
    });

    if (!pedidoOriginal) return res.status(404).json({ message: 'Pedido no encontrado' });

    const nuevoPedido = await Pedido.create({
      clienteId: pedidoOriginal.clienteId,
      usuarioId: pedidoOriginal.usuarioId,
      total: 0,
      estadoPedidoId: ESTADOS_PEDIDO.PENDIENTE,
      estadoEdicion: false,
    });

    let total = 0;
    for (const item of pedidoOriginal.detalles) {
      const productoDb = await Producto.findByPk(item.productoId);
      if (!productoDb) continue;

      const precioUnitario = productoDb.precioUnitario;
      const precioPorBulto =  precioUnitario * productoDb.unidadPorBulto;
      const subtotal = item.cantidad * precioPorBulto;

      await DetallePedido.create({
        pedidoId: nuevoPedido.id,
        clienteId: pedidoOriginal.clienteId,
        productoId: item.productoId,
        cantidad: item.cantidad,
        unidadPorBulto: productoDb.unidadPorBulto,
        precioUnitario,
        precioPorBulto: precioPorBulto,
        subtotal,
      });

      total += subtotal;
    }

    await nuevoPedido.update({ total });

    const vendedor = await Usuario.findByPk(nuevoPedido.usuarioId);
    await enviarEmailPedido({
      cliente: pedidoOriginal.cliente,
      pedido: nuevoPedido,
      carrito: pedidoOriginal.detalles,
      vendedor,
    });

    await enviarWhatsappPedido({
      cliente: pedidoOriginal.cliente,
      pedido: nuevoPedido,
      carrito: pedidoOriginal.detalles,
      vendedor,
    });

    res.status(201).json({
      message: 'Pedido duplicado correctamente',
      pedidoId: nuevoPedido.id,
      clienteId: pedidoOriginal.clienteId,
    });
  } catch (error) {
    console.error('❌ Error en duplicarPedido:', error);
    next(error);
  }
};
