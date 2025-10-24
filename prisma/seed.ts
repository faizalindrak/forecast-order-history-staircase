import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const monthMap: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  Mei: 4,
  Jun: 5,
  Jul: 6,
  Agu: 7,
  Sep: 8,
  Okt: 9,
  Nov: 10,
  Des: 11,
}

const seedData = [
  {
    partNumber: '001234',
    partName: 'FINISH GOOD 1',
    order: 'ORDER001',
    shipTos: [
      { code: 'ST-JKT', name: 'Jakarta Distribution' },
      { code: 'ST-SMG', name: 'Semarang Hub' }
    ],
    forecastData: [
      // Order Jul-24
      { orderDate: 'Jul-24', month: 'Jul-24', value: 3800, shipToCode: 'ST-JKT' },
      { orderDate: 'Jul-24', month: 'Agu-24', value: 4600, shipToCode: 'ST-JKT' },
      { orderDate: 'Jul-24', month: 'Sep-24', value: 4100, shipToCode: 'ST-SMG' },
      { orderDate: 'Jul-24', month: 'Okt-24', value: 3900, shipToCode: 'ST-SMG' },
      { orderDate: 'Jul-24', month: 'Nov-24', value: 3561, shipToCode: 'ST-JKT' },
      { orderDate: 'Jul-24', month: 'Des-24', value: 3391, shipToCode: 'ST-JKT' },
      
      // Order Agu-24
      { orderDate: 'Agu-24', month: 'Agu-24', value: 2700, shipToCode: 'ST-JKT' },
      { orderDate: 'Agu-24', month: 'Sep-24', value: 4300, shipToCode: 'ST-JKT' },
      { orderDate: 'Agu-24', month: 'Okt-24', value: 4500, shipToCode: 'ST-SMG' },
      { orderDate: 'Agu-24', month: 'Nov-24', value: 4200, shipToCode: 'ST-SMG' },
      { orderDate: 'Agu-24', month: 'Des-24', value: 4000, shipToCode: 'ST-JKT' },
      { orderDate: 'Agu-24', month: 'Jan-25', value: 4000, shipToCode: 'ST-JKT' },
      
      // Order Sep-24
      { orderDate: 'Sep-24', month: 'Sep-24', value: 3900, shipToCode: 'ST-SMG' },
      { orderDate: 'Sep-24', month: 'Okt-24', value: 3500, shipToCode: 'ST-SMG' },
      { orderDate: 'Sep-24', month: 'Nov-24', value: 4000, shipToCode: 'ST-JKT' },
      { orderDate: 'Sep-24', month: 'Des-24', value: 4800, shipToCode: 'ST-JKT' },
      { orderDate: 'Sep-24', month: 'Jan-25', value: 4800, shipToCode: 'ST-SMG' },
      { orderDate: 'Sep-24', month: 'Feb-25', value: 4800, shipToCode: 'ST-SMG' },
      
      // Order Okt-24
      { orderDate: 'Okt-24', month: 'Okt-24', value: 2900, shipToCode: 'ST-JKT' },
      { orderDate: 'Okt-24', month: 'Nov-24', value: 4500, shipToCode: 'ST-JKT' },
      { orderDate: 'Okt-24', month: 'Des-24', value: 5800, shipToCode: 'ST-SMG' },
      { orderDate: 'Okt-24', month: 'Jan-25', value: 5800, shipToCode: 'ST-SMG' },
      { orderDate: 'Okt-24', month: 'Feb-25', value: 5800, shipToCode: 'ST-SMG' },
      { orderDate: 'Okt-24', month: 'Mar-25', value: 5800, shipToCode: 'ST-JKT' },
      
      // Order Nov-24
      { orderDate: 'Nov-24', month: 'Nov-24', value: 2400, shipToCode: 'ST-JKT' },
      { orderDate: 'Nov-24', month: 'Des-24', value: 4200, shipToCode: 'ST-JKT' },
      { orderDate: 'Nov-24', month: 'Jan-25', value: 2900, shipToCode: 'ST-SMG' },
      { orderDate: 'Nov-24', month: 'Feb-25', value: 3600, shipToCode: 'ST-SMG' },
      { orderDate: 'Nov-24', month: 'Mar-25', value: 3240, shipToCode: 'ST-JKT' },
      { orderDate: 'Nov-24', month: 'Apr-25', value: 3240, shipToCode: 'ST-JKT' },
      
      // Order Des-24
      { orderDate: 'Des-24', month: 'Des-24', value: 4100, shipToCode: 'ST-SMG' },
      { orderDate: 'Des-24', month: 'Jan-25', value: 2800, shipToCode: 'ST-SMG' },
      { orderDate: 'Des-24', month: 'Feb-25', value: 3600, shipToCode: 'ST-JKT' },
      { orderDate: 'Des-24', month: 'Mar-25', value: 3700, shipToCode: 'ST-JKT' },
      { orderDate: 'Des-24', month: 'Apr-25', value: 3700, shipToCode: 'ST-SMG' },
      { orderDate: 'Des-24', month: 'Mei-25', value: 3700, shipToCode: 'ST-SMG' },
    ]
  },
  {
    partNumber: '001235',
    partName: 'FINISH GOOD 2',
    order: 'ORDER002',
    shipTos: [
      { code: 'ST-SBY', name: 'Surabaya Port' }
    ],
    forecastData: [
      // Order Jul-24
      { orderDate: 'Jul-24', month: 'Jul-24', value: 3200, shipToCode: 'ST-SBY' },
      { orderDate: 'Jul-24', month: 'Agu-24', value: 3800, shipToCode: 'ST-SBY' },
      { orderDate: 'Jul-24', month: 'Sep-24', value: 3500, shipToCode: 'ST-SBY' },
      { orderDate: 'Jul-24', month: 'Okt-24', value: 3300, shipToCode: 'ST-SBY' },
      { orderDate: 'Jul-24', month: 'Nov-24', value: 3000, shipToCode: 'ST-SBY' },
      { orderDate: 'Jul-24', month: 'Des-24', value: 2800, shipToCode: 'ST-SBY' },
      
      // Order Agu-24
      { orderDate: 'Agu-24', month: 'Agu-24', value: 2200, shipToCode: 'ST-SBY' },
      { orderDate: 'Agu-24', month: 'Sep-24', value: 3600, shipToCode: 'ST-SBY' },
      { orderDate: 'Agu-24', month: 'Okt-24', value: 3800, shipToCode: 'ST-SBY' },
      { orderDate: 'Agu-24', month: 'Nov-24', value: 3500, shipToCode: 'ST-SBY' },
      { orderDate: 'Agu-24', month: 'Des-24', value: 3300, shipToCode: 'ST-SBY' },
      { orderDate: 'Agu-24', month: 'Jan-25', value: 3300, shipToCode: 'ST-SBY' },
      
      // Order Sep-24
      { orderDate: 'Sep-24', month: 'Sep-24', value: 3200, shipToCode: 'ST-SBY' },
      { orderDate: 'Sep-24', month: 'Okt-24', value: 2800, shipToCode: 'ST-SBY' },
      { orderDate: 'Sep-24', month: 'Nov-24', value: 3300, shipToCode: 'ST-SBY' },
      { orderDate: 'Sep-24', month: 'Des-24', value: 4100, shipToCode: 'ST-SBY' },
      { orderDate: 'Sep-24', month: 'Jan-25', value: 4100, shipToCode: 'ST-SBY' },
      { orderDate: 'Sep-24', month: 'Feb-25', value: 4100, shipToCode: 'ST-SBY' },
    ]
  }
]

