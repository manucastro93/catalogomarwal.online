import express from 'express';
import { 
    obtenerResumenEstadisticas, 
    obtenerEstadisticasPorFecha,
    compararRangos,
    obtenerRankingEstadisticas,
    obtenerEstadisticasProducto,
    obtenerVentasPorCategoria,
    obtenerPedidosPorMesConVendedor
} from '../controllers/estadisticas.controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/resumen',verificarToken, obtenerResumenEstadisticas);
router.get('/por-fecha',verificarToken, obtenerEstadisticasPorFecha);
router.get('/comparar-rangos',verificarToken, compararRangos);
router.get('/ranking',verificarToken, obtenerRankingEstadisticas);
router.get('/ventas-por-categoria',verificarToken, obtenerVentasPorCategoria);
router.get('/pedidos-por-mes', verificarToken, obtenerPedidosPorMesConVendedor);
router.get('/producto/:id', verificarToken, obtenerEstadisticasProducto);

export default router;
