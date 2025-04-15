import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: 'uploads/excel/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `excel-${Date.now()}${ext}`);
  },
});

const uploadExcel = multer({ storage });

export default uploadExcel;
