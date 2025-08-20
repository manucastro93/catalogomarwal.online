import express from "express";
import { 
    obtenerResumenEficienciaController, 
    obtenerEficienciaPorPedidoController,
    obtenerEficienciaPorProductoController,
    obtenerEficienciaPorCategoriaController,
    obtenerDetallePorProductoController,
    obtenerEficienciaPorClienteController,
    obtenerDetallePorClienteController,
    obtenerDetallePorCategoriaController,
    obtenerDetallePorPedidoController,
    obtenerEvolucionEficienciaMensualController,
    buscarClientesFacturasController
} from "../controllers/eficiencia.controller.js";
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/resumen",verificarToken, obtenerResumenEficienciaController);
router.get("/por-pedido",verificarToken, obtenerEficienciaPorPedidoController);
router.get("/por-pedido/detalle",verificarToken, obtenerDetallePorPedidoController);
router.get("/por-producto",verificarToken, obtenerEficienciaPorProductoController);
router.get("/por-producto/detalle",verificarToken, obtenerDetallePorProductoController);
router.get("/por-categoria",verificarToken, obtenerEficienciaPorCategoriaController);
router.get("/por-categoria/detalle",verificarToken, obtenerDetallePorCategoriaController);
router.get('/por-cliente',verificarToken, obtenerEficienciaPorClienteController);
router.get("/por-cliente/detalle",verificarToken, obtenerDetallePorClienteController);
router.get("/evolucion-fillrate-mensual",verificarToken, obtenerEvolucionEficienciaMensualController);
router.get("/evolucion-fillrate-mensual-cliente",verificarToken, obtenerEficienciaPorClienteController);
router.get("/clientes-sugeridos",verificarToken, buscarClientesFacturasController);

export default router;
