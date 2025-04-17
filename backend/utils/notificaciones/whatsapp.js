import twilio from 'twilio';

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

export async function enviarWhatsappPedido({ cliente, pedido, carrito, vendedor }) {
  const mensaje = `
🛍️ *¡Gracias por tu pedido, ${cliente.nombre}!*

📦 *Pedido #${pedido.id}* confirmado

👤 *Atendido por:* ${vendedor?.nombre || 'Nuestro equipo'}
💬 Tel: ${cliente.telefono}
💰 *Total:* $${pedido.total}

🧾 *Detalle:*
${carrito.map((p) => `• ${p.nombre} x ${p.cantidad} bultos`).join('\n')}

📲 Te mantendremos al tanto por este medio.
`;


  function formatearNumeroWhatsapp(num) {
    const limpio = num.replace(/\D/g, '');
    if (limpio.startsWith('549')) return `whatsapp:+${limpio}`;
    if (limpio.startsWith('54')) return `whatsapp:+${limpio}`;
    if (limpio.startsWith('0')) return `whatsapp:+54${limpio.slice(1)}`;
    if (limpio.length >= 10 && limpio.length <= 11) return `whatsapp:+549${limpio}`;
    return null;
  }

  const numeros = [cliente.telefono, vendedor?.telefono]
    .map(formatearNumeroWhatsapp)
    .filter(Boolean);

  for (const numero of numeros) {
    await client.messages.create({
      body: mensaje,
      from: process.env.TWILIO_FROM,
      to: numero,
    });
  }
}
