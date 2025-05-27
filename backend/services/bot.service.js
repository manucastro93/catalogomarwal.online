import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { Op } from 'sequelize';
import { Producto, ImagenProducto, ConversacionBot } from '../models/index.js';
import { obtenerProductosRelacionadosPorTexto } from '../controllers/producto.controller.js';
import { enviarMensajeTextoLibreWhatsapp } from '../helpers/enviarMensajeWhatsapp.js';
import { enviarMensajeImagenWhatsapp } from '../helpers/enviarMensajeImagenWhatsapp.js';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

let systemMessageCache;

async function getSystemMessage() {
  if (!systemMessageCache) {
    const ruta = path.join(process.cwd(), 'src', 'prompts', 'systemMessage.txt');
    const contenido = await fs.readFile(ruta, 'utf-8');
    systemMessageCache = { role: 'system', content: contenido.trim() };
  }
  return systemMessageCache;
}

export const procesarMensaje = async (mensajeTexto, numeroCliente) => {
  console.log(`📩 Mensaje de ${numeroCliente}: ${mensajeTexto}`);

  const keyword = await obtenerPalabraClaveDesdeOpenAI(mensajeTexto);
  const productosRelacionados = await obtenerProductosRelacionadosPorTexto(keyword, 3);

  console.log('🧪 Productos encontrados por keyword:', productosRelacionados.map(p => p.nombre));

  for (const p of productosRelacionados.slice(0, 3)) {
    const imagen = p.Imagenes?.[0]?.url
      ? `https://www.catalogomarwal.online${p.Imagenes[0].url}`
      : null;

    const link = p.slug
      ? `https://www.catalogomarwal.online/producto/${p.slug}`
      : `https://www.catalogomarwal.online/?buscar=${encodeURIComponent(p.nombre)}`;

    if (imagen) {
      try {
        await enviarMensajeImagenWhatsapp(numeroCliente, {
          imagen,
          texto: `${p.nombre}\n$${p.precioUnitario}\n\nVer más: ${link}`,
        });
      } catch (error) {
        console.error('❌ ERROR al enviar imagen:', error);
      }
    }
  }

  const historial = await ConversacionBot.findAll({
    where: { telefono: numeroCliente },
    order: [['createdAt', 'DESC']],
    limit: 5,
  });

  const prompt = generarPromptConversacional(mensajeTexto, productosRelacionados, historial);
  console.log('📤 Prompt enviado a OpenAI:', prompt);

  const respuesta = await consultarOpenAI(prompt);

  await enviarMensajeTextoLibreWhatsapp(numeroCliente, respuesta);

  await ConversacionBot.create({
    telefono: numeroCliente,
    mensajeCliente: mensajeTexto,
    respuestaBot: respuesta,
    derivar: productosRelacionados.length === 0,
  });

  return respuesta;
};

function generarPromptConversacional(mensajeUsuario, productos, historial) {
  let prompt = `Este es el nuevo mensaje del cliente: "${mensajeUsuario}".`;

  if (Array.isArray(historial) && historial.length > 0) {
    const ultimos = historial.reverse().map(h =>
      `🧍 Cliente: ${h.mensajeCliente}\n🤖 Bot: ${h.respuestaBot}`
    ).join('\n');
    prompt += `\nHistorial de conversación:\n${ultimos}`;
  }

  if (productos.length > 0) {
    const lista = productos.map(p => `- ${p.nombre} ($${p.precioUnitario})`).join('\n');
    prompt += `\n\nSugerí alguno de estos productos sin listar todo directamente:\n${lista}`;
  } else {
    prompt += `\n\nNo hay coincidencias exactas, pero podés ofrecer otras categorías, preguntar más info o derivar con humano.`;
  }

  prompt += `\nRespondé con empatía, como humano.`;

  return prompt;
}

async function obtenerPalabraClaveDesdeOpenAI(texto) {
  const system = await getSystemMessage();
  const prompt = `Del siguiente mensaje: "${texto}", extraé una palabra o frase corta que describa lo que busca el cliente (ej: mates, cuchillos, latas, bolsas de tela). Respondé solo con la palabra o frase.`;

  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: OPENAI_MODEL,
      messages: [system, { role: 'user', content: prompt }],
      temperature: 0.2,
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
  const system = await getSystemMessage();

  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: OPENAI_MODEL,
      messages: [system, { role: 'user', content: prompt }],
      temperature: 0.6,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return res.data.choices?.[0]?.message?.content?.trim() || '¿Querés que te ayude con algo en particular?';
}
