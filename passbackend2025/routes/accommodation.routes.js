const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const controller = require('../controllers/accommodation.controller');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

/**
 * 1. Multer storage for USER PHOTO upload (Disk Storage)
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, '..', UPLOAD_DIR)),
  filename: (req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(
        file.originalname
      )}`
    )
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB for user photos
});

/**
 * 2. Multer memory storage for GENERATED PASS upload (Memory Storage)
 * 🔥 LIMIT INCREASED TO 10MB to fix "File too large" errors
 */
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } 
});

/* ===========================
   ROUTES
=========================== */

// Auth & Check
router.post('/check', controller.checkAccommodation);
router.get('/check', controller.checkAccommodation);
router.get('/get', controller.getRecord);

// User Photo Upload
router.post('/upload-image', upload.single('photo'), controller.uploadImage);
router.get('/get-image', controller.getImage);

// 🔥 Save Generated Pass
router.post(
  '/save-pass',
  memoryUpload.single('pass'),
  controller.savePass
);

module.exports = router;