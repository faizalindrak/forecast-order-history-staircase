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

const MONTH_LABELS = Object.keys(MONTH_MAP)

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

const formatMonthLabel = (date: Date): string => {
  const monthIndex = date.getUTCMonth()
  const year = date.getUTCFullYear()
  const monthLabel = MONTH_LABELS.find((key) => MONTH_MAP[key] === monthIndex)
  if (!monthLabel) {
    throw new Error(`Unable to format month index: ${monthIndex}`)
  }
  return `${monthLabel}-${String(year).slice(-2)}`
}

const normalizeVersionParam = (param: string | null): number | 'latest' => {
  if (!param || param === 'latest') {
    return 'latest'
  }

  const parsed = Number(param)
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('Invalid version parameter')
  }
  return parsed
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skuId = searchParams.get('skuId')
    const versionParam = searchParams.get('version')

    const requestedVersion = normalizeVersionParam(versionParam)

    const versions = await db.forecastVersion.findMany({
      include: {
        entries: {
          where: skuId ? { skuId } : undefined,
          include: { sku: true },
          orderBy: { orderMonth: 'asc' }
        }
      },
      orderBy: [
        { month: 'asc' },
        { version: 'asc' }
      ]
    })

    const availableVersions = Array.from(new Set(versions.map((v) => v.version))).sort((a, b) => a - b)

    const versionsByMonth = versions.reduce<Record<string, typeof versions>>((acc, version) => {
      const key = version.month.toISOString()
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(version)
      return acc
    }, {})

    const responseEntries: Array<{
      id: string
      skuId: string
      orderDate: string
      month: string
      value: number
      version: number
      sku?: {
        id: string
        partNumber: string
        partName: string
        order: string
      }
    }> = []

    const versionSelection: Record<string, number | null> = {}
    const fallbackMonths: string[] = []

    for (const [monthKey, groupedVersions] of Object.entries(versionsByMonth)) {
      if (groupedVersions.length === 0) {
        versionSelection[monthKey] = null
        continue
      }

      const latestVersionRecord = groupedVersions.reduce((prev, current) =>
        current.version > prev.version ? current : prev
      )

      let targetVersion = latestVersionRecord

      if (requestedVersion !== 'latest') {
        const requestedMatch = groupedVersions.find((item) => item.version === requestedVersion)
        if (requestedMatch) {
          targetVersion = requestedMatch
        } else {
          fallbackMonths.push(monthKey)
        }
      }

      versionSelection[monthKey] = targetVersion?.version ?? null

      if (!targetVersion || targetVersion.entries.length === 0) {
        continue
      }

      targetVersion.entries.forEach((entry) => {
        responseEntries.push({
          id: entry.id,
          skuId: entry.skuId,
          orderDate: formatMonthLabel(entry.orderMonth),
          month: formatMonthLabel(targetVersion.month),
          value: entry.value,
          version: targetVersion.version,
          sku: entry.sku
            ? {
                id: entry.sku.id,
                partNumber: entry.sku.partNumber,
                partName: entry.sku.partName,
                order: entry.sku.order,
              }
            : undefined,
        })
      })
    }

    responseEntries.sort((a, b) => {
      const monthDiff = parseMonthLabel(a.month).getTime() - parseMonthLabel(b.month).getTime()
      if (monthDiff !== 0) return monthDiff
      return parseMonthLabel(a.orderDate).getTime() - parseMonthLabel(b.orderDate).getTime()
    })

    return NextResponse.json({
      entries: responseEntries,
      availableVersions,
      requestedVersion,
      versionSelection,
      fallbackMonths,
    })
  } catch (error) {
    console.error('Error fetching forecast data:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch forecast data'
    const status =
      error instanceof Error &&
      (error.message.includes('Invalid version parameter') || error.message.includes('Invalid month label'))
        ? 400
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { skuId, orderDate, month, version, value } = body

    if (!skuId || !orderDate || !month || value === undefined || version === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: skuId, orderDate, month, version, value' },
        { status: 400 }
      )
    }

    const orderMonth = parseMonthLabel(orderDate)
    const forecastMonth = parseMonthLabel(month)

    const versionRecord = await db.forecastVersion.upsert({
      where: {
        month_version: {
          month: forecastMonth,
          version
        }
      },
      create: {
        month: forecastMonth,
        version
      },
      update: {}
    })

    const forecastEntry = await db.forecastEntry.upsert({
      where: {
        forecastVersionId_skuId_orderMonth: {
          forecastVersionId: versionRecord.id,
          skuId,
          orderMonth
        }
      },
      update: { value },
      create: {
        forecastVersionId: versionRecord.id,
        skuId,
        orderMonth,
        value
      },
      include: {
        sku: true,
        forecastVersion: true
      }
    })

    return NextResponse.json({
      id: forecastEntry.id,
      skuId: forecastEntry.skuId,
      orderDate: formatMonthLabel(forecastEntry.orderMonth),
      month: formatMonthLabel(forecastEntry.forecastVersion.month),
      value: forecastEntry.value,
      version: forecastEntry.forecastVersion.version,
      sku: forecastEntry.sku ? {
        id: forecastEntry.sku.id,
        partNumber: forecastEntry.sku.partNumber,
        partName: forecastEntry.sku.partName,
        order: forecastEntry.sku.order,
      } : undefined
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating forecast data:', error)
    const message = error instanceof Error ? error.message : 'Failed to create/update forecast data'
    const status =
      error instanceof Error && error.message.includes('Invalid month label')
        ? 400
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = body

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of forecast entries' },
        { status: 400 }
      )
    }

    let processed = 0

    for (const item of data) {
      const { skuId, orderDate, month, version, value } = item

      if (!skuId || !orderDate || !month || version === undefined || value === undefined) {
        continue
      }

      const orderMonth = parseMonthLabel(orderDate)
      const forecastMonth = parseMonthLabel(month)

      const versionRecord = await db.forecastVersion.upsert({
        where: {
          month_version: {
            month: forecastMonth,
            version
          }
        },
        create: {
          month: forecastMonth,
          version
        },
        update: {}
      })

      await db.forecastEntry.upsert({
        where: {
          forecastVersionId_skuId_orderMonth: {
            forecastVersionId: versionRecord.id,
            skuId,
            orderMonth
          }
        },
        update: { value },
        create: {
          forecastVersionId: versionRecord.id,
          skuId,
          orderMonth,
          value
        }
      })

      processed += 1
    }

    return NextResponse.json({
      message: 'Forecast data updated successfully',
      count: processed
    })
  } catch (error) {
    console.error('Error bulk updating forecast data:', error)
    const message = error instanceof Error ? error.message : 'Failed to update forecast data'
    const status =
      error instanceof Error && error.message.includes('Invalid month label')
        ? 400
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}