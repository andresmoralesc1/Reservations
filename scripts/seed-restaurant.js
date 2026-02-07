const postgres = require('postgres');
require('dotenv').config();

async function seedRestaurant() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    // Insert a test restaurant
    const result = await sql`
      INSERT INTO restaurants (id, name, phone, address, timezone, is_active)
      VALUES (${'00000000-0000-0000-0000-000000000001'}, ${'El Posit'}, ${'+57 300 123 4567'}, ${'Calle 123 #45-67, Bogotá'}, ${'America/Bogota'}, ${true})
      ON CONFLICT (id) DO NOTHING
      RETURNING id, name
    `;

    if (result.length > 0) {
      console.log('✅ Restaurante creado:', result[0]);
    } else {
      console.log('ℹ️ El restaurante ya existe');
    }

    // Verify the restaurant exists
    const check = await sql`SELECT * FROM restaurants WHERE id = ${'00000000-0000-0000-0000-000000000001'}`;
    console.log('📍 Restaurantes en base de datos:', check);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

seedRestaurant();
