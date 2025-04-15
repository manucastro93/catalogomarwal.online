import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = 'public/uploads/productos';
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const nombre = `${Date.now()}-${file.originalname}`;
    cb(null, nombre);
  },
});

export const uploadImagenesProducto = multer({ storage });
