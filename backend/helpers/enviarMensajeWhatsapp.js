import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export async function enviarMensajeValidacionUsuario(to, codigo, telefonoSoporte) {
  const url = `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  if (!codigo || !telefonoSoporte) {
    console.error('❌ Faltan parámetros requeridos para la plantilla validacion_usuario');
    return;
  }

  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: 'validacion_usuario',
      language: { code: 'es' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: codigo },
            { type: 'text', text: telefonoSoporte }
          ]
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 0,
          parameters: [
            {
              type: 'text',
              text: codigo
            }
          ]
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



export async function enviarMensajeTemplateWhatsapp(to, templateName, parametros = []) {
  const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const langCode = templateName === 'validacion_usuario' ? 'es' : 'es_AR';

  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: langCode },
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

