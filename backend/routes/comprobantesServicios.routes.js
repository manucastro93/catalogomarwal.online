import express from "express";
import {
  obtenerComprobantesServicios,
  obtenerComprobanteServicioPorId,
} from "../controllers/comprobantesServicios.controller.js";
import { verificarToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", obtenerComprobantesServicios);
router.get("/:id", obtenerComprobanteServicioPorId);


export default router;
