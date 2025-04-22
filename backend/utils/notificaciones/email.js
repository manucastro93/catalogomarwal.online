import nodemailer from "nodemailer";
import { formatearPrecio } from "../formato.js";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function enviarEmailPedido({ cliente, pedido, carrito, vendedor }) {
  if (!cliente || !pedido || !Array.isArray(carrito)) {
    throw new Error("Faltan datos obligatorios o el carrito no es válido.");
  }

  const html = `
  <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 640px; margin: auto; background-color: #f9f9f9; border-radius: 10px;">
    <h2 style="color: #222; margin-bottom: 4px;">¡Gracias por tu pedido, ${cliente.nombre}!</h2>
    <p style="margin: 0 0 16px;">Confirmamos tu <strong>pedido #${pedido.id}</strong> con un total de <strong>${formatearPrecio(pedido.total)}</strong>.</p>

    <p style="margin-bottom: 4px;"><strong>Vendedor asignado:</strong> ${vendedor?.nombre || 'Nuestro equipo'}</p>

    <h3 style="margin-top: 24px;">🧾 Detalle del pedido:</h3>

    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr>
          <th style="text-align: left; border-bottom: 1px solid #ccc; padding: 8px;">Producto</th>
          <th style="text-align: center; border-bottom: 1px solid #ccc; padding: 8px;">Cantidad</th>
          <th style="text-align: right; border-bottom: 1px solid #ccc; padding: 8px;">Precio x bulto</th>
          <th style="text-align: right; border-bottom: 1px solid #ccc; padding: 8px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${carrito.map(p => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.nombre}</td>
            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #eee;">${p.cantidad}</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${formatearPrecio(p.precio)}</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">${formatearPrecio(p.precio * p.cantidad)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <p style="text-align: right; font-size: 16px; font-weight: bold; margin-top: 16px;">
      Total: ${formatearPrecio(pedido.total)}
    </p>

    <p style="margin-top: 30px;">Nos pondremos en contacto a la brevedad para coordinar la entrega.</p>

    <p style="font-size: 13px; color: #777; margin-top: 24px;">
      Este email fue generado automáticamente por Catálogo Marwal. Si tenés dudas, respondé este correo o contactá a tu vendedor.
    </p>
  </div>
`;

  await transporter.sendMail({
    from: `"Catálogo Marwal" <${process.env.EMAIL_USER}>`,
    to: [cliente.email, vendedor?.email].filter(Boolean).join(","),
    subject: `📦 Pedido #${pedido.id} confirmado – ${cliente.nombre}`,
    html,
  });
}

export async function enviarEmailEstadoEditando({ pedido }) {
  const cliente = await pedido.getCliente();
  const vendedor = await pedido.getUsuario();

  const html = `
  <p>Tu pedido <strong>#${pedido.id}</strong> ha entrado en <strong>edición</strong>. Disponés de 30 minutos para finalizar tus cambios.</p>
`;

  await transporter.sendMail({
    from: `"Catálogo Marwal" <${process.env.EMAIL_USER}>`,
    to: cliente.email,
    subject: `✏️ Pedido #${pedido.id} en edición`,
    html,
  });
}

export async function enviarEmailReversionEditando({ pedido }) {
  const cliente = await pedido.getCliente();
  const vendedor = await pedido.getUsuario();

  const html = `
  <p>La edición de tu pedido <strong>#${pedido.id}</strong> expiró y fue revertida a <strong>pendiente</strong>.</p>
`;

  await transporter.sendMail({
    from: `"Catálogo Marwal" <${process.env.EMAIL_USER}>`,
    to: cliente.email,
    subject: `⌛ Edición expirada - Pedido #${pedido.id}`,
    html,
  });
}