const parseMonthLabel = (label: string): Date => {
  const [rawMonth, rawYear] = label.split('-')
  const monthIndex = monthMap[rawMonth]
  if (monthIndex === undefined) {
    throw new Error(`Unknown month label: ${label}`)
  }
  const year = Number(rawYear)
  const fullYear = year >= 70 ? 1900 + year : 2000 + year
  return new Date(Date.UTC(fullYear, monthIndex, 1))
}

const formatMonthLabel = (date: Date): string => {
  const monthIdx = date.getUTCMonth()
  const year = date.getUTCFullYear()
  const monthLabel = Object.keys(monthMap).find((key) => monthMap[key] === monthIdx)
  if (!monthLabel) {
    throw new Error(`Cannot format month index: ${monthIdx}`)
  }
  return `${monthLabel}-${String(year).slice(-2)}`
}

async function main() {
  console.log('🌱 Starting database seeding with stair forecast pattern and versioning...')

  await prisma.forecastEntry.deleteMany()
  await prisma.forecastVersion.deleteMany()
  await prisma.shipTo.deleteMany()
  await prisma.sKU.deleteMany()
  console.log('🗑️  Cleaned existing data')

  const skuMap = new Map<string, string>()
  const shipToMap = new Map<string, Map<string, string>>()

  for (const skuData of seedData) {
    const { forecastData, shipTos = [], ...skuInfo } = skuData
    const sku = await prisma.sKU.create({
      data: skuInfo
    })
    skuMap.set(skuData.partNumber, sku.id)
    console.log(`✅ Created SKU: ${sku.partNumber} - ${sku.partName}`)

    const shipToRecords = shipTos.length > 0 ? shipTos : [{ code: 'DEFAULT', name: 'Default Ship To' }]
    const shipToCodeMap = new Map<string, string>()

    for (const shipTo of shipToRecords) {
      const created = await prisma.shipTo.create({
        data: {
          skuId: sku.id,
          code: shipTo.code,
          name: shipTo.name ?? null,
        }
      })
      shipToCodeMap.set(shipTo.code, created.id)
      console.log(`   ↳ Ship To ${shipTo.code}${shipTo.name ? ` (${shipTo.name})` : ''}`)
    }

    shipToMap.set(skuData.partNumber, shipToCodeMap)
  }

  const entriesByMonth = new Map<string, Array<{ skuId: string; shipToId: string; orderMonth: Date; value: number }>>()

  for (const skuData of seedData) {
    const skuId = skuMap.get(skuData.partNumber)
    if (!skuId) continue
    const shipToCodeMap = shipToMap.get(skuData.partNumber)

    for (const record of skuData.forecastData) {
      const monthKey = record.month
      const orderMonth = parseMonthLabel(record.orderDate)
      const shipToCode = record.shipToCode ?? 'DEFAULT'
      const shipToId = shipToCodeMap?.get(shipToCode)
      if (!shipToId) {
        throw new Error(`Ship to code ${shipToCode} not found for SKU ${skuData.partNumber}`)
      }
      const bucket = entriesByMonth.get(monthKey) ?? []
      bucket.push({ skuId, shipToId, orderMonth, value: record.value })
      entriesByMonth.set(monthKey, bucket)
    }
  }

  const months = Array.from(entriesByMonth.keys()).sort((a, b) => {
    return parseMonthLabel(a).getTime() - parseMonthLabel(b).getTime()
  })

  for (const monthLabel of months) {
    const entries = entriesByMonth.get(monthLabel)
    if (!entries || entries.length === 0) continue

    const baseVersion = await prisma.forecastVersion.create({
      data: {
        month: parseMonthLabel(monthLabel),
        version: 10,
        entries: {
          create: entries.map((entry) => ({
            skuId: entry.skuId,
            shipToId: entry.shipToId,
            orderMonth: entry.orderMonth,
            value: entry.value,
          }))
        }
      }
    })

    console.log(`📈 Created version v10 for ${monthLabel} with ${entries.length} records`)

    if (parseMonthLabel(monthLabel).getUTCMonth() % 2 === 0) {
      await prisma.forecastVersion.create({
        data: {
          month: parseMonthLabel(monthLabel),
          version: 20,
          entries: {
            create: entries.map((entry) => ({
              skuId: entry.skuId,
              shipToId: entry.shipToId,
              orderMonth: entry.orderMonth,
              value: Math.max(0, Math.round(entry.value * 1.05)),
            }))
          }
        }
      })

      console.log(`📈 Created version v20 for ${monthLabel}`)
    }
  }

  const totalSKUs = await prisma.sKU.count()
  const totalVersions = await prisma.forecastVersion.count()
  const totalEntries = await prisma.forecastEntry.count()

  const versionSummary = await prisma.forecastVersion.findMany({
    include: {
      _count: {
        select: { entries: true }
      }
    },
    orderBy: [{ month: 'asc' }, { version: 'asc' }]
  })

  console.log('\n🎉 Database seeding completed successfully!')
  console.log(`📦 Total SKUs created: ${totalSKUs}`)
  console.log(`🗂️  Total forecast versions created: ${totalVersions}`)
  console.log(`📊 Total forecast entries created: ${totalEntries}`)
  console.log('🧾 Version summary:')
  versionSummary.forEach((version) => {
    console.log(`   - ${formatMonthLabel(version.month)} v${version.version}: ${version._count.entries} entries`)
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