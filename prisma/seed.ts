import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const months = [
  "Jul-24", "Agu-24", "Sep-24", "Okt-24", "Nov-24", "Des-24", 
  "Jan-25", "Feb-25", "Mar-25", "Apr-25", "Mei-25", "Jun-25"
]

const seedData = [
  {
    partNumber: '005167',
    partName: 'GARN R - FR SIDE OUT SSUV',
    order: 'ORDER001',
    forecastData: [
      // Order Jul-24
      { orderDate: 'Jul-24', month: 'Jul-24', value: 3800 },
      { orderDate: 'Jul-24', month: 'Agu-24', value: 4600 },
      { orderDate: 'Jul-24', month: 'Sep-24', value: 4100 },
      { orderDate: 'Jul-24', month: 'Okt-24', value: 3900 },
      { orderDate: 'Jul-24', month: 'Nov-24', value: 3561 },
      { orderDate: 'Jul-24', month: 'Des-24', value: 3391 },
      
      // Order Agu-24
      { orderDate: 'Agu-24', month: 'Agu-24', value: 2700 },
      { orderDate: 'Agu-24', month: 'Sep-24', value: 4300 },
      { orderDate: 'Agu-24', month: 'Okt-24', value: 4500 },
      { orderDate: 'Agu-24', month: 'Nov-24', value: 4200 },
      { orderDate: 'Agu-24', month: 'Des-24', value: 4000 },
      { orderDate: 'Agu-24', month: 'Jan-25', value: 4000 },
      
      // Order Sep-24
      { orderDate: 'Sep-24', month: 'Sep-24', value: 3900 },
      { orderDate: 'Sep-24', month: 'Okt-24', value: 3500 },
      { orderDate: 'Sep-24', month: 'Nov-24', value: 4000 },
      { orderDate: 'Sep-24', month: 'Des-24', value: 4800 },
      { orderDate: 'Sep-24', month: 'Jan-25', value: 4800 },
      { orderDate: 'Sep-24', month: 'Feb-25', value: 4800 },
      
      // Order Okt-24
      { orderDate: 'Okt-24', month: 'Okt-24', value: 2900 },
      { orderDate: 'Okt-24', month: 'Nov-24', value: 4500 },
      { orderDate: 'Okt-24', month: 'Des-24', value: 5800 },
      { orderDate: 'Okt-24', month: 'Jan-25', value: 5800 },
      { orderDate: 'Okt-24', month: 'Feb-25', value: 5800 },
      { orderDate: 'Okt-24', month: 'Mar-25', value: 5800 },
      
      // Order Nov-24
      { orderDate: 'Nov-24', month: 'Nov-24', value: 2400 },
      { orderDate: 'Nov-24', month: 'Des-24', value: 4200 },
      { orderDate: 'Nov-24', month: 'Jan-25', value: 2900 },
      { orderDate: 'Nov-24', month: 'Feb-25', value: 3600 },
      { orderDate: 'Nov-24', month: 'Mar-25', value: 3240 },
      { orderDate: 'Nov-24', month: 'Apr-25', value: 3240 },
      
      // Order Des-24
      { orderDate: 'Des-24', month: 'Des-24', value: 4100 },
      { orderDate: 'Des-24', month: 'Jan-25', value: 2800 },
      { orderDate: 'Des-24', month: 'Feb-25', value: 3600 },
      { orderDate: 'Des-24', month: 'Mar-25', value: 3700 },
      { orderDate: 'Des-24', month: 'Apr-25', value: 3700 },
      { orderDate: 'Des-24', month: 'Mei-25', value: 3700 },
    ]
  },
  {
    partNumber: '005168',
    partName: 'GARN L - FR SIDE OUT SSUV',
    order: 'ORDER002',
    forecastData: [
      // Order Jul-24
      { orderDate: 'Jul-24', month: 'Jul-24', value: 3200 },
      { orderDate: 'Jul-24', month: 'Agu-24', value: 3800 },
      { orderDate: 'Jul-24', month: 'Sep-24', value: 3500 },
      { orderDate: 'Jul-24', month: 'Okt-24', value: 3300 },
      { orderDate: 'Jul-24', month: 'Nov-24', value: 3000 },
      { orderDate: 'Jul-24', month: 'Des-24', value: 2800 },
      
      // Order Agu-24
      { orderDate: 'Agu-24', month: 'Agu-24', value: 2200 },
      { orderDate: 'Agu-24', month: 'Sep-24', value: 3600 },
      { orderDate: 'Agu-24', month: 'Okt-24', value: 3800 },
      { orderDate: 'Agu-24', month: 'Nov-24', value: 3500 },
      { orderDate: 'Agu-24', month: 'Des-24', value: 3300 },
      { orderDate: 'Agu-24', month: 'Jan-25', value: 3300 },
      
      // Order Sep-24
      { orderDate: 'Sep-24', month: 'Sep-24', value: 3200 },
      { orderDate: 'Sep-24', month: 'Okt-24', value: 2800 },
      { orderDate: 'Sep-24', month: 'Nov-24', value: 3300 },
      { orderDate: 'Sep-24', month: 'Des-24', value: 4100 },
      { orderDate: 'Sep-24', month: 'Jan-25', value: 4100 },
      { orderDate: 'Sep-24', month: 'Feb-25', value: 4100 },
    ]
  }
]

async function main() {
  console.log('🌱 Starting database seeding with stair forecast pattern...')

  // Clean existing data
  await prisma.forecastData.deleteMany()
  await prisma.sKU.deleteMany()
  console.log('🗑️  Cleaned existing data')

  // Seed SKUs and Forecast Data
  for (const skuData of seedData) {
    const { forecastData, ...skuInfo } = skuData
    
    // Create SKU
    const sku = await prisma.sKU.create({
      data: skuInfo
    })
    
    console.log(`✅ Created SKU: ${sku.partNumber} - ${sku.partName}`)
    
    // Create Forecast Data for this SKU
    for (const forecast of forecastData) {
      await prisma.forecastData.create({
        data: {
          skuId: sku.id,
          orderDate: forecast.orderDate,
          month: forecast.month,
          value: forecast.value
        }
      })
    }
    
    console.log(`📊 Created ${forecastData.length} forecast records for ${sku.partNumber}`)
  }

  // Get summary statistics
  const totalSKUs = await prisma.sKU.count()
  const totalForecastData = await prisma.forecastData.count()
  const orderDates = await prisma.forecastData.groupBy({
    by: ['orderDate'],
    _count: true
  })
  
  console.log('\n🎉 Database seeding completed successfully!')
  console.log(`📦 Total SKUs created: ${totalSKUs}`)
  console.log(`📈 Total forecast records created: ${totalForecastData}`)
  console.log('📊 Order dates:')
  orderDates.forEach(order => {
    console.log(`   - ${order.orderDate}: ${order._count} records`)
  })
  console.log('\n🚀 You can now start the application with: npm run dev')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })