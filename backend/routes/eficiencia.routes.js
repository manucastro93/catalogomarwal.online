import express from "express";
import { obtenerResumenEficiencia, 
    obtenerEvolucionEficiencia, 
    obtenerEvolucionFillRate,
    obtenerOutliersFillRate,
    obtenerEficienciaPorPedido,
    obtenerEficienciaPorProducto,
    obtenerEficienciaPorCategoria,
    obtenerDetallePorProducto,
    obtenerEficienciaPorCliente,
    obtenerDetallePorCliente,
    obtenerDetallePorCategoria,
    obtenerDetallePorPedido,
    obtenerEvolucionEficienciaMensual,
    obtenerEvolucionEficienciaMensualPorCliente
} from "../controllers/eficiencia.controller.js";

const router = express.Router();

router.get("/resumen", obtenerResumenEficiencia);
router.get("/evolucion", obtenerEvolucionEficiencia);
router.get("/evolucion-fillrate", obtenerEvolucionFillRate);
router.get("/outliers-fillrate", obtenerOutliersFillRate);
router.get("/por-pedido", obtenerEficienciaPorPedido);
router.get("/por-pedido/detalle", obtenerDetallePorPedido);
router.get("/por-producto", obtenerEficienciaPorProducto);
router.get("/por-producto/detalle", obtenerDetallePorProducto);
router.get("/por-categoria", obtenerEficienciaPorCategoria);
router.get("/por-categoria/detalle", obtenerDetallePorCategoria);
router.get('/por-cliente', obtenerEficienciaPorCliente);
router.get("/por-cliente/detalle", obtenerDetallePorCliente);
router.get("/evolucion-fillrate-mensual", obtenerEvolucionEficienciaMensual);
router.get("/evolucion-fillrate-mensual-cliente", obtenerEvolucionEficienciaMensualPorCliente);

export default router;
