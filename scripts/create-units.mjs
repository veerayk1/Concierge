import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://concierge:concierge_dev_password@localhost:5432/concierge'
    }
  }
});

async function main() {
  const propertyId = '8165b053-0af8-4e46-aa54-97f52ee9ea8d';
  
  console.log('Creating 10 units...');
  
  for (let i = 101; i <= 110; i++) {
    const floor = i <= 105 ? 1 : 2;
    
    try {
      const unit = await prisma.unit.create({
        data: {
          propertyId,
          number: String(i),
          floor,
          unitType: 'residential',
          status: 'vacant',
        },
      });
      console.log(`✓ Created unit ${i} (floor ${floor}): ${unit.id}`);
    } catch (error) {
      console.error(`✗ Failed to create unit ${i}:`, error.message);
    }
  }
  
  // Verify
  const units = await prisma.unit.findMany({
    where: {
      propertyId,
      number: { in: ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110'] }
    },
    orderBy: { number: 'asc' },
    select: { id: true, number: true, floor: true, status: true },
  });
  
  console.log('\nVerification - Units created:');
  units.forEach(u => {
    console.log(`  Unit ${u.number}: floor ${u.floor}, status ${u.status}`);
  });
  
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
