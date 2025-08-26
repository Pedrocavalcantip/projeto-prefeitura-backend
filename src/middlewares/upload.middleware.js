const multer             = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary         = require('../config/cloudinary');

// só aceitar imagens até 5MB
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'doacoes',
    allowed_formats: ['jpg','jpeg','png','webp','avif'],
    transformation:  [{ width: 800, crop: 'limit' }]
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },         // max 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Somente arquivos de imagem são permitidos'));
    }
    cb(null, true);
  }
});

module.exports = upload;
