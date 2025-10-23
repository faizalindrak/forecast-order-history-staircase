import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetAndSeed() {
  console.log('🔄 Resetting database and seeding with fresh data...')
  
  try {
    // Reset database (delete all data)
    await prisma.forecastData.deleteMany()
    await prisma.sKU.deleteMany()
    console.log('🗑️  Database reset completed')
    
    // Run seed data
    await import('./seed')
    
  } catch (error) {
    console.error('❌ Error during reset and seed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetAndSeed()