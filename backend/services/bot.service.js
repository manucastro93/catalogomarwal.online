import axios from 'axios';
import { obtenerProductosRelacionadosPorTexto } from '../controllers/producto.controller.js';
import { enviarMensajeTextoLibreWhatsapp } from '../helpers/enviarMensajeWhatsapp.js';
import { enviarMensajeImagenWhatsapp } from '../helpers/enviarMensajeImagenWhatsapp.js';
import { ConversacionBot } from '../models/index.js';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export const procesarMensaje = async (mensajeTexto, numeroCliente) => {
  const productosRelacionados = await obtenerProductosRelacionadosPorTexto(mensajeTexto, 3);

  // 1️⃣ Enviar productos con imagen
  for (const p of productosRelacionados.slice(0, 3)) {
    const imagen = p.Imagenes?.[0]?.url || null;
    const link = `https://www.catalogomarwal.online/producto/${p.slug || p.id}`;
    if (imagen) {
      await enviarMensajeImagenWhatsapp(numeroCliente, {
        imagen,
        texto: `${p.nombre}\n$${p.precioUnitario}\n\n🔥 Ver más: ${link}`,
      });
    }
  }

  // 2️⃣ Generar respuesta con OpenAI
  const prompt = generarPrompt(mensajeTexto, productosRelacionados);
  const respuesta = await consultarOpenAI(prompt);

  // 3️⃣ Enviar mensaje final del bot (siempre)
  await enviarMensajeTextoLibreWhatsapp(numeroCliente, respuesta);

  // 4️⃣ Registrar conversación
  await ConversacionBot.create({
    telefono: numeroCliente,
    mensajeCliente: mensajeTexto,
    respuestaBot: respuesta,
    derivar: productosRelacionados.length === 0,
  });

  return respuesta;
};

function generarPrompt(mensajeUsuario, productos) {
  let prompt = `Sos un vendedor real de una tienda online. Respondés con naturalidad, como alguien que atiende por WhatsApp todos los días. No hablás como bot ni usás frases de manual. Tu tono es cordial, relajado y profesional. Siempre intentás ayudar, seguís el interés del cliente y le ofrecés opciones si hay. Si no hay, lo decís sin vueltas pero con buena onda. No exageres, no uses tantos emojis ni signos. Si el cliente usa cierto vocabulario o tono, tratá de seguirle la onda.`;

  prompt += `\n\nEl cliente escribió: "${mensajeUsuario}".`;

  if (productos.length > 0) {
    const listado = productos.map(p => `- ${p.nombre} ($${p.precioUnitario})`).join('\n');
    prompt += `\n\nEstos son productos que podrían interesarle:\n${listado}\nPodés mencionar alguno si encaja. Respondé como si fuera una charla normal con un cliente por WhatsApp.`;
  } else {
    prompt += `\n\nNo hay coincidencias exactas, pero podés ofrecer ayuda o decir que alguien del equipo se puede contactar.`;
  }

  return prompt;
}

async function consultarOpenAI(prompt) {
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
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
