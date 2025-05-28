import { ConversacionBot, Cliente, MensajeAutomatico } from '../models/index.js';
import { obtenerProductosRelacionadosPorTexto } from '../controllers/producto.controller.js';
import { enviarMensajeTextoLibreWhatsapp } from '../helpers/enviarMensajeWhatsapp.js';
import { enviarMensajeImagenWhatsapp } from '../helpers/enviarMensajeImagenWhatsapp.js';
import { getSystemMessage } from '../helpers/getSystemMessage.js';
import { obtenerPalabraClaveDesdeOpenAI } from '../helpers/openai/obtenerPalabraClave.js';
import { consultarOpenAI } from '../helpers/openai/consultarOpenAI.js';
import { generarPromptConversacional } from '../helpers/openai/generarPromptConversacional.js';
import { formatearNumeroWhatsapp } from '../utils/formato.js';

export const procesarMensaje = async (mensajeTexto, numeroCliente) => {
  console.log(`📩 Mensaje de ${numeroCliente}: ${mensajeTexto}`);

  const telefonoNormalizado = formatearNumeroWhatsapp(numeroCliente);
  const cliente = await Cliente.findOne({ where: { telefono: telefonoNormalizado } });

  // 🧠 Seguimiento automático
  if (cliente) {
    const mensajePendiente = await MensajeAutomatico.findOne({
      where: {
        clienteId: cliente.id,
        tipo: 'inactivo_recordatorio',
        estado: 'pendiente',
      },
    });

    if (mensajePendiente) {
      const texto = mensajeTexto.toLowerCase();
      const esInteresado = ['ver', 'después', 'reviso', 'voy a mirar', 'más tarde', 'pasame'].some(p => texto.includes(p));
      const esCancelado = ['no me interesa', 'por ahora no', 'gracias', 'no quiero'].some(p => texto.includes(p));

      if (esInteresado) {
        await mensajePendiente.update({ estado: 'interesado', respuestaCliente: mensajeTexto });
        console.log(`📌 Cliente ${numeroCliente} marcado como interesado.`);
      } else if (esCancelado) {
        await mensajePendiente.update({ estado: 'cancelado', respuestaCliente: mensajeTexto });
        console.log(`📌 Cliente ${numeroCliente} marcado como cancelado.`);
      }
    }
  }

  const ultima = await ConversacionBot.findOne({
    where: { telefono: numeroCliente },
    order: [['createdAt', 'DESC']],
  });

  if (ultima?.intervencionManual) {
    console.log(`⛔ Chat con ${numeroCliente} intervenido manualmente.`);
    return;
  }

  const systemMessage = await getSystemMessage();
  const usarTextoComoKeyword = mensajeTexto.length < 20;
  const keyword = usarTextoComoKeyword ? mensajeTexto : await obtenerPalabraClaveDesdeOpenAI(mensajeTexto, systemMessage);
  const productosRelacionados = await obtenerProductosRelacionadosPorTexto(keyword, 3);

  console.log('🧪 Productos encontrados:', productosRelacionados.map(p => p.nombre));

  const urlsEnviadas = new Set();

  for (const p of productosRelacionados.slice(0, 3)) {
    const imagen = p.Imagenes?.[0]?.url
      ? `https://www.catalogomarwal.online${p.Imagenes[0].url}`
      : null;

    const texto = `${p.nombre}\n$${p.precioUnitario}\n\nBuscalo por nombre en la web.`;

    if (imagen && !urlsEnviadas.has(imagen)) {
      try {
        await enviarMensajeImagenWhatsapp(numeroCliente, { imagen, texto });
        urlsEnviadas.add(imagen);
      } catch (error) {
        console.error('❌ Error al enviar imagen:', error);
      }
    }
  }

  const historial = await ConversacionBot.findAll({
    where: { telefono: numeroCliente },
    order: [['createdAt', 'DESC']],
    limit: 15,
  });

  const prompt = generarPromptConversacional(mensajeTexto, productosRelacionados, historial);
  console.log('📤 Prompt enviado a OpenAI:', prompt);

  const respuesta = await consultarOpenAI(prompt, systemMessage);

  await enviarMensajeTextoLibreWhatsapp(numeroCliente, respuesta);

  await ConversacionBot.create({
    telefono: numeroCliente,
    mensajeCliente: mensajeTexto,
    respuestaBot: respuesta,
    derivar: productosRelacionados.length === 0,
    intervencionManual: false,
  });

  return respuesta;
};
