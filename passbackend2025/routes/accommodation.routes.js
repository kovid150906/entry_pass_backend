const express = require('express');
const router = express.Router();
const controller = require('../controllers/accommodation.controller');

// 🔐 Access pass flow
router.post('/check', controller.checkAccommodation);
router.get('/check', controller.checkAccommodation);

// 📄 Fetch pass data
router.get('/get', controller.getRecord);

// ❌ REMOVED ROUTES (NOT PRESENT ANYMORE)
// router.get('/get-image', controller.getImage);
// router.post('/upload-image', controller.uploadImage);
// router.post('/add', controller.addAccommodation);
// router.post('/bulk-add', controller.bulkAdd);
// router.get('/all', controller.getAll);

module.exports = router;
