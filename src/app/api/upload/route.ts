import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MONTH_MAP: Record<string, number> = {
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

const parseMonthLabel = (label: string): Date => {
  const [rawMonth, rawYear] = label.split('-')
  const monthIndex = MONTH_MAP[rawMonth as keyof typeof MONTH_MAP]
  if (monthIndex === undefined) {
    throw new Error(`Invalid month label: ${label}`)
  }
  const yearNumber = Number(rawYear)
  const fullYear = yearNumber >= 70 ? 1900 + yearNumber : 2000 + yearNumber
  return new Date(Date.UTC(fullYear, monthIndex, 1))
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const versionParam = formData.get('version')
    const defaultVersion = versionParam ? Number(versionParam) : 10
    if (Number.isNaN(defaultVersion) || defaultVersion < 0) {
      return NextResponse.json(
        { error: 'Invalid version value provided' },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'File must contain at least a header and one data row' },
        { status: 400 }
      )
    }

    const headers = lines[0].split(',').map(h => h.trim())
    const dataRows = lines.slice(1)

    const results = {
      skusCreated: 0,
      forecastEntriesCreated: 0,
      errors: [] as string[]
    }

    const processedSKUs = new Set()

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const values = dataRows[i].split(',').map(v => v.trim())
        
        if (values.length < 5) {
          results.errors.push(`Row ${i + 2}: Insufficient columns`)
          continue
        }

        const [partNumber, partName, order, orderDate, ...monthValues] = values
        const monthHeaders = headers.slice(4) // Skip first 4 columns: PART NUMBER, PART NAME, ORDER, ORDER DATE

        if (!orderDate) {
          results.errors.push(`Row ${i + 2}: Missing order date`)
          continue
        }

        let sku = await db.sKU.findUnique({
          where: { partNumber }
        })

        if (!sku) {
          sku = await db.sKU.create({
            data: {
              partNumber,
              partName,
              order
            }
          })
          results.skusCreated++
        }

        processedSKUs.add(sku.id)

        for (let j = 0; j < monthHeaders.length && j < monthValues.length; j++) {
          const monthLabel = monthHeaders[j].trim()
          const valueStr = monthValues[j].trim()
          
          if (!valueStr || valueStr === '' || valueStr === '-') {
            continue
          }

          const value = parseInt(valueStr)
          if (isNaN(value)) {
            continue
          }

          const orderMonth = parseMonthLabel(orderDate)
          const forecastMonth = parseMonthLabel(monthLabel)

          const versionRecord = await db.forecastVersion.upsert({
            where: {
              month_version: {
                month: forecastMonth,
                version: defaultVersion
              }
            },
            create: {
              month: forecastMonth,
              version: defaultVersion
            },
            update: {}
          })

          const existingEntry = await db.forecastEntry.findUnique({
            where: {
              forecastVersionId_skuId_orderMonth: {
                forecastVersionId: versionRecord.id,
                skuId: sku.id,
                orderMonth
              }
            }
          })

          if (!existingEntry) {
            await db.forecastEntry.create({
              data: {
                forecastVersionId: versionRecord.id,
                skuId: sku.id,
                orderMonth,
                value
              }
            })
            results.forecastEntriesCreated++
          }
        }
      } catch (error) {
        results.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      message: 'File processed successfully',
      results,
      version: defaultVersion
    })
  } catch (error) {
    console.error('Error processing upload:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
}