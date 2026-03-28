const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://neondb_owner:npg_TVdr39wJaOtU@ep-patient-sky-aige9wf2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkSchema() {
  try {
    await client.connect();

    // Obtener columnas de la tabla tables
    const columns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'tables'
      ORDER BY ordinal_position
    `);
    console.log('📋 Columnas de tabla tables:');
    columns.rows.forEach(c => {
      console.log('  -', c.column_name, ':', c.data_type);
    });

    // Obtener algunas mesas con columnas correctas
    const tables = await client.query('SELECT * FROM tables LIMIT 3');
    console.log('\n📊 Ejemplo de mesas:');
    console.log(JSON.stringify(tables.rows, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkSchema();
