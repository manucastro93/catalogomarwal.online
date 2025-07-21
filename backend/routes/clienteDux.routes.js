import express from 'express';
import {
  listarClientesDux,
} from '../controllers/clienteDux.controller.js';

const router = express.Router();

router.get('/', listarClientesDux);

export default router;
