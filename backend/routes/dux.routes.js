import express from 'express';
import { syncProductosDux } from '../controllers/dux.controller.js';

const router = express.Router();

router.post('/sync-productos', syncProductosDux);

export default router;
