'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SkuSelect } from '@/components/sku-select'
import { cn } from '@/lib/utils'
import { Download, RefreshCw, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import * as XLSX from 'xlsx-js-style'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
]

const formatMonthLabel = (date: Date): string => {
  const month = MONTH_NAMES[date.getUTCMonth()]
  const year = String(date.getUTCFullYear()).slice(-2)
  return `${month}-${year}`
}

const formatMonthFromIso = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return formatMonthLabel(date)
}

const monthLabelToTimestamp = (label: string): number => {
  const [rawMonth, rawYear] = label.split('-')
  const monthIndex = MONTH_NAMES.findIndex((name) => name === rawMonth)
  if (monthIndex === -1 || !rawYear) {
    const parsed = new Date(label)
    return Number.isNaN(parsed.getTime()) ? Number.NEGATIVE_INFINITY : parsed.getTime()
  }
  const yearNumber = Number(rawYear)
  const fullYear = Number.isNaN(yearNumber)
    ? new Date().getUTCFullYear()
    : (yearNumber >= 70 ? 1900 + yearNumber : 2000 + yearNumber)
  return Date.UTC(fullYear, monthIndex, 1)
}

interface ShipTo {
  id: string
  code: string
  name?: string | null
}

interface ForecastData {
  id: string
  skuId: string
  shipToId: string | null
  orderDate: string
  month: string
  value: number
  version: number
  sku?: {
    partNumber: string
    partName: string
    order: string
  }
  shipTo?: ShipTo
}

interface ForecastApiResponse {
  entries: ForecastData[]
  availableVersions: number[]
  requestedVersion: number | 'latest'
  versionSelection: Record<string, number | null>
  fallbackMonths: string[]
}

interface SKU {
  id: string
  partNumber: string
  partName: string
  order: string
  shipTos?: ShipTo[]
}

interface StairDataItem {
  orderDate: string
  shipToCode?: string
  shipToName?: string | null
  values: (number | null)[]
  firstMonth?: string
  lastMonth?: string
}

