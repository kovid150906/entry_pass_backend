const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const controller = require('../controllers/accommodation.controller');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

/**
 * Multer storage for USER PHOTO upload (existing)
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
  limits: { fileSize: 1 * 1024 * 1024 }
});

/**
 * Multer memory storage for GENERATED PASS upload (NEW)
 * We keep this separate so it does NOT interfere with photo uploads
 */
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 } // pass image can be larger
});

/* ===========================
   AUTH / ACCOMMODATION
=========================== */

// 🔐 Access pass check
router.post('/check', controller.checkAccommodation);
router.get('/check', controller.checkAccommodation);

// 📄 Pass data
router.get('/get', controller.getRecord);

/* ===========================
   IMAGE (PHOTO)
=========================== */

// 🖼️ Upload participant photo
router.post('/upload-image', upload.single('photo'), controller.uploadImage);

// 🖼️ Get participant photo
router.get('/get-image', controller.getImage);

/* ===========================
   PASS (GENERATED)
=========================== */

// 🧾 Save generated pass image (NEW)
router.post(
  '/save-pass',
  memoryUpload.single('pass'),
  controller.savePass
);

module.exports = router;
