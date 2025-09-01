import express from 'express';
import { 
    obtenerResumenEstadisticas, 
    obtenerEstadisticasPorFecha,
    compararRangos,
    obtenerRankingEstadisticas,
    obtenerEstadisticasProducto,
    obtenerVentasPorCategoria,
    obtenerPedidosPorMesConVendedor,
    ventasPorProducto,
    ventasPorProductoResumen   
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
router.get('/ventas-producto', verificarToken, ventasPorProducto);
router.get('/ventas-producto/resumen', verificarToken, ventasPorProductoResumen);

export default router;
