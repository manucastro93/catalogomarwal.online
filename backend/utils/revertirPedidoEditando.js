import { Op } from 'sequelize';
import { Usuario, Notificacion } from '../models/index.js';
import { enviarEmailReversionEditando } from './notificaciones/email.js';
import { enviarWhatsappReversionEditando } from './notificaciones/whatsapp.js';

export async function revertirPedidoEditando(pedido) {
  if (!pedido || pedido.estadoEdicion !== 'editando') return;

  await pedido.update({
    estadoEdicion: 'pendiente',
    estado: 'pendiente'
  });

  await enviarEmailReversionEditando({ pedido });
  await enviarWhatsappReversionEditando({ pedido });

  const mensaje = `⏳ El pedido #${pedido.id} estuvo en modo edición más de 30 minutos y volvió a estado pendiente.`;

  // Notificación para el vendedor
  if (pedido.usuarioId) {
    await Notificacion.create({
      titulo: 'Edición expirada',
      mensaje,
      tipo: 'pedido',
      usuarioId: pedido.usuarioId,
      pedidoId: pedido.id,
    });
  }

  // Notificación para administradores
  const admins = await Usuario.findAll({
    where: { rol: { [Op.in]: ['administrador', 'supremo'] } },
  });

  for (const admin of admins) {
    await Notificacion.create({
      titulo: 'Edición expirada',
      mensaje,
      tipo: 'pedido',
      usuarioId: admin.id,
      pedidoId: pedido.id,
    });
  }

  console.log(`✅ Pedido #${pedido.id} revertido a pendiente`);
}
