import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const skus = await db.sKU.findMany({
      orderBy: {
        partNumber: 'asc'
      }
    })

    return NextResponse.json(skus)
  } catch (error) {
    console.error('Error fetching SKUs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SKUs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { partNumber, partName, order } = body

    if (!partNumber || !partName || !order) {
      return NextResponse.json(
        { error: 'Missing required fields: partNumber, partName, order' },
        { status: 400 }
      )
    }

    const existingSKU = await db.sKU.findUnique({
      where: { partNumber }
    })

    if (existingSKU) {
      return NextResponse.json(
        { error: 'SKU with this part number already exists' },
        { status: 409 }
      )
    }

    const newSKU = await db.sKU.create({
      data: {
        partNumber,
        partName,
        order
      }
    })

    return NextResponse.json(newSKU, { status: 201 })
  } catch (error) {
    console.error('Error creating SKU:', error)
    return NextResponse.json(
      { error: 'Failed to create SKU' },
      { status: 500 }
    )
  }
}