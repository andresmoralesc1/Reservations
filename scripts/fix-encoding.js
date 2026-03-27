const postgres = require('postgres');
require('dotenv').config();

/**
 * Fix encoding issues in services descriptions
 * Corrects corrupted UTF-8 characters like 'á' -> '�'
 */

async function fixEncoding() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('🔧 Fixing encoding in services...\n');

    // Check current services for encoding issues
    const corruptedServices = await sql`
      SELECT id, name, description
      FROM services
      WHERE description LIKE '%s%'
         OR description LIKE '%S%'
         OR description LIKE '%_bados%'
         OR description LIKE '%ndomingos%'
         OR name LIKE '%S%'
    `;

    if (corruptedServices.length === 0) {
      console.log('✅ No encoding issues found in services');
      return;
    }

    console.log(`📋 Found ${corruptedServices.length} services with potential encoding issues:`);
    corruptedServices.forEach(s => {
      console.log(`   - ${s.name}: "${s.description}"`);
    });

    // Fix encoding issues
    let fixedCount = 0;

    for (const service of corruptedServices) {
      let newDescription = service.description || '';
      let newName = service.name || '';

      // Fix common encoding issues
      const replacements = {
        's_bados': 'sábados',
        's\\bados': 'sábados',
        'S_bados': 'Sábados',
        'S\\bados': 'Sábados',
        's%bados': 'sábados',
        's\ufffdbados': 'sábados',
        's\ufffd\bados': 'sábados',
        'ndomingos': 'domingos',
        'invierno': 'invierno',
        'lunes': 'lunes',
        'viernes': 'viernes',
        'cena': 'cena',
        'comida': 'comida',
      };

      for (const [corrupt, correct] of Object.entries(replacements)) {
        if (newDescription.includes(corrupt)) {
          newDescription = newDescription.replace(new RegExp(corrupt, 'g'), correct);
          console.log(`   Fixed: "${corrupt}" -> "${correct}"`);
        }
        if (newName.includes(corrupt)) {
          newName = newName.replace(new RegExp(corrupt, 'g'), correct);
        }
      }

      // Update if changed
      if (newDescription !== service.description || newName !== service.name) {
        await sql`
          UPDATE services
          SET name = ${newName},
              description = ${newDescription},
              updated_at = NOW()
          WHERE id = ${service.id}
        `;
        fixedCount++;
        console.log(`✅ Updated service: ${service.name}`);
      }
    }

    console.log(`\n🎉 Total services fixed: ${fixedCount}`);

    // Show all services after fix
    const allServices = await sql`
      SELECT name, description
      FROM services
      ORDER BY name
    `;

    console.log('\n📍 All services in database:');
    allServices.forEach(s => {
      console.log(`   - ${s.name}: "${s.description}"`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

fixEncoding();
