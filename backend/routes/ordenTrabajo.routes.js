import express from "express";
import {
  crearOrdenTrabajo,
  obtenerOrdenesTrabajo,
  eliminarOrdenTrabajo
} from "../controllers/ordenTrabajo.controller.js";
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get("/", obtenerOrdenesTrabajo);
router.post("/", verificarToken, crearOrdenTrabajo);
router.delete("/:id", verificarToken, eliminarOrdenTrabajo);

export default router;
