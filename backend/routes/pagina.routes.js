import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import {
  obtenerPagina,
  actualizarPagina,
  subirLogo,
  listarBanners,
  crearBanner,
  actualizarBanner,
  eliminarBanner,
} from '../controllers/pagina.controller.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Storage para logo
const storageLogo = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads/logo'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  },
});
const uploadLogo = multer({
  storage: storageLogo,
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

// Storage para banners
const storageBanner = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads/banners'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `banner-${Date.now()}${ext}`);
  },
});
const uploadBanner = multer({ storage: storageBanner });

// Rutas
router.post('/logo', uploadLogo.single('logo'), subirLogo);

router.get('/', obtenerPagina);
router.put('/', actualizarPagina);

// Banners
router.get('/banners', listarBanners);
router.post('/banners', uploadBanner.single('imagen'), crearBanner);
router.put('/banners/:id', actualizarBanner);
router.delete('/banners/:id', eliminarBanner);

export default router;
