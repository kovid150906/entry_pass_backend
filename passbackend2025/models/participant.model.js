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

  async updateImageByEmail(email, filename) {
    await db.query(
      `UPDATE passes
       SET image_path = ?, image_uploaded = 1
       WHERE LOWER(email) = LOWER(?)`,
      [filename, email]
    );
  }

};

module.exports = Participant;
