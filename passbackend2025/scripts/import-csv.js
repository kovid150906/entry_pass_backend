// scripts/import-csv.js
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

require('dotenv').config();
const Participant = require('../models/participant.model');

(async function run() {
  try {
    const csvPath = path.join(__dirname, '..', 'accommodations.csv');

    // Stop if CSV missing
    if (!fs.existsSync(csvPath)) {
      console.log('❌ accommodations.csv not found. Please add a CSV file in the backend root.');
      process.exit(0);
    }

    const csvText = fs.readFileSync(csvPath, 'utf8');
    const records = parse(csvText, { columns: true, skip_empty_lines: true, trim: true });

    let validRows = [];
    let skippedRows = [];

    records.forEach((r, index) => {
      const rowNumber = index + 2; // +2 because header is row 1

      const miNo = (r.miNo || r.MI || r.mi || '').trim();
      const name = (r.name || r.Name || '').trim();
      const email = (r.email || r.Email || '').trim();

      // Validation checks
      if (!miNo) {
        skippedRows.push({ row: rowNumber, reason: "Missing miNo", data: r });
        return;
      }
      if (!email) {
        skippedRows.push({ row: rowNumber, reason: "Missing email", data: r });
        return;
      }
      if (!name) {
        skippedRows.push({ row: rowNumber, reason: "Missing name", data: r });
        return;
      }

      validRows.push({
        miNo,
        name,
        email,
        college: (r.college || '').trim(),
        gender: (r.gender || '').trim(),
        phone: (r.phone || '').trim(),
        image_path: (r.image_path || '').trim()
      });
    });

    // If no valid rows, stop
    if (validRows.length === 0) {
      console.log('❌ No valid rows found. Exiting.');
      console.log('Skipped rows details:', skippedRows);
      process.exit(0);
    }

    // Print skipped rows info
    if (skippedRows.length > 0) {
      console.log('\n⚠️ Skipped Rows Summary:');
      skippedRows.forEach(s => {
        console.log(`- Row ${s.row}: ${s.reason}`);
        console.log(`  Data:`, s.data);
      });
      console.log('Total skipped:', skippedRows.length);
    }

    // Import valid rows
    console.log(`\n📥 Importing ${validRows.length} valid rows...`);
    await Participant.bulkInsert(validRows);

    console.log(`\n✅ Import complete`);
    console.log(`✔ Successfully imported: ${validRows.length}`);
    console.log(`⚠️ Skipped: ${skippedRows.length}`);

    process.exit(0);

  } catch (err) {
    console.error('❌ CSV import error:', err);
    process.exit(1);
  }
})();
