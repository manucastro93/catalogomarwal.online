import express from "express";
import { obtenerResumenEficienciaController, 
    obtenerEvolucionEficienciaController, 
    obtenerEvolucionFillRateController,
    obtenerOutliersFillRateController,
    obtenerEficienciaPorPedidoController,
    obtenerEficienciaPorProductoController,
    obtenerEficienciaPorCategoriaController,
    obtenerDetallePorProductoController,
    obtenerEficienciaPorClienteController,
    obtenerDetallePorClienteController,
    obtenerDetallePorCategoriaController,
    obtenerDetallePorPedidoController,
    obtenerEvolucionEficienciaMensualController,
} from "../controllers/eficiencia.controller.js";

const router = express.Router();

router.get("/resumen", obtenerResumenEficienciaController);
router.get("/evolucion", obtenerEvolucionEficienciaController);
router.get("/evolucion-fillrate", obtenerEvolucionFillRateController);
router.get("/outliers-fillrate", obtenerOutliersFillRateController);
router.get("/por-pedido", obtenerEficienciaPorPedidoController);
router.get("/por-pedido/detalle", obtenerDetallePorPedidoController);
router.get("/por-producto", obtenerEficienciaPorProductoController);
router.get("/por-producto/detalle", obtenerDetallePorProductoController);
router.get("/por-categoria", obtenerEficienciaPorCategoriaController);
router.get("/por-categoria/detalle", obtenerDetallePorCategoriaController);
router.get('/por-cliente', obtenerEficienciaPorClienteController);
router.get("/por-cliente/detalle", obtenerDetallePorClienteController);
router.get("/evolucion-fillrate-mensual", obtenerEvolucionEficienciaMensualController);
router.get("/evolucion-fillrate-mensual-cliente", obtenerEficienciaPorClienteController);

export default router;
