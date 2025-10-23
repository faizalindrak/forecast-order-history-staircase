'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Upload, Download, RefreshCw, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import * as XLSX from 'xlsx'

interface ForecastData {
  id: string
  skuId: string
  orderDate: string
  month: string
  value: number
  sku?: {
    partNumber: string
    partName: string
    order: string
  }
}

interface SKU {
  id: string
  partNumber: string
  partName: string
  order: string
}

export default function Home() {
  const [selectedSKU, setSelectedSKU] = useState<string>('')
  const [skuList, setSkuList] = useState<SKU[]>([])
  const [forecastData, setForecastData] = useState<ForecastData[]>([])
  const [deltaMode, setDeltaMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Handle mounted state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Theme helper functions
  const getThemeClasses = () => {
    if (!mounted) return 'bg-neutral-950 text-neutral-100'
    
    if (theme === 'light') {
      return 'bg-white text-gray-900'
    }
    
    return 'bg-neutral-950 text-neutral-100'
  }

  const getCardClasses = () => {
    if (!mounted) return 'bg-neutral-900 border-neutral-800'
    
    if (theme === 'light') {
      return 'bg-white border-gray-200' // Simple white cards
    }
    
    return 'bg-neutral-900 border-neutral-800'
  }

  const getTableHeaderClasses = () => {
    if (!mounted) return 'bg-neutral-800 text-neutral-100'
    
    if (theme === 'light') {
      return 'bg-gray-100 text-gray-900'
    }
    
    return 'bg-neutral-800 text-neutral-100'
  }

  const getTableRowClasses = (index: number) => {
    if (!mounted) return index % 2 === 0 ? 'bg-neutral-900' : 'bg-neutral-900/70'
    
    if (theme === 'light') {
      return 'bg-white' // Always white for light theme
    }
    
    return index % 2 === 0 ? 'bg-neutral-900' : 'bg-neutral-900/70'
  }

  const getTextColorClasses = (isDelta: boolean, value: number | null | undefined) => {
    if (!mounted) return isDelta && value ? 'text-emerald-400' : 'text-neutral-100'
    
    if (theme === 'light') {
      if (isDelta && value) {
        return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-900'
      }
      return 'text-gray-900'
    }
    
    return isDelta && value ? 'text-emerald-400' : 'text-neutral-100'
  }

  const getSubTextColorClasses = () => {
    if (!mounted) return 'text-neutral-500'
    
    if (theme === 'light') {
      return 'text-gray-500'
    }
    
    return 'text-neutral-500'
  }

  // Helper function untuk compare bulan
  const compareMonths = (month1: string, month2: string): number => {
    const monthOrder = [
      "Jan-24", "Feb-24", "Mar-24", "Apr-24", "Mei-24", "Jun-24",
      "Jul-24", "Agu-24", "Sep-24", "Okt-24", "Nov-24", "Des-24",
      "Jan-25", "Feb-25", "Mar-25", "Apr-25", "Mei-25", "Jun-25",
      "Jul-25", "Agu-25", "Sep-25", "Okt-25", "Nov-25", "Des-25",
      "Jan-26", "Feb-26", "Mar-26", "Apr-26", "Mei-26", "Jun-26"
    ]
    return monthOrder.indexOf(month1) - monthOrder.indexOf(month2)
  }

  // Generate dynamic months from forecast data
  const getDynamicMonths = () => {
    if (forecastData.length === 0) return []
    
    const allMonths = forecastData.map(d => d.month)
    const uniqueMonths = Array.from(new Set(allMonths))
    
    return uniqueMonths.sort((a, b) => compareMonths(a, b))
  }

  const months = getDynamicMonths()

  // Helper function untuk sorting order dates secara kronologis
  const sortOrderDates = (orderDates: string[]) => {
    const monthOrder = [
      "Jan-24", "Feb-24", "Mar-24", "Apr-24", "Mei-24", "Jun-24",
      "Jul-24", "Agu-24", "Sep-24", "Okt-24", "Nov-24", "Des-24",
      "Jan-25", "Feb-25", "Mar-25", "Apr-25", "Mei-25", "Jun-25",
      "Jul-25", "Agu-25", "Sep-25", "Okt-25", "Nov-25", "Des-25",
      "Jan-26", "Feb-26", "Mar-26", "Apr-26", "Mei-26", "Jun-26"
    ]
    return orderDates.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b))
  }

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/skus')
        if (response.ok) {
          const data = await response.json()
          setSkuList(data)
          
          if (data.length > 0) {
            setSelectedSKU(data[0].id)
            setForecastData(data[0].forecastData || [])
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [])

  // Load forecast data when SKU changes
  useEffect(() => {
    if (!selectedSKU) return

    const loadForecastData = async () => {
      try {
        const response = await fetch(`/api/forecast?skuId=${selectedSKU}`)
        if (response.ok) {
          const data = await response.json()
          setForecastData(data)
        }
      } catch (error) {
        console.error('Error loading forecast data:', error)
      }
    }

    loadForecastData()
  }, [selectedSKU])

  // Group forecast data by order date and create stair pattern
  const getStairData = () => {
    const orderDates = sortOrderDates(Array.from(new Set(forecastData.map(d => d.orderDate))))
    console.log('Order dates after sorting:', orderDates) // Debug log
    
    const stairData = []

    orderDates.forEach(orderDate => {
      const orderData = forecastData.filter(d => d.orderDate === orderDate)
      
      // Find the first and last month that have data for this order
      const orderMonths = orderData.map(d => d.month).sort((a, b) => compareMonths(a, b))
      
      const firstMonth = orderMonths[0]
      const lastMonth = orderMonths[orderMonths.length - 1]
      
      // Create values array - only show data from firstMonth to lastMonth for this order
      const values = months.map(month => {
        // Only show data if month is within this order's range
        if (compareMonths(month, firstMonth) < 0 || compareMonths(month, lastMonth) > 0) {
          return null
        }
        
        const data = orderData.find(d => d.month === month)
        return data ? data.value : null
      })
      
      stairData.push({
        orderDate,
        values,
        firstMonth,
        lastMonth
      })
    })

    return stairData
  }

  const calcDelta = (val: number | null, prevVal: number | null) => {
    if (val == null || prevVal == null) return null
    return val - prevVal
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadFile(file)
    }
  }

  const handleUploadSubmit = async () => {
    if (!uploadFile) return
    
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type') || ''
        const isJson = contentType.includes('application/json')
        const result = isJson ? await response.json() : await response.text()
        console.log('Upload successful:', result)
        
        // Reload data
        const skusResponse = await fetch('/api/skus')
        if (skusResponse.ok) {
          const data = await skusResponse.json()
          setSkuList(data)
        }
        
        // Reset file input
        setUploadFile(null)
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        const contentType = response.headers.get('content-type') || ''
        const isJson = contentType.includes('application/json')
        const errorResponse = response.clone()
        let errorDetail: unknown
        try {
          errorDetail = isJson ? await errorResponse.json() : await errorResponse.text()
        } catch {
          // Fallback when server returns invalid JSON or an HTML error page
          try {
            errorDetail = await errorResponse.text()
          } catch {
            errorDetail = 'Unknown error response format'
          }
        }
        console.error('Upload failed:', errorDetail)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/skus')
      if (response.ok) {
        const data = await response.json()
        setSkuList(data)
        
        if (data.length > 0) {
          const currentSKU = selectedSKU || data[0].id
          setSelectedSKU(currentSKU)
          
          const forecastResponse = await fetch(`/api/forecast?skuId=${currentSKU}`)
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json()
            setForecastData(forecastData)
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    // Create Excel workbook
    const wb = XLSX.utils.book_new()
    
    // Get current months for headers
    const currentMonths = getDynamicMonths()
    
    // Prepare data for all SKUs
    const allData: any[] = []
    
    // Add headers for Forecast Data
    const headers = ['PART NUMBER', 'PART NAME', 'ORDER', 'ORDER DATE', ...currentMonths]
    allData.push(headers)
    
    // Add forecast data for each SKU
    skuList.forEach(sku => {
      const skuForecastData = forecastData.filter(d => d.skuId === sku.id)
      const orderDates = sortOrderDates(Array.from(new Set(skuForecastData.map(d => d.orderDate))))
      
      orderDates.forEach(orderDate => {
        const orderData = skuForecastData.filter(d => d.orderDate === orderDate)
        const values = [sku.partNumber, sku.partName, sku.order, orderDate]
        
        currentMonths.forEach(month => {
          const monthData = orderData.find(d => d.month === month)
          values.push(monthData ? monthData.value : '')
        })
        
        allData.push(values)
      })
    })
    
    // Create forecast worksheet
    const forecastWs = XLSX.utils.aoa_to_sheet(allData)
    
    // Set column widths for forecast worksheet
    const colWidths = [
      { wch: 15 }, // PART NUMBER
      { wch: 30 }, // PART NAME
      { wch: 10 }, // ORDER
      { wch: 12 }, // ORDER DATE
      ...currentMonths.map(() => ({ wch: 12 })) // Month columns
    ]
    forecastWs['!cols'] = colWidths
    
    // Add forecast worksheet to workbook
    XLSX.utils.book_append_sheet(wb, forecastWs, 'Forecast Data')
    
    // Create Delta Data Worksheet
    const deltaData: any[] = []
    
    // Add headers for Delta Data
    const deltaHeaders = ['PART NUMBER', 'PART NAME', 'ORDER', 'ORDER DATE', ...currentMonths.map(m => `${m} (Δ)`)]
    deltaData.push(deltaHeaders)
    
    // Calculate and add delta data for each SKU
    skuList.forEach(sku => {
      const skuForecastData = forecastData.filter(d => d.skuId === sku.id)
      const orderDates = sortOrderDates(Array.from(new Set(skuForecastData.map(d => d.orderDate))))
      
      // Build stair data for delta calculation
      const stairData = []
      orderDates.forEach(orderDate => {
        const orderData = skuForecastData.filter(d => d.orderDate === orderDate)
        const values = currentMonths.map(month => {
          const data = orderData.find(d => d.month === month)
          return data ? data.value : null
        })
        stairData.push({ orderDate, values })
      })
      
      // Add delta rows
      stairData.forEach((row, i) => {
        const deltaValues = [sku.partNumber, sku.partName, sku.order, row.orderDate]
        
        currentMonths.forEach((month, j) => {
          if (i === 0) {
            // First row, no delta
            deltaValues.push('')
          } else {
            // Calculate delta
            const currentVal = row.values[j]
            const prevVal = stairData[i - 1].values[j]
            const delta = calcDelta(currentVal, prevVal)
            deltaValues.push(delta !== null ? delta : '')
          }
        })
        
        deltaData.push(deltaValues)
      })
    })
    
    // Create delta worksheet
    const deltaWs = XLSX.utils.aoa_to_sheet(deltaData)
    deltaWs['!cols'] = colWidths // Same column widths
    
    // Add delta worksheet to workbook
    XLSX.utils.book_append_sheet(wb, deltaWs, 'Delta Data')
    
    // Generate Excel file and download
    const fileName = `stair_forecast_data_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const selectedSKUData = skuList.find(sku => sku.id === selectedSKU)
  const stairData = getStairData()

  return (
    <div className={`min-h-screen ${getThemeClasses()} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-neutral-100'}`}>
              Stair Forecast Dashboard
            </h1>
            <p className={theme === 'light' ? 'text-gray-600' : 'text-neutral-400'}>
              Data-based forecast with Delta {deltaMode ? 'ON' : 'OFF'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'light' 
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            
            {/* Delta Toggle */}
            <button
              onClick={() => setDeltaMode(!deltaMode)}
              className={`px-4 py-2 rounded-xl transition font-medium ${
                deltaMode 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : theme === 'light'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
              }`}
            >
              Toggle Delta
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SKU Selection */}
          <Card className={getCardClasses()}>
            <CardHeader>
              <CardTitle className={`text-lg ${theme === 'light' ? 'text-gray-900' : 'text-neutral-100'}`}>
                Select SKU
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSKU} onValueChange={setSelectedSKU}>
                <SelectTrigger className={theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-neutral-800 border-neutral-700 text-neutral-100'}>
                  <SelectValue placeholder="Choose SKU" />
                </SelectTrigger>
                <SelectContent className={theme === 'light' ? 'bg-white border-gray-300' : 'bg-neutral-800 border-neutral-700'}>
                  {skuList.map((sku) => (
                    <SelectItem key={sku.id} value={sku.id} className={theme === 'light' ? 'text-gray-900' : 'text-neutral-100'}>
                      {sku.partNumber} - {sku.partName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSKUData && (
                <div className={`mt-3 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-neutral-400'}`}>
                  <p><strong>Part Number:</strong> {selectedSKUData.partNumber}</p>
                  <p><strong>Part Name:</strong> {selectedSKUData.partName}</p>
                  <p><strong>Order:</strong> {selectedSKUData.order}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Data */}
          <Card className={getCardClasses()}>
            <CardHeader>
              <CardTitle className={`text-lg ${theme === 'light' ? 'text-gray-900' : 'text-neutral-100'}`}>
                Upload Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload" className={theme === 'light' ? 'text-gray-700' : 'text-neutral-300'}>
                  Choose CSV file
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className={`mt-1 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-neutral-800 border-neutral-700 text-neutral-100'}`}
                />
              </div>
              {uploadFile && (
                <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-neutral-400'}`}>
                  Selected: {uploadFile.name}
                </div>
              )}
              <Button 
                onClick={handleUploadSubmit} 
                disabled={!uploadFile || isLoading}
                className={`w-full ${
                  theme === 'light' 
                    ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
                }`}
              >
                {isLoading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Uploading...' : 'Upload'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stair Forecast Table */}
        <Card className={getCardClasses()}>
          <CardHeader>
            <CardTitle className={`text-xl ${theme === 'light' ? 'text-gray-900' : 'text-neutral-100'}`}>
              Stair Forecast Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`overflow-auto border rounded-2xl ${
              theme === 'light' 
                ? 'border-gray-200 bg-white' 
                : 'border-neutral-800 bg-neutral-900'
            }`}>
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className={getTableHeaderClasses()}>
                    <th className={`sticky left-0 px-3 py-2 border-b text-left ${
                      theme === 'light' 
                        ? 'bg-gray-100 border-gray-200 text-gray-900' 
                        : 'bg-neutral-800 border-neutral-700 text-neutral-100'
                    }`}>
                      Order
                    </th>
                    {months.map((month) => (
                      <th key={month} className={`px-3 py-2 border-b whitespace-nowrap ${
                        theme === 'light' 
                          ? 'border-gray-200 text-gray-900' 
                          : 'border-neutral-700 text-neutral-100'
                      }`}>
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stairData.map((row, i) => (
                    <tr key={i} className={getTableRowClasses(i)}>
                      <td className={`sticky left-0 px-3 py-2 border-b font-medium ${
                        theme === 'light' 
                          ? 'bg-white border-gray-200 text-gray-900' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-100'
                      }`}>
                        <div>
                          <div>{row.orderDate}</div>
                          <div className={`text-xs ${getSubTextColorClasses()}`}>
                            {row.firstMonth} - {row.lastMonth}
                          </div>
                        </div>
                      </td>
                      {row.values.map((v, j) => {
                        let displayVal = v
                        if (deltaMode && i > 0) {
                          const prev = stairData[i - 1].values[j]
                          const diff = calcDelta(v, prev)
                          displayVal = diff != null ? diff : ''
                        }
                        
                        // Check if this column is within the active range for this order
                        const currentMonth = months[j]
                        const isInRange = row.firstMonth && row.lastMonth && 
                          compareMonths(currentMonth, row.firstMonth) >= 0 && 
                          compareMonths(currentMonth, row.lastMonth) <= 0
                        
                        const color = getTextColorClasses(deltaMode, displayVal)
                        
                        // Dynamic background colors based on theme
                        const getBgColor = () => {
                          if (v) {
                            return theme === 'light' ? '#f3f4f6' : '#202020'
                          }
                          // Empty cells always white in light theme
                          return theme === 'light' ? 'white' : 'transparent'
                        }
                        
                        const getBorderColor = () => {
                          return theme === 'light' ? 'border-gray-200' : 'border-neutral-800'
                        }
                        
                        const getEmptyTextColor = () => {
                          if (!v) {
                            // Empty cells always subtle in light theme
                            return theme === 'light' ? 'text-gray-300' : 'text-neutral-800'
                          }
                          return color
                        }
                        
                        return (
                          <td
                            key={j}
                            className={`px-3 py-2 border-b text-right ${getBorderColor()} ${getEmptyTextColor()}`}
                            style={{ 
                              backgroundColor: getBgColor(),
                              opacity: theme === 'light' ? 1 : (isInRange ? 1 : 0.3)
                            }}
                          >
                            {v == null ? '' : displayVal.toLocaleString('id-ID')}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button 
            variant="outline" 
            onClick={handleExport} 
            className={
              theme === 'light'
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-neutral-800 border-neutral-700 text-neutral-100 hover:bg-neutral-700'
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button 
            onClick={handleRefresh} 
            disabled={isLoading} 
            className={
              theme === 'light'
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
            }
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Info */}
        <div className={theme === 'light' ? 'text-gray-600 text-xs' : 'text-neutral-400 text-xs'}>
          <p>
            Semua nilai diambil langsung dari data yang di-upload. Tidak ada forecast otomatis.
            Saat <b>Delta ON</b>, setiap sel menunjukkan perubahan (Δ) terhadap snapshot order sebelumnya.
          </p>
        </div>
      </div>
    </div>
  )
}