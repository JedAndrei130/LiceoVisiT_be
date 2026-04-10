import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const pool = await mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'liceo_visitrack',
});

try {
  // Step 1: Fix the password column length (must be VARCHAR(255) for bcrypt hashes)
  console.log('🔧 Fixing password column to VARCHAR(255)...');
  await pool.query(`ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL DEFAULT ''`);
  console.log('✅ Column updated!');

  // Step 2: Generate a fresh bcrypt hash for admin123
  const freshHash = await bcrypt.hash('admin123', 10);
  console.log('🔑 Generated fresh hash for admin123');

  // Step 3: Update or insert the admin user with the correct hash
  const [existing] = await pool.query(
    `SELECT user_id FROM users WHERE email = ?`, ['admin@liceo.edu.ph']
  );

  if (existing.length > 0) {
    await pool.query(
      `UPDATE users SET password = ?, name = 'Admin', position = 'Administrator' WHERE email = ?`,
      [freshHash, 'admin@liceo.edu.ph']
    );
    console.log('✅ Admin password updated in DB!');
  } else {
    await pool.query(
      `INSERT INTO users (name, email, position, password) VALUES (?, ?, ?, ?)`,
      ['Admin', 'admin@liceo.edu.ph', 'Administrator', freshHash]
    );
    console.log('✅ Admin user inserted!');
  }

  // Step 4: Verify the hash works
  const [rows] = await pool.query(
    `SELECT password FROM users WHERE email = ?`, ['admin@liceo.edu.ph']
  );
  const match = await bcrypt.compare('admin123', rows[0].password);
  console.log('🔍 Final verification:', match ? '✅ Login will work!' : '❌ Still broken - contact dev');
  console.log('');
  console.log('=================================');
  console.log('  Email:    admin@liceo.edu.ph');
  console.log('  Password: admin123');
  console.log('=================================');

} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await pool.end();
}
