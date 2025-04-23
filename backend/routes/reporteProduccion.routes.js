import express from "express";
import {
  crearReporteProduccion,
  obtenerReportesProduccion,
  eliminarReporteProduccion
} from "../controllers/reporteProduccion.controller.js";
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/", obtenerReportesProduccion);
router.post("/", crearReporteProduccion);
router.delete("/reportes-produccion/:id", verificarToken, eliminarReporteProduccion);

export default router;
