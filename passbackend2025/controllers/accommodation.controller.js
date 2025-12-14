const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Participant = require('../models/participant.model');

const JWT_SECRET = process.env.JWT_SECRET || 'access-pass-secret';
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

module.exports = {

  // 🔐 LOGIN + EDITH CHECK
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

  // 📄 GET PASS DATA
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
        
        // 🔥 NEW: Send FULL ID Number
        govtIdType: user.govt_id_type || 'ID',
        govtIdNumber: user.govt_id_number || ''
      });

    } catch (err) {
      console.error('getRecord error:', err);
      res.status(500).json({ error: 'server error' });
    }
  },

  // 🖼️ IMAGE UPLOAD
  async uploadImage(req, res) {
    try {
      if (!req.headers.authorization) return res.status(401).json({ error: 'auth required' });
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      if (!req.file) return res.status(400).json({ error: 'photo required' });

      const { idType, idNumber } = req.body;
      
      // 🔥 UPDATED VALIDATION: Ensure it's not empty and reasonable length
      if (!idType || !idNumber || idNumber.length < 5) {
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

  // 🧾 SAVE PASS
  async savePass(req, res) {
    try {
      if (!req.headers.authorization) return res.status(401).json({ error: 'auth required' });
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      if (!req.file) return res.status(400).json({ error: 'pass image required' });

      const user = await Participant.findByEmail(decoded.email);
      if (!user) return res.status(404).json({ error: 'user not found' });

      // Ensure directory exists
      const passesDir = path.join(__dirname, '..', 'passes');
      if (!fs.existsSync(passesDir)) fs.mkdirSync(passesDir, { recursive: true });

      const filename = `pass_${user.mi_no}_${Date.now()}.png`;
      const outputPath = path.join(passesDir, filename);

      await sharp(req.file.buffer)
        .resize({ width: 1200 })
        .png({ quality: 80 })
        .toFile(outputPath);

      await Participant.updatePassImageByEmail(decoded.email, filename);

      res.json({ ok: true, url: `/passes/${filename}` });

    } catch (err) {
      console.error('savePass error:', err);
      res.status(500).json({ error: 'server error' });
    }
  }

};