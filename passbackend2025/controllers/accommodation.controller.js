const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Participant = require('../models/participant.model');

const JWT_SECRET = process.env.JWT_SECRET || 'access-pass-secret';
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

module.exports = {

  // 🔐 LOGIN + CHECK
  async checkAccommodation(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'email required' });

      const edithRes = await fetch(
        `https://edith-app.moodi.org/api/user/check?email=${encodeURIComponent(email)}`
      );
      const edithData = await edithRes.json();

      if (!edithData?.userExists) {
        return res.status(403).json({ error: 'not registered' });
      }

      await Participant.upsert({
        email,
        miNo: edithData.mi_id,
        name: edithData.name,
        college: edithData.college
      });

      const user = await Participant.findByEmail(email);

      const token = jwt.sign(
        { email: user.email, id: user.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        imageUploaded: user.image_uploaded === 1
      });

    } catch (err) {
      console.error('checkAccommodation error:', err);
      res.status(500).json({ error: 'server error' });
    }
  },

  // 📄 GET RECORD
  async getRecord(req, res) {
    try {
      const { email } = req.query;
      if (!email) return res.status(400).json({ error: 'email required' });

      const user = await Participant.findByEmail(email);
      if (!user) return res.status(404).json({ error: 'not found' });

      res.json({
        miNo: user.mi_no,
        name: user.name,
        email: user.email,
        college: user.college,
        imageUploaded: user.image_uploaded === 1,
        passImagePath: user.pass_image_path || null,
        // Send Full ID details
        govtIdType: user.govt_id_type || 'ID',
        govtIdNumber: user.govt_id_number || ''
      });

    } catch (err) {
      console.error('getRecord error:', err);
      res.status(500).json({ error: 'server error' });
    }
  },

  // 🖼️ UPLOAD IMAGE (PHOTO + ID)
  async uploadImage(req, res) {
    try {
      if (!req.headers.authorization) return res.status(401).json({ error: 'auth required' });
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      if (!req.file) return res.status(400).json({ error: 'photo required' });

      const { idType, idNumber } = req.body;
      
      // Validation: Ensure ID number is provided (Full Number)
      if (!idType || !idNumber || idNumber.trim().length < 5) {
          if (req.file) fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: 'Please provide valid full ID number' });
      }

      const user = await Participant.findByEmail(decoded.email);
      if (!user) return res.status(404).json({ error: 'user not found' });

      await Participant.updateImageByEmail(decoded.email, req.file.filename, idType, idNumber);
      res.json({ ok: true });

    } catch (err) {
      console.error('uploadImage error:', err);
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'server error' });
    }
  },

  // 🖼️ GET IMAGE
  async getImage(req, res) {
    try {
      const { email } = req.query;
      if (!email) return res.status(400).json({ error: 'email required' });

      const user = await Participant.findByEmail(email);
      if (!user || !user.image_path) return res.status(404).json({ error: 'no image' });

      const filePath = path.join(__dirname, '..', UPLOAD_DIR, user.image_path);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'file missing' });

      res.sendFile(filePath);

    } catch (err) {
      console.error('getImage error:', err);
      res.status(500).json({ error: 'server error' });
    }
  },

  // 🧾 SAVE GENERATED PASS (DEBUG VERSION)
  async savePass(req, res) {
    console.log("---- STARTING SAVE PASS ----");
    try {
      // 1. Check Auth
      if (!req.headers.authorization) {
        console.log("❌ No Auth Header");
        return res.status(401).json({ error: 'auth required' });
      }

      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(`✅ User Authenticated: ${decoded.email}`);

      // 2. Check File
      if (!req.file) {
        console.log("❌ No file. Multer rejected it (Size limit?) or FormData error.");
        return res.status(400).json({ error: 'pass image required or file too large' });
      }
      console.log(`✅ File received. Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);

      // 3. Find User
      const user = await Participant.findByEmail(decoded.email);
      if (!user) {
        console.log("❌ User not found");
        return res.status(404).json({ error: 'user not found' });
      }

      // 4. Check/Create Folder
      const passesDir = path.join(__dirname, '..', 'passes');
      if (!fs.existsSync(passesDir)) {
          console.log("⚠️ Passes folder missing. Creating it...");
          fs.mkdirSync(passesDir, { recursive: true });
      }

      // 5. Save File
      const filename = `pass_${user.mi_no}_${Date.now()}.png`;
      const outputPath = path.join(passesDir, filename);
      
      console.log("⚙️ Processing image with Sharp...");
      await sharp(req.file.buffer)
        .resize({ width: 1200 })
        .png({ quality: 80 })
        .toFile(outputPath);
      console.log(`✅ Image saved to: ${filename}`);

      // 6. Update Database
      await Participant.updatePassImageByEmail(decoded.email, filename);
      console.log("✅ Database Updated");

      res.json({ ok: true, url: `/passes/${filename}` });
      console.log("---- FINISHED SAVE PASS ----");

    } catch (err) {
      console.error('❌ CRITICAL SAVE PASS ERROR:', err);
      res.status(500).json({ error: 'server error', details: err.message });
    }
  }

};