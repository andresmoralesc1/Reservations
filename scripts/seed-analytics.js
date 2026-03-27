const postgres = require('postgres');
require('dotenv').config();

const RESTAURANT_ID = '00000000-0000-0000-0000-000000000001';

// Helper to generate random date within last 30 days
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Helper to format time as HH:MM
function formatTime(date) {
  return date.toTimeString().slice(0, 5);
}

async function seedAnalytics() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('🌱 Seeding analytics data...');

    // Get existing tables
    const tables = await sql`
      SELECT id FROM tables
      WHERE restaurant_id = ${RESTAURANT_ID}
      LIMIT 20
    `;

    if (tables.length === 0) {
      console.log('❌ No tables found. Please seed tables first.');
      return;
    }

    console.log(`📋 Found ${tables.length} tables`);

    // Generate reservations for the last 30 days
    const statuses = ['CONFIRMADO', 'PENDIENTE', 'CANCELADO', 'NO_SHOW', 'COMPLETADO'];
    const sources = ['web', 'whatsapp', 'telefono', 'manual'];
    const names = ['Carlos Pérez', 'María González', 'Juan Rodríguez', 'Ana Martínez', 'Luis Silva', 'Carmen López', 'Pedro García', 'Laura Díaz'];

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    let totalCreated = 0;

    for (let day = 0; day < 30; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      const dateStr = formatDate(currentDate);

      // Skip some days to make it realistic
      if (Math.random() > 0.8) continue;

      // Generate 5-15 reservations per day
      const numReservations = Math.floor(Math.random() * 10) + 5;

      for (let i = 0; i < numReservations; i++) {
        // Random time between 12:00 and 22:00
        const hour = 12 + Math.floor(Math.random() * 10);
        const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Random table
        const table = tables[Math.floor(Math.random() * tables.length)];

        // Random party size
        const partySize = [2, 2, 2, 4, 4, 6, 8][Math.floor(Math.random() * 7)];

        // Random status (weighted towards confirmed)
        const statusIndex = Math.random();
        let status;
        if (statusIndex < 0.5) status = 'CONFIRMADO';
        else if (statusIndex < 0.7) status = 'PENDIENTE';
        else if (statusIndex < 0.85) status = 'COMPLETADO';
        else if (statusIndex < 0.95) status = 'CANCELADO';
        else status = 'NO_SHOW';

        const source = sources[Math.floor(Math.random() * sources.length)];
        const name = names[Math.floor(Math.random() * names.length)];
        const phone = '+57 300 ' + Math.floor(1000000 + Math.random() * 9000000);

        // Generate reservation code
        const code = 'RES-' + Math.random().toString(36).substring(2, 7).toUpperCase();

        try {
          await sql`
            INSERT INTO reservations (
              id, restaurant_id, table_id, customer_name, customer_phone,
              reservation_date, reservation_time, party_size, status,
              source, code, created_at
            ) VALUES (
              ${crypto.randomUUID()}, ${RESTAURANT_ID}, ${table.id},
              ${name}, ${phone}, ${dateStr}, ${timeStr}, ${partySize},
              ${status}, ${source}, ${code}, ${new Date().toISOString()}
            )
          `;
          totalCreated++;
        } catch (error) {
          // Ignore duplicate key errors
          if (!error.message.includes('duplicate key')) {
            console.error('Error inserting reservation:', error.message);
          }
        }
      }

      console.log(`✅ Created reservations for ${dateStr}`);
    }

    console.log(`\n🎉 Total reservations created: ${totalCreated}`);

    // Show summary
    const summary = await sql`
      SELECT
        status,
        COUNT(*) as count
      FROM reservations
      WHERE restaurant_id = ${RESTAURANT_ID}
      GROUP BY status
    `;

    console.log('\n📊 Summary by status:');
    summary.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sql.end();
  }
}

seedAnalytics();
