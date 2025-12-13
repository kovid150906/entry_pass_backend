// config/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mi_25',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection at startup
pool.getConnection()
  .then((conn) => {
    console.log('✅ MySQL Connection Successful!');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    conn.release();
  })
  .catch((err) => {
    console.error('❌ MySQL Connection Failed!');
    console.error(`   Error: ${err.message}`);
    console.error(`   Code: ${err.code}`);
    console.error(`   Host: ${process.env.DB_HOST}`);
    console.error(`   User: ${process.env.DB_USER}`);
    console.error(`   Database: ${process.env.DB_NAME}`);
  });

module.exports = pool;
