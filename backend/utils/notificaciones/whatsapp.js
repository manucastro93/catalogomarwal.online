import { enviarMensajeTemplateWhatsapp } from '../../helpers/enviarMensajeWhatsapp.js';
import { formatearNumeroWhatsapp } from '../formato.js';

// ✅ Enviar mensaje de confirmación de pedido
export async function enviarWhatsappPedido({ cliente, pedido, carrito, vendedor }) {
  if (!cliente || !pedido || !Array.isArray(carrito)) {
    throw new Error('Faltan datos obligatorios o el carrito no es válido para WhatsApp');
  }

  const tel = formatearNumeroWhatsapp(cliente?.telefono);
  if (!tel) return;

  const total = `$${pedido.total.toLocaleString('es-AR')}`;
  const nombreCliente = cliente.nombre;
  const idPedido = `#${pedido.id}`;

  // ⚠️ Requiere que tengas un template aprobado llamado 'confirmacion_pedido' con 3 variables
  await enviarMensajeTemplateWhatsapp(tel, 'confirmacion_pedido', [
    nombreCliente,
    idPedido,
    total,
  ]);
}

// ✅ Enviar aviso de modo edición
export async function enviarWhatsappEstadoEditando({ pedido }) {
  const cliente = await pedido.getCliente();
  const tel = formatearNumeroWhatsapp(cliente?.telefono);
  if (!tel) return;

  // ⚠️ Requiere template 'modo_edicion_activa' con 1 variable (número de pedido)
  await enviarMensajeTemplateWhatsapp(tel, 'modo_edicion_activa', [`#${pedido.id}`]);
}

// ✅ Enviar aviso de reversion de edición
export async function enviarWhatsappReversionEditando({ pedido }) {
  const cliente = await pedido.getCliente();
  const tel = formatearNumeroWhatsapp(cliente?.telefono);
  if (!tel) return;

  // ⚠️ Requiere template 'edicion_revertida' con 1 variable (número de pedido)
  await enviarMensajeTemplateWhatsapp(tel, 'edicion_revertida', [`#${pedido.id}`]);
}

// ✅ Enviar aviso de cancelación
export async function enviarWhatsappCancelacion({ cliente, pedido, vendedor }) {
  const telCliente = formatearNumeroWhatsapp(cliente?.telefono);
  const telVendedor = formatearNumeroWhatsapp(vendedor?.telefono);

  const destinatarios = [telCliente, telVendedor].filter((n) => n?.length > 9);

  // ⚠️ Requiere template 'cancelacion_pedido' con 1 variable (#pedido)
  for (const tel of destinatarios) {
    try {
      await enviarMensajeTemplateWhatsapp(tel, 'cancelacion_pedido', [`#${pedido.id}`]);
    } catch (e) {
      console.warn(`❌ Error al enviar WhatsApp de cancelación a ${tel}:`, e.message);
    }
  }
}
