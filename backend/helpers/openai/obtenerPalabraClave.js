import axios from 'axios';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export const obtenerPalabraClaveDesdeOpenAI = async (texto, systemMessage) => {
  const prompt = `Del siguiente mensaje: "${texto}", extraé una palabra o frase corta que describa lo que busca el cliente (ej: mates, cuchillos, latas, bolsas de tela). Respondé solo con la palabra o frase.`;

  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: OPENAI_MODEL,
      messages: [systemMessage, { role: 'user', content: prompt }],
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
};
