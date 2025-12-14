const db = require('../config/db');

const Participant = {

  async findByEmail(email) {
    const [rows] = await db.query(
      'SELECT * FROM passes WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [email]
    );
    return rows[0];
  },

  async upsert({ email, miNo, name, college }) {
    await db.query(`
      INSERT INTO passes (email, mi_no, name, college)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        mi_no = VALUES(mi_no),
        name = VALUES(name),
        college = VALUES(college)
    `, [email, miNo, name, college]);
  },

  // 🔥 UPDATED: Now saves the FULL ID Number
  async updateImageByEmail(email, filename, idType, idNumber) {
    await db.query(
      `UPDATE passes
       SET image_path = ?, 
           image_uploaded = 1,
           govt_id_type = ?,
           govt_id_number = ?
       WHERE LOWER(email) = LOWER(?)`,
      [filename, idType, idNumber, email]
    );
  },

  async updatePassImageByEmail(email, filename) {
    await db.query(
      `UPDATE passes
       SET pass_image_path = ?
       WHERE LOWER(email) = LOWER(?)`,
      [filename, email]
    );
  }

};

module.exports = Participant;