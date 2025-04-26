// routes/graficos.routes.js

import express from "express";
import { 
  obtenerResumenProduccion,
  obtenerResumenPorPlanta,
  obtenerResumenPorCategoria,
  obtenerResumenPorTurno,
  obtenerResumenGeneral
} from "../controllers/graficos.controller.js";

const router = express.Router();

router.get("/produccion/resumen", obtenerResumenProduccion);
router.get("/produccion/resumen-planta", obtenerResumenPorPlanta);
router.get("/produccion/resumen-categoria", obtenerResumenPorCategoria);
router.get("/produccion/resumen-turno", obtenerResumenPorTurno);
router.get("/produccion/resumen-general", obtenerResumenGeneral);

export default router;
