import { ConversacionBot } from '../models/index.js';
import { obtenerProductosRelacionadosPorTexto } from '../controllers/producto.controller.js';
import { enviarMensajeTextoLibreWhatsapp } from '../helpers/enviarMensajeWhatsapp.js';
import { enviarMensajeImagenWhatsapp } from '../helpers/enviarMensajeImagenWhatsapp.js';
import { getSystemMessage } from '../helpers/getSystemMessage.js';
import { obtenerPalabraClaveDesdeOpenAI } from '../helpers/openai/obtenerPalabraClave.js';
import { consultarOpenAI } from '../helpers/openai/consultarOpenAI.js';
import { generarPromptConversacional } from '../helpers/openai/generarPromptConversacional.js';

export const procesarMensaje = async (mensajeTexto, numeroCliente) => {
  console.log(`📩 Mensaje de ${numeroCliente}: ${mensajeTexto}`);

  const ultima = await ConversacionBot.findOne({
    where: { telefono: numeroCliente },
    order: [['createdAt', 'DESC']],
  });

  if (ultima?.intervencionManual) {
    console.log(`⛔ Chat con ${numeroCliente} intervenido manualmente. No responde el bot.`);
    return;
  }

  const systemMessage = await getSystemMessage();
  const keyword = await obtenerPalabraClaveDesdeOpenAI(mensajeTexto, systemMessage);
  const productosRelacionados = await obtenerProductosRelacionadosPorTexto(keyword, 3);

  console.log('🧪 Productos encontrados por keyword: ', productosRelacionados.map(p => p.nombre));

  for (const p of productosRelacionados.slice(0, 3)) {
    const imagen = p.Imagenes?.[0]?.url
      ? `https://www.catalogomarwal.online${p.Imagenes[0].url}`
      : null;

    const texto = `${p.nombre}\n$${p.precioUnitario}\n\nBuscalo por nombre en la web.`;

    if (imagen) {
      try {
        await enviarMensajeImagenWhatsapp(numeroCliente, { imagen, texto });
      } catch (error) {
        console.error('❌ ERROR al enviar imagen:', error);
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

