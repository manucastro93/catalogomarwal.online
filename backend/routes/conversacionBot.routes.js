import express from 'express';
import { 
    listarConversacionesBot, 
    listarUltimasConversacionesPorCliente, 
    listarConversacionesAgrupadas, 
    responderManual 
} from '../controllers/conversacionBot.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verificarToken, listarConversacionesBot);
router.get('/ultimos', verificarToken, listarUltimasConversacionesPorCliente);
router.get('/agrupadas', verificarToken, listarConversacionesAgrupadas);
router.post('/responder', verificarToken, responderManual);

export default router;
