import axios from 'axios';
import { obtenerProductosRelacionadosPorTexto } from '../controllers/producto.controller.js';
import { enviarMensajeTextoLibreWhatsapp } from '../helpers/enviarMensajeWhatsapp.js';
import { enviarMensajeImagenWhatsapp } from '../helpers/enviarMensajeImagenWhatsapp.js';
import { ConversacionBot } from '../models/index.js';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export const procesarMensaje = async (mensajeTexto, numeroCliente) => {
  // 1️⃣ Obtener palabra clave con IA
  const keyword = await obtenerPalabraClaveDesdeOpenAI(mensajeTexto);

  // 2️⃣ Buscar productos relacionados con esa keyword
  const productosRelacionados = await obtenerProductosRelacionadosPorTexto(keyword, 3);

  // 🔍 Debug
  console.log('🧪 Productos encontrados por keyword:', productosRelacionados.map(p => p.nombre));

  // 3️⃣ Enviar productos con imagen y link
  for (const p of productosRelacionados.slice(0, 3)) {
    const imagen = p.Imagenes?.[0]?.url
      ? `https://www.catalogomarwal.online${p.Imagenes[0].url}`
      : null;

    const link = p.slug && typeof p.slug === 'string'
      ? `https://www.catalogomarwal.online/producto/${p.slug}`
      : `https://www.catalogomarwal.online/producto/${p.id}`;

    if (imagen) {
      await enviarMensajeImagenWhatsapp(numeroCliente, {
        imagen,
        texto: `${p.nombre}\n$${p.precioUnitario}\n\nVer más: ${link}`,
      });
    }
  }

  // 4️⃣ Generar mensaje final con OpenAI
  const prompt = generarPromptConversacional(mensajeTexto, productosRelacionados);
  console.log('📤 Prompt enviado a OpenAI:', prompt);

  const respuesta = await consultarOpenAI(prompt);

  // 5️⃣ Enviar mensaje del bot
  await enviarMensajeTextoLibreWhatsapp(numeroCliente, respuesta);

  // 6️⃣ Guardar conversación
  await ConversacionBot.create({
    telefono: numeroCliente,
    mensajeCliente: mensajeTexto,
    respuestaBot: respuesta,
    derivar: productosRelacionados.length === 0,
  });

  return respuesta;
};

function generarPromptConversacional(mensajeUsuario, productos) {
  let prompt = `Sos un vendedor real de una tienda online. Hablás de forma natural, directa y amable, sin parecer un bot. Tu misión es ayudar al cliente y sugerirle productos si tenés.`;
  prompt += ` El cliente dijo: "${mensajeUsuario}".`;

  if (productos.length > 0) {
    const lista = productos.map(p => `- ${p.nombre} ($${p.precioUnitario})`).join('\n');
    prompt += `\n\nEstos son productos del catálogo relacionados:\n${lista}\nRespondé de manera amigable, sin repetir la lista literal.`;
  } else {
    prompt += `\n\nNo se encontraron coincidencias exactas. Ofrecé ayuda humana o sugerencias generales, sin inventar productos.`;
  }

  return prompt;
}

async function obtenerPalabraClaveDesdeOpenAI(texto) {
  const prompt = `Del siguiente mensaje de cliente: "${texto}", extraé una sola palabra clave o frase corta que describa lo que busca (por ejemplo: mates, termos, cuchillos, etc). No des contexto ni explicación.`;

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
