// src/utils/imageUtils.js
exports.getImageData = (req) => {
  if (req.file) {
    return {
      url:         req.file.path,
      publicId:    req.file.filename,      // se quiser armazenar
      originalName:req.file.originalname,
      size:        req.file.size
    };
  }
  if (req.body.url_imagem) {
    return { url: req.body.url_imagem };
  }
  return null;
};
