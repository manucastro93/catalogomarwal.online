import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Cambiá esto por tu email real
const destinatario = 'j.manuelcastro@hotmail.com';

const mailOptions = {
  from: `"Catálogo Marwal" <${process.env.EMAIL_USER}>`,
  to: destinatario,
  subject: '📨 ¡Test de correo exitoso!',
  html: `
    <h2>🚀 Prueba de envío de email</h2>
    <p>Este correo fue enviado desde <strong>Nodemailer</strong> y está funcionando correctamente 🎉</p>
  `,
};

transporter.sendMail(mailOptions)
  .then((info) => {
    console.log('✅ Email enviado:', info.messageId);
  })
  .catch((err) => {
    console.error('❌ Error al enviar el email:', err.message);
  });
