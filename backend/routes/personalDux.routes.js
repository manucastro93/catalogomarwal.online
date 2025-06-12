import express from "express";
import { listarPersonalDux } from "../controllers/personalDux.controller.js";

const router = express.Router();

router.get("/", listarPersonalDux);

export default router;
