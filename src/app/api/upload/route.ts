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

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  result.setUTCMonth(result.getUTCMonth() + months)
  return result
}

const resolveForecastMonth = (header: string, orderMonth: Date): Date => {
  const normalized = header.trim().toUpperCase()

  if (normalized === 'N') {
    return orderMonth
  }

  const plusMatch = /^N\+(\d+)$/.exec(normalized)
  if (plusMatch) {
    const offset = Number(plusMatch[1])
    return addMonths(orderMonth, offset)
  }

  const minusMatch = /^N-(\d+)$/.exec(normalized)
  if (minusMatch) {
    const offset = Number(minusMatch[1])
    return addMonths(orderMonth, -offset)
  }

  return parseMonthLabel(header)
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
    const normalizedHeaders = headers.map(h => h.toUpperCase())

    const shipToIndex = normalizedHeaders.findIndex((h, idx) => idx >= 3 && h.replace(/\s+/g, ' ') === 'SHIP TO')
    const orderDateIndex = normalizedHeaders.findIndex((h) => h.replace(/\s+/g, ' ') === 'ORDER DATE')
    const orderVersionIndex = normalizedHeaders.findIndex((h) => h.replace(/\s+/g, ' ') === 'ORDER VERSION')

    if (shipToIndex < 0) {
      return NextResponse.json(
        { error: 'Kolom "SHIP TO" wajib ada pada file upload' },
        { status: 400 }
      )
    }

    if (orderDateIndex < 0) {
      return NextResponse.json(
        { error: 'Kolom "ORDER DATE" tidak ditemukan' },
        { status: 400 }
      )
    }

    const monthStartIndex = orderVersionIndex >= 0
      ? orderVersionIndex + 1
      : orderDateIndex >= 0
        ? orderDateIndex + 1
        : Math.max(shipToIndex, 3) + 1
    const dataRows = lines.slice(1)

    const results = {
      skusCreated: 0,
      forecastEntriesCreated: 0,
      shipTosCreated: 0,
      errors: [] as string[]
    }

    const versionsUsed = new Set<number>()
    const processedSKUs = new Set()

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const values = dataRows[i].split(',').map(v => v.trim())
        
        if (values.length < monthStartIndex + 1) {
          results.errors.push(`Row ${i + 2}: Insufficient columns`)
          continue
        }

        const partNumber = values[0]
        const partName = values[1]
        const order = values[2]
        const shipToCodeRaw = shipToIndex >= 0 ? values[shipToIndex] : undefined
        const orderDate = orderDateIndex >= 0 ? values[orderDateIndex] : values[3]
        const versionString = orderVersionIndex >= 0 ? values[orderVersionIndex] : undefined
        const monthHeaders = headers.slice(monthStartIndex)
        const monthValues = values.slice(monthStartIndex)

        if (!orderDate) {
          results.errors.push(`Row ${i + 2}: Missing order date`)
          continue
        }

        const orderMonth = parseMonthLabel(orderDate)

        let resolvedVersion = defaultVersion
        if (versionString && versionString.length > 0) {
          const parsedVersion = Number(versionString)
          if (Number.isNaN(parsedVersion) || parsedVersion < 0) {
            results.errors.push(`Row ${i + 2}: Invalid order version '${versionString}'`)
            continue
          }
          resolvedVersion = parsedVersion
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
        versionsUsed.add(resolvedVersion)

        const shipToCode = (shipToCodeRaw && shipToCodeRaw.length > 0) ? shipToCodeRaw : 'DEFAULT'

        let shipTo = await db.shipTo.findFirst({
          where: {
            skuId: sku.id,
            code: shipToCode
          }
        })

        if (!shipTo) {
          shipTo = await db.shipTo.create({
            data: {
              skuId: sku.id,
              code: shipToCode,
              name: shipToCode === 'DEFAULT' ? 'Default Ship To' : null
            }
          })
          results.shipTosCreated++
        }

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

          let forecastMonth: Date
          try {
            forecastMonth = resolveForecastMonth(monthLabel, orderMonth)
          } catch (err) {
            results.errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Invalid month header'}`)
            continue
          }

          const versionRecord = await db.forecastVersion.upsert({
            where: {
              month_version: {
                month: forecastMonth,
                version: resolvedVersion
              }
            },
            create: {
              month: forecastMonth,
              version: resolvedVersion
            },
            update: {}
          })

          const existingEntry = await db.forecastEntry.findUnique({
            where: {
              forecastVersionId_skuId_shipToId_orderMonth: {
                forecastVersionId: versionRecord.id,
                skuId: sku.id,
                shipToId: shipTo.id,
                orderMonth
              }
            }
          })

          if (!existingEntry) {
            await db.forecastEntry.create({
              data: {
                forecastVersionId: versionRecord.id,
                skuId: sku.id,
                shipToId: shipTo.id,
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
      version: defaultVersion,
      versionsUsed: Array.from(versionsUsed).sort((a, b) => a - b)
    })
  } catch (error) {
    console.error('Error processing upload:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
}