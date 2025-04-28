import express from "express";
import { 
  obtenerResumenProduccion,
  obtenerResumenProduccionPorPlanta,
  obtenerResumenProduccionPorCategoria,
  obtenerResumenProduccionPorTurno,
  obtenerResumenProduccionGeneral,
  obtenerEvolucionProduccion
} from "../controllers/graficos.controller.js";

const router = express.Router();

router.get("/produccion/resumen", obtenerResumenProduccion);
router.get("/produccion/resumen-planta", obtenerResumenProduccionPorPlanta);
router.get("/produccion/resumen-categoria", obtenerResumenProduccionPorCategoria);
router.get("/produccion/resumen-turno", obtenerResumenProduccionPorTurno);
router.get("/produccion/resumen-general", obtenerResumenProduccionGeneral);
router.get("/produccion/evolucion", obtenerEvolucionProduccion);

export default router;
