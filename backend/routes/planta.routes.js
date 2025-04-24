import express from "express";
import { obtenerPlantas } from "../controllers/planta.controller.js";

const router = express.Router();

router.get("/", obtenerPlantas);

export default router;
