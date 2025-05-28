import axios from 'axios';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export const consultarOpenAI = async (prompt, systemMessage) => {
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: OPENAI_MODEL,
      messages: [systemMessage, { role: 'user', content: prompt }],
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
};