export default function Home() {
  const [selectedSKU, setSelectedSKU] = useState<string>('')
  const [selectedShipTo, setSelectedShipTo] = useState<string>('all')
  const [skuList, setSkuList] = useState<SKU[]>([])
  const [forecastData, setForecastData] = useState<ForecastData[]>([])
  const [availableVersions, setAvailableVersions] = useState<number[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string>('latest')
  const [fallbackMonths, setFallbackMonths] = useState<string[]>([])
  const [deltaMode, setDeltaMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, resolvedTheme, setTheme } = useTheme()

  // Handle mounted state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const effectiveTheme = mounted ? (resolvedTheme ?? 'light') : 'light'
const isLight = effectiveTheme === 'light'

  // Theme helper functions
  const getThemeClasses = () => {
    if (!mounted) return 'bg-white text-gray-900'

    if (effectiveTheme === 'light') {
      return 'bg-white text-gray-900'
    }

    return 'bg-neutral-950 text-neutral-100'
  }

  const getCardClasses = () => {
    if (!mounted) return 'bg-white border-gray-200'

    if (effectiveTheme === 'light') {
      return 'bg-white border-gray-200' // Simple white cards
    }

    return 'bg-neutral-900 border-neutral-800'
  }

  const getTableHeaderClasses = () => {
    if (!mounted) return 'bg-gray-100 text-gray-900'

    if (effectiveTheme === 'light') {
      return 'bg-gray-100 text-gray-900'
    }

    return 'bg-neutral-800 text-neutral-100'
  }

  const getTableRowClasses = (index: number) => {
    if (!mounted) return 'bg-white'

    if (effectiveTheme === 'light') {
      return 'bg-white' // Always white for light theme
    }

    return index % 2 === 0 ? 'bg-neutral-900' : 'bg-neutral-900/70'
  }

  const getTextColorClasses = (isDelta: boolean, value: number | null | undefined) => {
    if (!mounted) return isDelta && value ? (value > 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-900'

    if (effectiveTheme === 'light') {
      if (isDelta && value) {
        return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-900'
      }
      return 'text-gray-900'
    }

    // Dark mode - differentiate between positive and negative delta values
    if (isDelta && value) {
      return value > 0 ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-neutral-100'
    }
    return 'text-neutral-100'
  }

  const getSubTextColorClasses = () => {
    if (!mounted) return 'text-gray-500'

    if (effectiveTheme === 'light') {
      return 'text-gray-500'
    }

    return 'text-neutral-500'
  }

  // Helper function untuk compare bulan
  const compareMonths = (month1: string, month2: string): number => {
    return monthLabelToTimestamp(month1) - monthLabelToTimestamp(month2)
  }

  // Generate dynamic months from forecast data
  const months = useMemo(() => {
    if (forecastData.length === 0) return [] as string[]
    const uniqueMonths = Array.from(new Set(forecastData.map((d) => d.month)))
    return uniqueMonths.sort((a, b) => compareMonths(a, b))
  }, [forecastData])

  // Helper function untuk sorting order dates secara kronologis
  const sortOrderDates = (orderDates: string[]) => {
    return orderDates.sort((a, b) => compareMonths(a, b))
  }

  const fetchForecastData = useCallback(
    async (skuId: string, options?: { version?: string; shipToId?: string | 'all' }) => {
      if (!skuId) return

      try {
        const params = new URLSearchParams({ skuId })
        const desiredVersion = options?.version ?? selectedVersion
        const desiredShipTo = options?.shipToId ?? selectedShipTo
        const versionQuery = desiredVersion && desiredVersion !== 'latest' ? desiredVersion : 'latest'
        params.set('version', versionQuery)
        if (desiredShipTo && desiredShipTo !== 'all') {
          params.set('shipToId', desiredShipTo)
        }

        const response = await fetch(`/api/forecast?${params.toString()}`)
        if (!response.ok) {
          console.error('Failed to load forecast data')
          return
        }

        const data: ForecastApiResponse = await response.json()
        setForecastData(data.entries ?? [])
        setAvailableVersions(data.availableVersions ?? [])

        const resolvedVersion = data.requestedVersion === 'latest'
          ? 'latest'
          : data.requestedVersion.toString()

        setSelectedVersion((prev) => (prev === resolvedVersion ? prev : resolvedVersion))

        const fallbackLabels = Array.from(new Set(
          (data.fallbackMonths ?? []).map((iso) => {
            const label = formatMonthFromIso(iso)
            const version = data.versionSelection?.[iso] ?? null
            return version ? `${label} (v${version})` : label
          })
        ))
        setFallbackMonths(fallbackLabels)
      } catch (error) {
        console.error('Error loading forecast data:', error)
      }
    },
    [selectedVersion, selectedShipTo]
  )

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
            setSelectedShipTo(data[0].shipTos?.[0]?.id ?? 'all')
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (!selectedSKU) return
    const activeSku = skuList.find((sku) => sku.id === selectedSKU)
    if (!activeSku) return

    if (activeSku.shipTos && activeSku.shipTos.length > 0) {
      if (selectedShipTo !== 'all') {
        const matches = activeSku.shipTos.some((shipTo) => shipTo.id === selectedShipTo)
        if (!matches) {
          setSelectedShipTo(activeSku.shipTos[0].id)
        }
      }
    } else if (selectedShipTo !== 'all') {
      setSelectedShipTo('all')
    }
  }, [selectedSKU, skuList, selectedShipTo])

  // Load forecast data when SKU, version, atau ship-to berubah
  useEffect(() => {
    if (!selectedSKU) return
    fetchForecastData(selectedSKU, { version: selectedVersion, shipToId: selectedShipTo })
  }, [selectedSKU, selectedVersion, selectedShipTo, fetchForecastData])

  // Group forecast data by order date & ship-to untuk membentuk pola tangga
  const getStairData = (): StairDataItem[] => {
    if (forecastData.length === 0) return []

    const isAggregated = selectedShipTo === 'all'

    if (isAggregated) {
      const orderMap = new Map<string, Map<string, number>>()

      forecastData.forEach((entry) => {
        const monthMap = orderMap.get(entry.orderDate) ?? new Map<string, number>()
        const current = monthMap.get(entry.month) ?? 0
        monthMap.set(entry.month, current + entry.value)
        orderMap.set(entry.orderDate, monthMap)
      })

      const sortedOrderDates = Array.from(orderMap.keys()).sort(compareMonths)

      return sortedOrderDates.map((orderDate) => {
        const monthMap = orderMap.get(orderDate) ?? new Map<string, number>()
        const monthKeys = Array.from(monthMap.keys()).sort(compareMonths)
        const firstMonth = monthKeys[0]
        const lastMonth = monthKeys[monthKeys.length - 1]

        const values = months.map((month) => {
          if (!firstMonth || !lastMonth) return null
          if (compareMonths(month, firstMonth) < 0 || compareMonths(month, lastMonth) > 0) {
            return null
          }
          const sum = monthMap.get(month)
          return sum !== undefined ? sum : null
        })

        return {
          orderDate,
          shipToCode: 'Semua Ship To',
          shipToName: null,
          values,
          firstMonth,
          lastMonth,
        }
      })
    }

    const groupIndex = new Map<string, number>()
    const groups: Array<{ orderDate: string; shipToCode?: string; shipToName?: string | null; entries: ForecastData[] }> = []

    forecastData.forEach((entry) => {
      const groupKey = `${entry.shipToId ?? 'null'}::${entry.orderDate}`
      if (!groupIndex.has(groupKey)) {
        groupIndex.set(groupKey, groups.length)
        groups.push({
          orderDate: entry.orderDate,
          shipToCode: entry.shipTo?.code ?? undefined,
          shipToName: entry.shipTo?.name ?? null,
          entries: []
        })
      }
      const index = groupIndex.get(groupKey)
      if (index !== undefined) {
        groups[index].entries.push(entry)
      }
    })

    const sortedGroups = groups.sort((a, b) => {
      const codeA = (a.shipToCode ?? '').toLowerCase()
      const codeB = (b.shipToCode ?? '').toLowerCase()
      if (codeA !== codeB) {
        return codeA.localeCompare(codeB)
      }
      return compareMonths(a.orderDate, b.orderDate)
    })

    return sortedGroups.map((group) => {
      const orderMonths = group.entries.map((d) => d.month).sort((a, b) => compareMonths(a, b))
      const firstMonth = orderMonths[0]
      const lastMonth = orderMonths[orderMonths.length - 1]

      const values = months.map((month) => {
        if (!firstMonth || !lastMonth) return null
        if (compareMonths(month, firstMonth) < 0 || compareMonths(month, lastMonth) > 0) {
          return null
        }
        const record = group.entries.find((d) => d.month === month)
        return record ? record.value : null
      })

      return {
        orderDate: group.orderDate,
        shipToCode: group.shipToCode,
        shipToName: group.shipToName,
        values,
        firstMonth,
        lastMonth,
      }
    })
  }

  const calcDelta = (val: number | null, prevVal: number | null) => {
    if (val == null || prevVal == null) return null
    return val - prevVal
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
          if (selectedSKU !== currentSKU) {
            setSelectedSKU(currentSKU)
          } else {
            await fetchForecastData(currentSKU, { version: selectedVersion, shipToId: selectedShipTo })
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
    const currentMonths = months
    const activeSku = skuList.find((sku) => sku.id === selectedSKU)
    if (!activeSku) {
      console.warn('No active SKU selected for export')
      return
    }

    const stairRows = getStairData()

    // Prepare Forecast data
    const allData: any[] = []
    const headers = ['PART NUMBER', 'PART NAME', 'ORDER', 'SHIP TO', 'ORDER DATE', ...currentMonths]
    allData.push(headers)

    stairRows.forEach((row) => {
      const values: (string | number)[] = [
        activeSku.partNumber,
        activeSku.partName,
        activeSku.order,
        row.shipToCode ?? '',
        row.orderDate,
      ]

      currentMonths.forEach((_, idx) => {
        const cellValue = row.values[idx]
        values.push(cellValue != null ? Number(cellValue) : '')
      })

      allData.push(values)
    })

    // Prepare Delta data (per ship-to)
    const deltaData: any[] = []
    const deltaHeaders = ['PART NUMBER', 'PART NAME', 'ORDER', 'SHIP TO', 'ORDER DATE', ...currentMonths.map((m) => `${m} (Δ)`)]
    deltaData.push(deltaHeaders)

    stairRows.forEach((row, index) => {
      const prevRow = index > 0 && stairRows[index - 1].shipToCode === row.shipToCode ? stairRows[index - 1] : null
      const deltaValues: (string | number | '')[] = [
        activeSku.partNumber,
        activeSku.partName,
        activeSku.order,
        row.shipToCode ?? '',
        row.orderDate,
      ]

      currentMonths.forEach((_, idx) => {
        if (!prevRow) {
          deltaValues.push('')
        } else {
          const delta = calcDelta(row.values[idx], prevRow.values[idx])
          deltaValues.push(delta != null ? Number(delta) : '')
        }
      })

      deltaData.push(deltaValues)
    })

    // Combine into single sheet
    const combinedData: any[] = [
      ...allData,
      [],
      ...deltaData
    ]
    
    const ws = XLSX.utils.aoa_to_sheet(combinedData)
    
    // Column widths
    const colWidths = [
      { wch: 15 }, // PART NUMBER
      { wch: 30 }, // PART NAME
      { wch: 12 }, // ORDER
      { wch: 12 }, // SHIP TO
      { wch: 12 }, // ORDER DATE
      ...currentMonths.map(() => ({ wch: 12 })) // Month columns
    ]
    ws['!cols'] = colWidths
    
    // Styling with xlsx-js-style
    const totalCols = 5 + currentMonths.length
    const forecastRows = allData.length
    const deltaHeaderRow = forecastRows + 2            // 1-based row index for Delta header in Excel
    const deltaDataStartRow = forecastRows + 3         // 1-based start of Delta data
    const totalRows = combinedData.length
    
    // Define borders
    const thinBorder = {
      top: { style: 'thin', color: { rgb: 'FF000000' } },
      left: { style: 'thin', color: { rgb: 'FF000000' } },
      bottom: { style: 'thin', color: { rgb: 'FF000000' } },
      right: { style: 'thin', color: { rgb: 'FF000000' } },
    }
    
    // Colors for delta
    const NEG_FILL = 'FFFFC7CE' // light red
    const NEG_FONT = 'FF9C0006' // dark red
    const POS_FILL = 'FFC6EFCE' // light green
    const POS_FONT = 'FF006100' // dark green
    
    // Helper to get or create a cell
    const ensureCell = (r0: number, c0: number) => {
      const addr = XLSX.utils.encode_cell({ r: r0, c: c0 })
      if (!ws[addr]) ws[addr] = { t: 's', v: '' }
      return addr
    }
    
    // Apply borders and alignment for Forecast (including header)
    for (let r = 0; r < forecastRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const addr = ensureCell(r, c)
        const cell: any = ws[addr]
        const isNumberColumn = c >= 5
        // number format
        if (typeof cell.v === 'number') {
          cell.t = 'n'
          cell.z = '#,##0'
        }
        // header bold
        const isHeader = r === 0
        cell.s = {
          ...(cell.s || {}),
          border: thinBorder,
          alignment: { horizontal: isNumberColumn ? 'right' : 'left', vertical: 'center' },
          ...(isHeader ? { font: { bold: true } } : {})
        }
      }
    }
    
    // Delta header styling
    for (let c = 0; c < totalCols; c++) {
      const addr = ensureCell(deltaHeaderRow - 1, c) // convert to 0-based
      const cell: any = ws[addr]
      const isNumberColumn = c >= 5
      cell.s = {
        ...(cell.s || {}),
        border: thinBorder,
        alignment: { horizontal: isNumberColumn ? 'right' : 'left', vertical: 'center' },
        font: { bold: true }
      }
    }
    
    // Delta data styling with conditional colors
    for (let r1 = deltaDataStartRow; r1 <= totalRows; r1++) {
      const r0 = r1 - 1 // zero-based
      for (let c = 0; c < totalCols; c++) {
        const addr = ensureCell(r0, c)
        const cell: any = ws[addr]
        const isNumberColumn = c >= 5
        // Border + alignment
        cell.s = {
          ...(cell.s || {}),
          border: thinBorder,
          alignment: { horizontal: isNumberColumn ? 'right' : 'left', vertical: 'center' },
        }
        // Number format and conditional coloring
        if (isNumberColumn && typeof cell.v === 'number') {
          cell.t = 'n'
          cell.z = '#,##0'
          if (cell.v > 0) {
            cell.s = {
              ...(cell.s || {}),
              fill: { patternType: 'solid', fgColor: { rgb: POS_FILL } },
              font: { color: { rgb: POS_FONT } }
            }
          } else if (cell.v < 0) {
            cell.s = {
              ...(cell.s || {}),
              fill: { patternType: 'solid', fgColor: { rgb: NEG_FILL } },
              font: { color: { rgb: NEG_FONT } }
            }
          }
        }
      }
    }
    
    // Build and download
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Forecast & Delta')
    const fileName = `stair_forecast_data_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const selectedSKUData = skuList.find(sku => sku.id === selectedSKU)
  const shipToOptions = selectedSKUData?.shipTos ?? []
  const shipToSelectValue = shipToOptions.length > 0 ? selectedShipTo : 'all'
  const stairData = getStairData()
  const currentVersionDisplay = selectedVersion === 'latest' ? 'Terbaru' : `v${selectedVersion}`

  return (
    <div className={`min-h-screen ${getThemeClasses()} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${effectiveTheme === 'light' ? 'text-gray-900' : 'text-neutral-100'}`}>
              Stair Forecast Dashboard
            </h1>
            <p className={effectiveTheme === 'light' ? 'text-gray-600' : 'text-neutral-400'}>
              Data-based forecast with Delta {deltaMode ? 'ON' : 'OFF'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(effectiveTheme === 'light' ? 'dark' : 'light')}
              className={`p-2 rounded-lg transition-colors ${
                effectiveTheme === 'light' 
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
              aria-label="Toggle theme"
            >
              {effectiveTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            
            {/* Delta Toggle */}
            <button
              onClick={() => setDeltaMode(!deltaMode)}
              className={`px-4 py-2 rounded-xl transition font-medium ${
                deltaMode 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : effectiveTheme === 'light'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
              }`}
            >
              Toggle Delta
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* SKU Selection */}
          <Card className={cn(
            getCardClasses(),
            'relative overflow-hidden border-none bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg'
          )}>
            <div className="pointer-events-none absolute inset-0 opacity-20"
                 style={{
                   backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0, transparent 45%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.2) 0, transparent 55%)'
                 }}
            />
            <CardHeader className="space-y-1 pb-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Pilih SKU</p>
              <CardTitle className={`text-2xl font-semibold ${effectiveTheme === 'light' ? 'text-gray-900' : 'text-neutral-100'}`}>
                Fokus Analisa SKU
              </CardTitle>
              <p className={`text-sm ${effectiveTheme === 'light' ? 'text-gray-600' : 'text-neutral-400'}`}>
                Filter data staircase berdasarkan SKU dan versi forecast pilihanmu.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex w-full flex-col gap-3 md:max-w-xl">
                  <SkuSelect
                    value={selectedSKU}
                    onChange={setSelectedSKU}
                    options={skuList.map((sku) => ({
                      id: sku.id,
                      label: sku.partNumber,
                      description: sku.partName,
                    }))}
                    placeholder="Cari atau pilih SKU"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                      <Label className={effectiveTheme === 'light' ? 'text-gray-700' : 'text-neutral-300'}>
                        Pilih Ship To
                      </Label>
                      <Select
                        value={shipToSelectValue}
                        onValueChange={setSelectedShipTo}
                        disabled={shipToOptions.length === 0}
                      >
                        <SelectTrigger
                          className={cn(
                            'h-11 rounded-2xl border border-transparent px-4 text-base font-medium shadow-sm transition',
                            effectiveTheme === 'light'
                              ? 'bg-white text-gray-900 focus:border-primary/40 focus:ring-2 focus:ring-primary/40'
                              : 'bg-neutral-850 text-neutral-100 focus:border-primary/60 focus:ring-2 focus:ring-primary/60'
                          )}
                        >
                          <SelectValue placeholder="Semua Ship To" />
                        </SelectTrigger>
                        <SelectContent className={effectiveTheme === 'light' ? 'bg-white border border-gray-200 text-gray-900' : 'bg-neutral-900 border border-neutral-700 text-neutral-100'}>
                          <SelectItem
                            value="all"
                            className={cn(
                              'rounded-lg px-3 py-2 text-sm',
                              effectiveTheme === 'light' ? 'text-gray-900 data-[highlighted]:bg-gray-100' : 'text-neutral-100 data-[highlighted]:bg-neutral-800'
                            )}
                          >
                            Semua Ship To
                          </SelectItem>
                          {shipToOptions.map((shipTo) => (
                            <SelectItem
                              key={shipTo.id}
                              value={shipTo.id}
                              className={cn(
                                'rounded-lg px-3 py-2 text-sm',
                                effectiveTheme === 'light' ? 'text-gray-900 data-[highlighted]:bg-gray-100' : 'text-neutral-100 data-[highlighted]:bg-neutral-800'
                              )}
                            >
                              {shipTo.code}
                              {shipTo.name ? ` - ${shipTo.name}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 space-y-2">
                      <Label className={effectiveTheme === 'light' ? 'text-gray-700' : 'text-neutral-300'}>
                        Pilih Versi Forecast
                      </Label>
                      <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                        <SelectTrigger className={cn(
                          'h-11 rounded-2xl border border-transparent px-4 text-base font-medium shadow-sm transition',
                          effectiveTheme === 'light'
                            ? 'bg-white text-gray-900 focus:border-primary/40 focus:ring-2 focus:ring-primary/40'
                            : 'bg-neutral-850 text-neutral-100 focus:border-primary/60 focus:ring-2 focus:ring-primary/60'
                        )}>
                          <SelectValue placeholder="Pilih Versi" />
                        </SelectTrigger>
                        <SelectContent className={effectiveTheme === 'light' ? 'bg-white border border-gray-200 text-gray-900' : 'bg-neutral-900 border border-neutral-700 text-neutral-100'}>
                          <SelectItem
                            value="latest"
                            className={cn(
                              'rounded-lg px-3 py-2 text-sm',
                              effectiveTheme === 'light' ? 'text-gray-900 data-[highlighted]:bg-gray-100' : 'text-neutral-100 data-[highlighted]:bg-neutral-800'
                            )}
                          >
                            Versi Terbaru
                          </SelectItem>
                          {availableVersions.map((version) => (
                            <SelectItem
                              key={version}
                              value={version.toString()}
                              className={cn(
                                'rounded-lg px-3 py-2 text-sm',
                                effectiveTheme === 'light' ? 'text-gray-900 data-[highlighted]:bg-gray-100' : 'text-neutral-100 data-[highlighted]:bg-neutral-800'
                              )}
                            >
                              Versi {version}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {fallbackMonths.length > 0 && (
                    <p className={`text-xs ${getSubTextColorClasses()}`}>
                      Beberapa bulan tidak memiliki versi yang dipilih, sehingga menggunakan versi terbaru: {fallbackMonths.join(', ')}
                    </p>
                  )}
                </div>
                {selectedSKUData && (
                  <div className={`grid w-full gap-2 rounded-2xl border px-4 py-3 text-sm backdrop-blur md:max-w-sm ${
                    effectiveTheme === 'light'
                      ? 'border-white/60 bg-white/70 text-gray-700'
                      : 'border-neutral-700 bg-neutral-900/60 text-neutral-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">Part Number</span>
                      <span className="font-semibold">{selectedSKUData.partNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">Part Name</span>
                      <span className="font-medium">{selectedSKUData.partName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">Order</span>
                      <span className="font-medium">{selectedSKUData.order}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">Ship To Aktif</span>
                      <span className="font-medium">
                        {shipToSelectValue === 'all'
                          ? 'Semua'
                          : shipToOptions.find((shipTo) => shipTo.id === shipToSelectValue)?.code ?? '-'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Stair Forecast Table */}
        <Card className={getCardClasses()}>
          <CardHeader>
            <CardTitle className={`text-xl ${effectiveTheme === 'light' ? 'text-gray-900' : 'text-neutral-100'}`}>
              Stair Forecast Data (Versi {currentVersionDisplay})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`overflow-auto border rounded-2xl ${
              effectiveTheme === 'light' 
                ? 'border-gray-200 bg-white' 
                : 'border-neutral-800 bg-neutral-900'
            }`}>
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className={getTableHeaderClasses()}>
                    <th className={`sticky left-0 px-3 py-2 border-b text-left ${
                      effectiveTheme === 'light' 
                        ? 'bg-gray-100 border-gray-200 text-gray-900' 
                        : 'bg-neutral-800 border-neutral-700 text-neutral-100'
                    }`}>
                      Order / Ship To
                    </th>
                    {months.map((month) => (
                      <th key={month} className={`px-3 py-2 border-b whitespace-nowrap ${
                        effectiveTheme === 'light' 
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
                        effectiveTheme === 'light' 
                          ? 'bg-white border-gray-200 text-gray-900' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-100'
                      }`}>
                        <div className="flex flex-col gap-1">
                          <span>{row.orderDate}</span>
                        </div>
                      </td>
                      {row.values.map((v, j) => {
                        // Calculate delta against previous row for this month
                        const prevRow = i > 0 && stairData[i - 1].shipToCode === row.shipToCode ? stairData[i - 1] : null
                        const prev = prevRow ? prevRow.values[j] : null
                        const delta = calcDelta(v, prev)

                        // Check if this column is within the active range for this order
                        const currentMonth = months[j]
                        const isInRange = row.firstMonth && row.lastMonth &&
                          compareMonths(currentMonth, row.firstMonth) >= 0 &&
                          compareMonths(currentMonth, row.lastMonth) <= 0

                        // Colors
                        const baseTextColor = getTextColorClasses(false, v ?? null)
                        const deltaTextColor = getTextColorClasses(true, delta ?? null)

                        // Dynamic background colors based on theme
                        const getBgColor = () => {
                          if (v != null) {
                            return effectiveTheme === 'light' ? '#f3f4f6' : '#202020'
                          }
                          // Empty cells always white in light theme
                          return effectiveTheme === 'light' ? 'white' : 'transparent'
                        }

                        const getBorderColor = () => {
                          return effectiveTheme === 'light' ? 'border-gray-200' : 'border-neutral-800'
                        }

                        // Format helpers
                        const formatNumber = (num: number | null) =>
                          num == null ? '' : num.toLocaleString('id-ID')

                        const formatDelta = (num: number | null) => {
                          if (num == null) return ''
                          const absStr = Math.abs(num).toLocaleString('id-ID')
                          return `${num > 0 ? '+' : num < 0 ? '-' : ''}${num === 0 ? '0' : absStr}`
                        }

                        const showDelta = deltaMode && i > 0 && delta != null

                        return (
                          <td
                            key={j}
                            className={`px-3 py-2 border-b text-right ${getBorderColor()}`}
                            style={{
                              backgroundColor: getBgColor(),
                              opacity: effectiveTheme === 'light' ? 1 : (isInRange ? 1 : 0.3)
                            }}
                          >
                            <div className="leading-tight">
                              <div className={v == null
                                ? (effectiveTheme === 'light' ? 'text-gray-300' : 'text-neutral-800')
                                : baseTextColor
                              }>
                                {formatNumber(v)}
                              </div>
                              {showDelta && (
                                <div className={`mt-0.5 text-[11px] ${deltaTextColor}`}>
                                  Δ {formatDelta(delta)}
                                </div>
                              )}
                            </div>
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
              effectiveTheme === 'light'
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
              effectiveTheme === 'light'
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
            }
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Info */}
      </div>
    </div>
  )
}