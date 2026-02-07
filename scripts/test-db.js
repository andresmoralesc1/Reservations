const postgres = require('postgres');
require('dotenv').config();

async function testDB() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ DB OK:', result[0]);

    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    console.log('📋 Tablas:', tables.map(t => t.table_name));

  } catch (error) {
    console.error('❌ DB Error:', error.message);
  } finally {
    await sql.end();
  }
}

testDB();
