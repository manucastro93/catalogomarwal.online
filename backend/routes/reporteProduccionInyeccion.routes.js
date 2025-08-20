import express from "express";
import {
  crearReporteProduccion,
  obtenerReportesProduccion,
  eliminarReporteProduccion
} from "../controllers/reporteProduccionInyeccion.controller.js";
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/", verificarToken, obtenerReportesProduccion);
router.post("/", verificarToken, crearReporteProduccion);
router.delete("/:id", verificarToken, eliminarReporteProduccion);

export default router;
