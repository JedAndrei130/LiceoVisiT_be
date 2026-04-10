import mysql from 'mysql2/promise';

const pool = await mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'liceo_visitrack',
});

try {
  // Check if password column exists
  const [cols] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'liceo_visitrack'
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'password'
  `);

  if (cols.length === 0) {
    await pool.query(`ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '' AFTER email`);
    console.log('✅ password column added to users table');
  } else {
    console.log('ℹ️  password column already exists — skipped ALTER');
  }

  // Insert default admin (skip if email already exists)
  const [result] = await pool.query(`
    INSERT IGNORE INTO users (name, email, position, password)
    VALUES (?, ?, ?, ?)
  `, [
    'Admin',
    'admin@liceo.edu.ph',
    'Administrator',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVoxOiC3Oy'
  ]);

  if (result.affectedRows > 0) {
    console.log('✅ Default admin user inserted!');
    console.log('   Email:    admin@liceo.edu.ph');
    console.log('   Password: admin123');
  } else {
    console.log('ℹ️  Admin user already exists — skipped insert.');
  }

} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await pool.end();
}
