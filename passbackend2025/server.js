require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 🔥 Import DB to trigger connection test immediately
const db = require('./config/db');
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
   1. GLOBAL CORS CONFIG
======================= */
app.use(
  cors({
    origin: true, // Allow all origins for dev simplicity
    credentials: true
  })
);

/* =======================
   MIDDLEWARES
======================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =======================
   2. STATIC FILE CORS FIX (CRITICAL)
   This allows html2canvas to read images without security errors
======================= */
const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
};

/* =======================
   STATIC FILES
======================= */

// 1. Ensure 'uploads' folder exists & Apply CORS
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// 🔥 Apply allowCrossDomain here
app.use('/uploads', allowCrossDomain, express.static(uploadDir));

// 2. Ensure 'passes' folder exists & Apply CORS
const passesDir = path.join(__dirname, 'passes');
if (!fs.existsSync(passesDir)) fs.mkdirSync(passesDir, { recursive: true });

// 🔥 Apply allowCrossDomain here
app.use('/passes', allowCrossDomain, express.static(passesDir));

/* =======================
   ROUTES
======================= */
app.use('/api/accommodation', accommodationRoutes);

app.get('/', (req, res) => {
  res.send('✅ Mood Indigo Accommodation Backend is Running');
});

/* =======================
   START SERVER
======================= */
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📂 Uploads URL: http://localhost:${PORT}/uploads`);
  console.log(`📂 Passes URL:  http://localhost:${PORT}/passes`);
});