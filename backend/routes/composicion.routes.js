import { Router } from 'express';
import {
  listarComposicionesPorProducto,
  agregarComposicion,
  editarComposicion,
  eliminarComposicion,
  guardarComposicion
} from '../controllers/composicion.controller.js';

const router = Router();

router.get('/producto/:productoId', listarComposicionesPorProducto);
router.post('/', agregarComposicion);
router.put('/:id', editarComposicion);
router.delete('/:id', eliminarComposicion);
router.post('/:id/composicion', guardarComposicion);

export default router;
