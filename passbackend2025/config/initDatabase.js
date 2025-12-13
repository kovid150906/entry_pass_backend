const db = require('./db');

async function initDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS passes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mi_no VARCHAR(50),
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      college VARCHAR(255),
      image_path VARCHAR(255),
      image_uploaded TINYINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  const conn = await db.getConnection();
  await conn.execute(createTableSQL);
  conn.release();

  console.log('✅ passes table ready');
}

module.exports = initDatabase;
