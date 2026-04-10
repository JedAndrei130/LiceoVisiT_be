import mysql from 'mysql2/promise';

const pool = await mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'liceo_visitrack',
  dateStrings: true,
});

try {
  // Check actual columns in users table
  const [cols] = await pool.query(`
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'liceo_visitrack' AND TABLE_NAME = 'users'
    ORDER BY ORDINAL_POSITION
  `);
  console.log('📋 users table columns:');
  cols.forEach(c => console.log(`   - ${c.COLUMN_NAME} (${c.DATA_TYPE}${c.CHARACTER_MAXIMUM_LENGTH ? '('+c.CHARACTER_MAXIMUM_LENGTH+')' : ''})`));

  // Fetch users (same query as getAllUsers controller)
  const [rows] = await pool.query(
    `SELECT user_id, name, email, position, created_date FROM users ORDER BY user_id DESC`
  );
  console.log(`\n👥 Users found: ${rows.length}`);
  rows.forEach(r => console.log(`   [${r.user_id}] ${r.name} — ${r.email}`));

  // Also test HTTP API
  const res = await fetch('http://localhost:3001/users');
  if (res.ok) {
    const data = await res.json();
    console.log(`\n🌐 GET /users API responded: ${data.length} user(s)`);
  } else {
    console.log(`\n🌐 GET /users API error: ${res.status} ${res.statusText}`);
  }
} catch (err) {
  if (err.message?.includes('ECONNREFUSED') || err.cause?.code === 'ECONNREFUSED') {
    console.log('\n⚠️  Backend server is NOT running on port 3001!');
    console.log('   Please start it with: npm run dev (in Be_Visitrack)');
  } else {
    console.error('❌ Error:', err.message);
  }
} finally {
  await pool.end();
}
