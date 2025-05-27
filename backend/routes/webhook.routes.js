import express from 'express';
import dotenv from 'dotenv';
import { procesarMensaje } from '../services/bot.service.js';

dotenv.config();

const router = express.Router();
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

router.get('/webhook-whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post('/webhook-whatsapp', async (req, res) => {
  const body = req.body;

  if (body.object) {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body;

      console.log(`📩 Mensaje de ${from}: ${text}`);
      await procesarMensaje(text, from);
    }
  }

  res.sendStatus(200);
});

export default router;
