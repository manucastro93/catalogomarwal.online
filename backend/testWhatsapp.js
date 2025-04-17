import 'dotenv/config';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// Cambiá esto por tu número (el que registraste en el sandbox)
const numeroDestino = 'whatsapp:+5491130544702'; // ← tu número real

const mensaje = `
🚀 ¡Hola Manu!

Este es un mensaje de prueba enviado desde tu integración de WhatsApp con Twilio.

✅ Si estás viendo esto, ¡todo funciona perfecto!
`;

client.messages
  .create({
    from: process.env.TWILIO_FROM,
    to: numeroDestino,
    body: mensaje,
  })
  .then((msg) => {
    console.log('✅ Mensaje enviado con éxito:', msg.sid);
  })
  .catch((err) => {
    console.error('❌ Error al enviar mensaje:', err.message);
  });
