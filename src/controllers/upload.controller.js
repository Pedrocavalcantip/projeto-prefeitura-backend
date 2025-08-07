const cloudinary = require('../config/cloudinary');

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhuma imagem enviada' });
    }

    // O Cloudinary já fez o upload via middleware, só retornar a URL
    res.json({
      url: req.file.path,
      public_id: req.file.filename
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};