import express from "express";
import { responderPregunta } from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/", responderPregunta); // 🔵 POST /api/chat

export default router;
