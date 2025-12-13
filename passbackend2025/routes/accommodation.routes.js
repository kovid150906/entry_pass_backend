const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const controller = require('../controllers/accommodation.controller');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, '..', UPLOAD_DIR)),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }
});

// 🔐 Access pass
router.post('/check', controller.checkAccommodation);
router.get('/check', controller.checkAccommodation);

// 📄 Pass data
router.get('/get', controller.getRecord);

// 🖼️ Image
router.post('/upload-image', upload.single('photo'), controller.uploadImage);
router.get('/get-image', controller.getImage);

module.exports = router;
