require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const initDatabase = require('./config/initDatabase');
const accommodationRoutes = require('./routes/accommodation.routes');

const app = express();
const PORT = process.env.PORT || 5000;

/* =======================
   REMOVE COOP / COEP
   (CRITICAL FOR GOOGLE POPUP)
======================= */
app.use((req, res, next) => {
  res.removeHeader('Cross-Origin-Opener-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  next();
});

/* =======================
   CORS CONFIG
======================= */
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:2025',
    credentials: true
  })
);

/* =======================
   MIDDLEWARES
======================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =======================
   STATIC FILES
======================= */

// 🔹 Existing: participant uploaded photos
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, UPLOAD_DIR)));

// 🔹 NEW: generated entry / accommodation passes
app.use('/passes', express.static(path.join(__dirname, 'passes')));

/* =======================
   ROUTES
======================= */
app.use('/api/accommodation', accommodationRoutes);

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'Access Pass backend running' });
});

/* =======================
   START SERVER
======================= */
(async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
})();
