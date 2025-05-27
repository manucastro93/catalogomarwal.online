import axios from 'axios';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;

export const enviarMensajeImagenConBotonWhatsapp = async (numero, { imagen, titulo, descripcion, botonTexto, link }) => {
  const payload = {
    messaging_product: 'whatsapp',
    to: numero,
    type: 'interactive',
    interactive: {
      type: 'product',
      body: {
        text: `${titulo}\n${descripcion}`,
      },
      header: {
        type: 'image',
        image: { link: imagen },
      },
      action: {
        buttons: [
          {
            type: 'url',
            reply: {
              title: botonTexto,
              url: link,
            }
          }
        ]
      }
    }
  };

  await axios.post(`https://graph.facebook.com/v22.0/${PHONE_ID}/messages`, payload, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
};
