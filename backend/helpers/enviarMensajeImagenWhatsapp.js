import axios from 'axios';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export const enviarMensajeImagenWhatsapp = async (numero, { imagen, texto }) => {
  await axios.post(`https://graph.facebook.com/v22.0/${PHONE_ID}/messages`, {
    messaging_product: 'whatsapp',
    to: numero,
    type: 'image',
    image: { link: imagen },
    caption: texto,
  }, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
};
