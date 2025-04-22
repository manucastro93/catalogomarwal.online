import twilio from 'twilio';
import { formatearNumeroWhatsapp } from "../formato.js";

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// 🔁 Función auxiliar para validar número antes de enviar
function esNumeroValidoParaWhatsapp(numero) {
  return typeof numero === 'string' && numero.startsWith('whatsapp:+');
}

// ✅ Enviar mensaje de confirmación de pedido
export async function enviarWhatsappPedido({ cliente, pedido, carrito, vendedor }) {
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
`;

  const numeros = [cliente.telefono, vendedor?.telefono]
    .map((tel) => `whatsapp:${formatearNumeroWhatsapp(tel)}`)
    .filter(esNumeroValidoParaWhatsapp);

  for (const numero of numeros) {
    await client.messages.create({
      body: mensaje,
      from: process.env.TWILIO_FROM,
      to: numero,
    });
  }
}

// ✅ Enviar aviso de modo edición
export async function enviarWhatsappEstadoEditando({ pedido }) {
  const telefonoCliente = pedido?.cliente?.telefono;
  if (!telefonoCliente) return;

  const numeroDestino = `whatsapp:${formatearNumeroWhatsapp(telefonoCliente)}`;

  if (!esNumeroValidoParaWhatsapp(numeroDestino)) {
    console.warn('❗ Número no válido para WhatsApp (modo edición):', numeroDestino);
    return;
  }

  await client.messages.create({
    from: process.env.TWILIO_FROM,
    to: numeroDestino,
    body: `🛠️ Tu pedido #${pedido.id} está en modo edición. ¡Podés modificarlo desde la web!`,
  });
}

// ✅ Enviar aviso de reversion de edición
export async function enviarWhatsappReversionEditando({ pedido }) {
  const cliente = await pedido.getCliente();
  const numero = `whatsapp:${formatearNumeroWhatsapp(cliente?.telefono)}`;

  if (!esNumeroValidoParaWhatsapp(numero)) {
    console.warn('❗ Número no válido para WhatsApp (reversión):', numero);
    return;
  }

  const mensaje = `
⌛ *La edición de tu pedido #${pedido.id} expiró y fue revertida a pendiente.*
`;

  await client.messages.create({
    body: mensaje,
    from: process.env.TWILIO_FROM,
    to: numero,
  });
}
