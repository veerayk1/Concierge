import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const propertyId = '8165b053-0af8-4e46-aa54-97f52ee9ea8d';

  for (let i = 101; i <= 110; i++) {
    const floor = Math.ceil((i - 101 + 1) / 5);

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
    } catch (error: any) {
      console.error(`✗ Failed to create unit ${i}:`, error.message);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
