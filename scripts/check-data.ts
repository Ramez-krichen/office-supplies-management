import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    const stockMovements = await prisma.stockMovement.count();
    const outMovements = await prisma.stockMovement.count({ where: { type: 'OUT' } });
    const items = await prisma.item.count();
    
    console.log('Total stock movements:', stockMovements);
    console.log('OUT movements:', outMovements);
    console.log('Total items:', items);
    
    // Check a sample of OUT movements
    const sampleMovements = await prisma.stockMovement.findMany({
      where: { type: 'OUT' },
      take: 5,
      include: { item: { select: { name: true } } }
    });
    
    console.log('Sample OUT movements:');
    sampleMovements.forEach(m => {
      console.log(`- ${m.item.name}: ${m.quantity} on ${m.createdAt}`);
    });
    
    // Check movements per item
    const movementsPerItem = await prisma.stockMovement.groupBy({
      by: ['itemId'],
      where: { type: 'OUT' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });
    
    console.log('\nTop 5 items by OUT movements:');
    for (const movement of movementsPerItem) {
      const item = await prisma.item.findUnique({
        where: { id: movement.itemId },
        select: { name: true }
      });
      console.log(`- ${item?.name}: ${movement._count.id} movements`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
