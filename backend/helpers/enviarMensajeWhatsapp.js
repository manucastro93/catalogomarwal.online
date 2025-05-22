import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export async function enviarMensajeTemplateWhatsapp(to, templateName, parametros = []) {
  const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'es_AR' },
      components: [
        {
          type: 'body',
          parameters: parametros.map(texto => ({
            type: 'text',
            text: texto
          }))
        }
      ]
    }
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log('📤 Respuesta enviada:', data);
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
  }
}

