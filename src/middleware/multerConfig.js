import multer from 'multer';

// Configurar multer para almacenamiento en memoria
const storage = multer.memoryStorage();

// Filtro para aceptar solo ciertos tipos de archivos (ej. imágenes)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // Limitar tamaño a 5MB
  }
});

export default upload; 