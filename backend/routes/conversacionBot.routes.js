import express from 'express';
import { listarConversacionesBot } from '../controllers/conversacionBot.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verificarToken, listarConversacionesBot);

export default router;
