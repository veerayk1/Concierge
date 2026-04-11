const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
  connectionString: 'postgresql://concierge:concierge_dev_password@localhost:5432/concierge'
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database');

    const propertyId = '8165b053-0af8-4e46-aa54-97f52ee9ea8d';
    
    for (let i = 101; i <= 110; i++) {
      const floor = i <= 105 ? 1 : 2;
      const unitId = uuidv4();
      
      const query = `
        INSERT INTO units (id, property_id, number, floor, unit_type, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, now(), now())
        ON CONFLICT (property_id, number) DO NOTHING
      `;
      
      try {
        const result = await client.query(query, [
          unitId,
          propertyId,
          String(i),
          floor,
          'residential',
          'vacant'
        ]);
        console.log(`✓ Created unit ${i} (floor ${floor}): ${unitId}`);
      } catch (error) {
        console.error(`✗ Failed to create unit ${i}:`, error.message);
      }
    }
    
    // Verify
    const verifyQuery = `
      SELECT id, number, floor, status FROM units 
      WHERE property_id = $1 
      AND number >= '101' AND number <= '110'
      ORDER BY number::integer
    `;
    const result = await client.query(verifyQuery, [propertyId]);
    console.log('\nVerification - Units created:');
    result.rows.forEach(row => {
      console.log(`  Unit ${row.number}: floor ${row.floor}, status ${row.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

main();
