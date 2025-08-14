const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller.js');
const upload = require('../middlewares/upload.middleware.js');

// POST /upload/image - Upload de imagem independente
router.post('/image', upload.single('image'), uploadController.uploadImage);

module.exports = router;