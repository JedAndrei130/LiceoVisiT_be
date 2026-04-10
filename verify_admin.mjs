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
  // Check what's in the users table
  const [rows] = await pool.query(`SELECT user_id, name, email, position, password FROM users WHERE email = 'admin@liceo.edu.ph'`);
  
  if (rows.length === 0) {
    console.log('❌ No user found with email: admin@liceo.edu.ph');
  } else {
    const user = rows[0];
    console.log('✅ User found:', { user_id: user.user_id, name: user.name, email: user.email });
    console.log('   stored hash:', user.password);

    // Test bcrypt compare
    const match = await bcrypt.compare('admin123', user.password);
    console.log('   bcrypt compare result:', match ? '✅ MATCH' : '❌ NO MATCH');

    if (!match) {
      // Re-hash and update
      const newHash = await bcrypt.hash('admin123', 10);
      await pool.query(`UPDATE users SET password = ? WHERE email = ?`, [newHash, 'admin@liceo.edu.ph']);
      console.log('🔧 Password re-hashed and updated in DB!');
      
      // Verify again
      const verify = await bcrypt.compare('admin123', newHash);
      console.log('   re-verify result:', verify ? '✅ Now correct!' : '❌ Still broken');
    }
  }
} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  await pool.end();
}
