import axios from 'axios';
import { obtenerProductosRelacionadosPorTexto } from '../controllers/producto.controller.js';
import { enviarMensajeTextoLibreWhatsapp } from '../helpers/enviarMensajeWhatsapp.js';
import { models } from '../config/database.js';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export const procesarMensaje = async (mensajeTexto, numeroCliente) => {
  const productosRelacionados = await obtenerProductosRelacionadosPorTexto(mensajeTexto);

  const prompt = generarPrompt(mensajeTexto, productosRelacionados);
  const respuesta = await consultarOpenAI(prompt);

  await enviarMensajeTextoLibreWhatsapp(numeroCliente, respuesta);

  if (productosRelacionados.length === 0) {
    const mensajeExtra = '📩 Si querés, te contacto con alguien del equipo para ayudarte mejor 😊.';
    await enviarMensajeTextoLibreWhatsapp(numeroCliente, mensajeExtra);
  }

  await models.ConversacionBot.create({
    telefono: numeroCliente,
    mensajeCliente: mensajeTexto,
    respuestaBot: respuesta,
    derivar: productosRelacionados.length === 0,
  });

  return respuesta;
};

function generarPrompt(mensajeUsuario, productos) {
  let prompt = `Actuá como un vendedor profesional. Respondé de forma clara, cordial y persuasiva. El cliente dijo: "${mensajeUsuario}".`;

  if (productos.length > 0) {
    const listado = productos.map(p => `- ${p.nombre} ($${p.precioUnitario})`).join('\n');
    prompt += `\n\nSugerí alguno de estos productos:\n${listado}\nRespondé en tono natural y cercano.`;
  } else {
    prompt += `\n\nNo se encontraron coincidencias en el catálogo. Respondé con cordialidad y ofrecé ayuda humana.`;
  }

  return prompt;
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

  return res.data.choices?.[0]?.message?.content?.trim() || 'Disculpá, no pude procesar tu consulta.';
}
