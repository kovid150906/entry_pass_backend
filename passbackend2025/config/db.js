require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'mi_accommodation_v2', // 🔥 Using the new V2 database
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection at startup
pool.getConnection()
  .then((conn) => {
    console.log('✅ MySQL Connection Successful!');
    console.log(`   Database: mi_accommodation_v2`);
    conn.release();
  })
  .catch((err) => {
    console.error('❌ MySQL Connection Failed!');
    console.error(`   Error: ${err.message}`);
  });

module.exports = pool;