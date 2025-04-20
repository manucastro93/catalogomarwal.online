import express from 'express';
import { registrarLogCliente, listarLogsCliente } from '../controllers/logCliente.controller.js';

const router = express.Router();

router.post('/', registrarLogCliente);
router.post('/logs-cliente', listarLogsCliente);
router
export default router;
