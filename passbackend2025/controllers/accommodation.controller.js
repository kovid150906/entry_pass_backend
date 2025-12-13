const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const Participant = require('../models/participant.model');

const JWT_SECRET = process.env.JWT_SECRET || 'access-pass-secret';

module.exports = {

  async checkAccommodation(req, res) {
    try {
      const email = req.body.email;
      if (!email) return res.status(400).json({ error: 'email required' });

      // 🔥 FETCH PROFILE FROM EDITH
      const edithRes = await fetch(
        `https://edith-app.moodi.org/api/user/check?email=${encodeURIComponent(email)}`
      );
      const edithData = await edithRes.json();

      if (!edithData?.userExists) {
        return res.status(403).json({ error: 'not registered' });
      }

      // UPSERT INTO DB
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

      return res.json({
        token,
        imageUploaded: user.image_uploaded === 1
      });

    } catch (err) {
      console.error('checkAccommodation error', err);
      res.status(500).json({ error: 'server error' });
    }
  },

  async getRecord(req, res) {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'email required' });

    const user = await Participant.findByEmail(email);
    if (!user) return res.status(404).json({ error: 'not found' });

    res.json({
      miNo: user.mi_no,
      name: user.name,
      email: user.email,
      college: user.college,
      hasImage: !!user.image_path
    });
  }
};
