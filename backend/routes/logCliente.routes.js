import express from 'express';
import { registrarLog } from '../controllers/logCliente.controller.js';

const router = express.Router();

router.post('/', registrarLog);

export default router;
