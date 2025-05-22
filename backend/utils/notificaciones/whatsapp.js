import { enviarMensajeWhatsapp } from '../../helpers/enviarMensajeWhatsapp.js';
import { formatearNumeroWhatsapp } from '../formato.js';

// ✅ Enviar mensaje de confirmación de pedido
export async function enviarWhatsappPedido({ cliente, pedido, carrito, vendedor, extraMensaje = '' }) {
  if (!cliente || !pedido || !Array.isArray(carrito)) {
    throw new Error('Faltan datos obligatorios o el carrito no es válido para WhatsApp');
  }

  const mensaje = `
🛍️ *¡Gracias por tu pedido, ${cliente.nombre}!*

📦 *Pedido #${pedido.id}* confirmado

👤 *Atendido por:* ${vendedor?.nombre || 'Nuestro equipo'}
💬 Tel: ${cliente.telefono}
💰 *Total:* $${pedido.total.toLocaleString('es-AR')}

🧾 *Detalle:*
${carrito.map((p) => `• ${p.nombre} x ${p.cantidad} bultos`).join('\n')}

📲 Te mantendremos al tanto por este medio.

${extraMensaje}
  `.trim();

  const destinatarios = [cliente.telefono, vendedor?.telefono]
    .map(formatearNumeroWhatsapp)
    .filter((n) => n?.length > 9);

  for (const tel of destinatarios) {
    try {
      await enviarMensajeWhatsapp(tel, mensaje);
    } catch (e) {
      console.warn(`❌ Error al enviar WhatsApp a ${tel}:`, e.message);
    }
  }
}

// ✅ Enviar aviso de modo edición
export async function enviarWhatsappEstadoEditando({ pedido }) {
  const cliente = await pedido.getCliente();
  const tel = formatearNumeroWhatsapp(cliente?.telefono);
  if (!tel) return;

  const mensaje = `🛠️ Tu pedido #${pedido.id} está en modo edición. ¡Podés modificarlo desde la web!`;
  await enviarMensajeWhatsapp(tel, mensaje);
}

// ✅ Enviar aviso de reversion de edición
export async function enviarWhatsappReversionEditando({ pedido }) {
  const cliente = await pedido.getCliente();
  const tel = formatearNumeroWhatsapp(cliente?.telefono);
  if (!tel) return;

  const mensaje = `⌛ *La edición de tu pedido #${pedido.id} expiró y fue revertida a pendiente.*`;
  await enviarMensajeWhatsapp(tel, mensaje);
}

// ✅ Enviar aviso de cancelación
export async function enviarWhatsappCancelacion({ cliente, pedido, vendedor }) {
  const telCliente = formatearNumeroWhatsapp(cliente?.telefono);
  const telVendedor = formatearNumeroWhatsapp(vendedor?.telefono);

  const mensaje = `
🛑 *Se canceló el pedido #${pedido.id}.*

❌ Este pedido fue descartado y no será procesado.
📩 Contactalo si necesitás más info.
  `.trim();

  const destinatarios = [telCliente, telVendedor].filter((n) => n?.length > 9);

  for (const tel of destinatarios) {
    try {
      await enviarMensajeWhatsapp(tel, mensaje);
    } catch (e) {
      console.warn(`❌ Error al enviar WhatsApp de cancelación a ${tel}:`, e.message);
    }
  }
}
