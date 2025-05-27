import axios from 'axios';
import { obtenerProductosRelacionadosPorTexto } from '../controllers/producto.controller.js';
import { enviarMensajeTextoLibreWhatsapp } from '../helpers/enviarMensajeWhatsapp.js';
import { enviarMensajeImagenWhatsapp } from '../helpers/enviarMensajeImagenWhatsapp.js';
import { ConversacionBot } from '../models/index.js';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export const procesarMensaje = async (mensajeTexto, numeroCliente) => {
  // 1️⃣ Obtener historial completo del cliente
  const historial = await ConversacionBot.findAll({
    where: { telefono: numeroCliente },
    order: [['createdAt', 'ASC']],
  });

  const historialTexto = historial
    .map(c => `Cliente: ${c.mensajeCliente}\nBot: ${c.respuestaBot}`)
    .join('\n');

  // 2️⃣ Obtener palabra clave con IA
  const keyword = await obtenerPalabraClaveDesdeOpenAI(mensajeTexto);

  // 3️⃣ Buscar productos relacionados con esa keyword
  const productosRelacionados = await obtenerProductosRelacionadosPorTexto(keyword, 3);
  console.log('🧪 Productos encontrados por keyword:', productosRelacionados.map(p => p.nombre));

  // 4️⃣ Enviar productos con imagen
  for (const p of productosRelacionados.slice(0, 3)) {
    const imagen = p.Imagenes?.[0]?.url
      ? `https://www.catalogomarwal.online${p.Imagenes[0].url}`
      : null;

    const link = `https://www.catalogomarwal.online/producto/${p.id}`;

    if (imagen) {
      await enviarMensajeImagenWhatsapp(numeroCliente, {
        imagen,
        texto: `${p.nombre}\n$${p.precioUnitario}\n\nVer más: ${link}`,
      });
    }
  }

  // 5️⃣ Generar respuesta con OpenAI
  const prompt = generarPromptConversacional(mensajeTexto, productosRelacionados, historialTexto);
  console.log('📤 Prompt enviado a OpenAI:', prompt);

  const respuesta = await consultarOpenAI(prompt);

  // 6️⃣ Enviar mensaje del bot
  await enviarMensajeTextoLibreWhatsapp(numeroCliente, respuesta);

  // 7️⃣ Guardar conversación
  await ConversacionBot.create({
    telefono: numeroCliente,
    mensajeCliente: mensajeTexto,
    respuestaBot: respuesta,
    derivar: productosRelacionados.length === 0,
  });

  return respuesta;
};

function generarPromptConversacional(mensajeUsuario, productos, historialTexto) {
  let prompt = `Sos un vendedor real, cordial pero directo. Usá un tono similar al cliente. Tenés este historial:\n${historialTexto}\n\nEl cliente ahora dijo: "${mensajeUsuario}".`;

  if (productos.length > 0) {
    const lista = productos.map(p => `- ${p.nombre} ($${p.precioUnitario})`).join('\n');
    prompt += `\n\nEstos productos coinciden con lo que busca:\n${lista}\nRespondé de manera amigable, sin repetir la lista literal.`;
  } else {
    prompt += `\n\nNo se encontraron productos exactos. Ofrecé ayuda real sin parecer robot.`;
  }

  return prompt;
}

async function obtenerPalabraClaveDesdeOpenAI(texto) {
  const prompt = `Del siguiente mensaje: "${texto}", extraé una sola palabra clave o frase corta que describa lo que busca. Nada más.`;

  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return res.data.choices?.[0]?.message?.content?.trim() || texto;
}

async function consultarOpenAI(prompt) {
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return res.data.choices?.[0]?.message?.content?.trim() || 'Estoy para ayudarte, ¿qué estás buscando?';
}
