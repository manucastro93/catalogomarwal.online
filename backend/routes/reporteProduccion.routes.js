import express from "express";
import {
  crearReporteProduccion,
  obtenerReportesProduccion,
} from "../controllers/reporteProduccion.controller.js";

const router = express.Router();

router.get("/", obtenerReportesProduccion);
router.post("/", crearReporteProduccion);

export default router;
