import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

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
      forecastDataCreated: 0,
      errors: []
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
          const month = monthHeaders[j].trim()
          const valueStr = monthValues[j].trim()
          
          if (!valueStr || valueStr === '' || valueStr === '-') {
            continue
          }

          const value = parseInt(valueStr)
          if (isNaN(value)) {
            continue
          }

          const existingData = await db.forecastData.findUnique({
            where: {
              skuId_orderDate_month: {
                skuId: sku.id,
                orderDate: orderDate || 'Unknown',
                month
              }
            }
          })

          if (!existingData) {
            await db.forecastData.create({
              data: {
                skuId: sku.id,
                orderDate: orderDate || 'Unknown',
                month,
                value
              }
            })
            results.forecastDataCreated++
          }
        }
      } catch (error) {
        results.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      message: 'File processed successfully',
      results
    })
  } catch (error) {
    console.error('Error processing upload:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
}