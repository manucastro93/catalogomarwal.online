import express from 'express';
import { 
    obtenerResumenEstadisticas, 
    obtenerEstadisticasPorFecha,
    compararRangos,
    obtenerRankingEstadisticas,
    obtenerEstadisticasProducto,
    obtenerVentasPorCategoria
} from '../controllers/estadisticas.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/resumen',verificarToken, obtenerResumenEstadisticas);
router.get('/por-fecha', obtenerEstadisticasPorFecha);
router.get('/comparar-rangos', compararRangos);
router.get('/ranking', obtenerRankingEstadisticas);
router.get('/ventas-por-categoria', obtenerVentasPorCategoria);
router.get('/producto/:id', verificarToken, obtenerEstadisticasProducto);

export default router;
