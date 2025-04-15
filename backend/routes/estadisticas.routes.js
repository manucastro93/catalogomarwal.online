import express from 'express';
import { resumenDelMes } from '../controllers/estadisticas.controller.js';

const router = express.Router();

router.get('/resumen', resumenDelMes);

export default router;
