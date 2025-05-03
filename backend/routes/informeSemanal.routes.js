import express from "express";
import { obtenerInformeSemanalEnVivo, generarInformeSemanalFinalizado } from "../controllers/informeSemanal.controller.js";

const router = express.Router();

// 🟡 GET: Informe semanal en vivo (para mostrar en el dashboard)
router.get("/vivo", obtenerInformeSemanalEnVivo);

// 🟢 POST: Generar informe finalizado (se guarda en la base)
router.post("/generar", generarInformeSemanalFinalizado);

export default router;
