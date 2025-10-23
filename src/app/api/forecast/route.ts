import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skuId = searchParams.get('skuId')

    let forecastData

    if (skuId) {
      forecastData = await db.forecastData.findMany({
        where: { skuId },
        include: {
          sku: true
        },
        orderBy: [
          { orderDate: 'asc' },
          { month: 'asc' }
        ]
      })
    } else {
      forecastData = await db.forecastData.findMany({
        include: {
          sku: true
        },
        orderBy: [
          { sku: { partNumber: 'asc' } },
          { orderDate: 'asc' },
          { month: 'asc' }
        ]
      })
    }

    return NextResponse.json(forecastData)
  } catch (error) {
    console.error('Error fetching forecast data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forecast data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { skuId, orderDate, month, value } = body

    if (!skuId || !orderDate || !month || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: skuId, orderDate, month, value' },
        { status: 400 }
      )
    }

    const existingData = await db.forecastData.findUnique({
      where: {
        skuId_orderDate_month: {
          skuId,
          orderDate,
          month
        }
      }
    })

    let forecastData
    if (existingData) {
      forecastData = await db.forecastData.update({
        where: {
          skuId_orderDate_month: {
            skuId,
            orderDate,
            month
          }
        },
        data: { value }
      })
    } else {
      forecastData = await db.forecastData.create({
        data: {
          skuId,
          orderDate,
          month,
          value
        }
      })
    }

    return NextResponse.json(forecastData, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating forecast data:', error)
    return NextResponse.json(
      { error: 'Failed to create/update forecast data' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = body

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of forecast data' },
        { status: 400 }
      )
    }

    const results = []
    for (const item of data) {
      const { skuId, orderDate, month, value } = item

      if (!skuId || !orderDate || !month || value === undefined) {
        continue
      }

      const existingData = await db.forecastData.findUnique({
        where: {
          skuId_orderDate_month: {
            skuId,
            orderDate,
            month
          }
        }
      })

      let result
      if (existingData) {
        result = await db.forecastData.update({
          where: {
            skuId_orderDate_month: {
              skuId,
              orderDate,
              month
            }
          },
          data: { value }
        })
      } else {
        result = await db.forecastData.create({
          data: {
            skuId,
            orderDate,
            month,
            value
          }
        })
      }
      results.push(result)
    }

    return NextResponse.json({ 
      message: 'Forecast data updated successfully',
      count: results.length 
    })
  } catch (error) {
    console.error('Error bulk updating forecast data:', error)
    return NextResponse.json(
      { error: 'Failed to update forecast data' },
      { status: 500 }
    )
  }
}