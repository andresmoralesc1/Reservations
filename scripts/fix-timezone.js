const postgres = require('postgres');
require('dotenv').config();

/**
 * Fix timezone for restaurants
 * Changes America/Bogota to Europe/Madrid
 */

async function fixTimezone() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('🔧 Fixing timezone for restaurants...\n');

    // Check current restaurants
    const restaurants = await sql`
      SELECT id, name, timezone
      FROM restaurants
    `;

    console.log(`📋 Found ${restaurants.length} restaurants:`);
    restaurants.forEach(r => {
      console.log(`   - ${r.name}: ${r.timezone}`);
    });

    // Update timezone for all restaurants
    const result = await sql`
      UPDATE restaurants
      SET timezone = 'Europe/Madrid',
          updated_at = NOW()
      WHERE timezone = 'America/Bogota'
      OR timezone IS NULL
      RETURNING id, name, timezone
    `;

    console.log(`\n✅ Updated ${result.length} restaurants:`);
    result.forEach(r => {
      console.log(`   - ${r.name}: ${r.timezone}`);
    });

    // Verify the update
    const verify = await sql`
      SELECT id, name, timezone
      FROM restaurants
    `;

    console.log('\n📍 Current timezones in database:');
    verify.forEach(r => {
      console.log(`   - ${r.name}: ${r.timezone}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

fixTimezone();
