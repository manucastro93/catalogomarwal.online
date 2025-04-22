import express from 'express';
import { registrarLogCliente, listarLogsCliente } from '../controllers/logCliente.controller.js';

const router = express.Router();

// POST /logs-cliente
router.post('/', registrarLogCliente);

// GET  /logs-cliente
router.get('/', listarLogsCliente);

export default router;
