import axios from 'axios';
import { obtenerProductosRelacionadosPorTexto } from '../controllers/producto.controller.js';
import { enviarMensajeTextoLibreWhatsapp } from '../helpers/enviarMensajeWhatsapp.js';
import { enviarMensajeImagenWhatsapp } from '../helpers/enviarMensajeImagenWhatsapp.js';
import { ConversacionBot } from '../models/index.js';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export const procesarMensaje = async (mensajeTexto, numeroCliente) => {
  // 1️⃣ Analizar intención para extraer palabra clave
  const keyword = await obtenerPalabraClaveDesdeOpenAI(mensajeTexto);

  // 2️⃣ Buscar productos usando la keyword
  const productosRelacionados = await obtenerProductosRelacionadosPorTexto(keyword, 3);

  // 3️⃣ Enviar imágenes con links
  for (const p of productosRelacionados.slice(0, 3)) {
    const imagen = p.Imagenes?.[0]?.url
      ? `https://www.catalogomarwal.online${p.Imagenes[0].url}`
      : null;
    const link = `https://www.catalogomarwal.online/producto/${p.slug || p.id}`;
    if (imagen) {
      await enviarMensajeImagenWhatsapp(numeroCliente, {
        imagen,
        texto: `${p.nombre}\n$${p.precioUnitario}\n\nVer más: ${link}`,
      });
    }
  }

  // 4️⃣ Generar mensaje final con OpenAI
  const prompt = generarPromptConversacional(mensajeTexto, productosRelacionados);
  const respuesta = await consultarOpenAI(prompt);

  // 5️⃣ Enviar mensaje del bot
  await enviarMensajeTextoLibreWhatsapp(numeroCliente, respuesta);

  // 6️⃣ Registrar en base de datos
  await ConversacionBot.create({
    telefono: numeroCliente,
    mensajeCliente: mensajeTexto,
    respuestaBot: respuesta,
    derivar: productosRelacionados.length === 0,
  });

  return respuesta;
};

function generarPromptConversacional(mensajeUsuario, productos) {
  let prompt = `Sos un vendedor real de una tienda online. Respondés como una persona, de forma natural y directa. No hablás como bot ni usás frases armadas. Tu tono es relajado, amable, profesional.`;
  prompt += ` El cliente escribió: "${mensajeUsuario}".`;

  if (productos.length > 0) {
    const lista = productos.map(p => `- ${p.nombre} ($${p.precioUnitario})`).join('\n');
    prompt += `\n\nEstos productos pueden interesarle:\n${lista}\nRespondé con lenguaje claro y natural, sin repetir esta lista textual.`;
  } else {
    prompt += `\n\nNo se encontraron coincidencias exactas, pero podés ofrecer ayuda o asistencia humana.`;
  }

  return prompt;
}

async function obtenerPalabraClaveDesdeOpenAI(texto) {
  const prompt = `Extraé una palabra o frase clave para buscar productos en base a este mensaje: "${texto}". No des contexto, solo la palabra o frase.`;

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
