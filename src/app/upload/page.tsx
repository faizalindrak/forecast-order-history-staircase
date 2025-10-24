'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, RefreshCw, Sun, Moon, Download } from 'lucide-react'
import { useTheme } from 'next-themes'

interface UploadSummary {
  skusCreated: number
  forecastEntriesCreated: number
  shipTosCreated: number
  errors: string[]
}

export default function UploadPage() {
  const [mounted, setMounted] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [summary, setSummary] = useState<UploadSummary | null>(null)
  const [message, setMessage] = useState<string>('')
  const [versionsUsed, setVersionsUsed] = useState<number[]>([])
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const effectiveTheme = mounted ? (resolvedTheme ?? 'light') : 'light'

  const getThemeClasses = () => {
    if (!mounted) return 'bg-white text-gray-900'
    return effectiveTheme === 'light' ? 'bg-white text-gray-900' : 'bg-neutral-950 text-neutral-100'
  }

  const getCardClasses = () => {
    if (!mounted) return 'bg-white border-gray-200'
    return effectiveTheme === 'light' ? 'bg-white border-gray-200' : 'bg-neutral-900 border-neutral-800'
  }

  const getInputClasses = () => {
    if (!mounted) return 'bg-white border-gray-300 text-gray-900'
    return effectiveTheme === 'light'
      ? 'bg-white border-gray-300 text-gray-900'
      : 'bg-neutral-800 border-neutral-700 text-neutral-100'
  }

  const getMutedText = () => (effectiveTheme === 'light' ? 'text-gray-500' : 'text-neutral-500')

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadFile(file)
      setSummary(null)
      setMessage('')
      setVersionsUsed([])
    }
  }

  const handleUploadSubmit = async () => {
    if (!uploadFile) return

    setIsUploading(true)
    setSummary(null)
    setMessage('')
    setVersionsUsed([])

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const contentType = response.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')

      if (!response.ok) {
        const errorBody = isJson ? await response.json() : await response.text()
        const errorMessage = typeof errorBody === 'string' ? errorBody : errorBody?.error || 'Gagal mengunggah file'
        setMessage(errorMessage)
        return
      }

      const payload = isJson ? await response.json() : { message: await response.text() }
      const results = payload?.results as UploadSummary | undefined
      const detectedVersions: number[] = Array.isArray(payload?.versionsUsed) ? payload.versionsUsed : []

      setVersionsUsed(detectedVersions)

      if (results) {
        setSummary(results)
        if (detectedVersions.length > 0) {
          setMessage(`Upload berhasil. Versi ditemukan: ${detectedVersions.join(', ')}`)
        } else {
          setMessage(`Upload berhasil. Versi default: ${payload.version ?? 'latest'}`)
        }
      } else {
        setMessage(payload?.message ?? 'Upload berhasil')
      }

      setUploadFile(null)
      const fileInput = document.getElementById('file-upload') as HTMLInputElement | null
      if (fileInput) fileInput.value = ''
    } catch (error) {
      console.error('Upload error:', error)
      setMessage('Terjadi kesalahan saat mengunggah file')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={`min-h-screen ${getThemeClasses()} p-6 lg:p-10`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${effectiveTheme === 'light' ? 'text-gray-900' : 'text-neutral-100'}`}>
              Upload Forecast Data
            </h1>
            <p className={getMutedText()}>
              Unggah file CSV untuk memperbarui versi forecast terbaru per bulan.
            </p>
          </div>
          <button
            onClick={() => setTheme(effectiveTheme === 'light' ? 'dark' : 'light')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              effectiveTheme === 'light'
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
            }`}
          >
            {effectiveTheme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {effectiveTheme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>

        <Card className={getCardClasses()}>
          <CardHeader>
            <CardTitle className={`text-lg ${effectiveTheme === 'light' ? 'text-gray-900' : 'text-neutral-100'}`}>
              Format CSV Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className={effectiveTheme === 'light' ? 'text-gray-700' : 'text-neutral-300'}>
                Gunakan kolom: PART NUMBER, PART NAME, ORDER, SHIP TO, SHIP TO NAME (opsional), ORDER DATE (format MMM-YY) dan ORDER VERSION (opsional).
                Kolom bulan gunakan pola N, N+1, ..., N+6 untuk merepresentasikan bulan relatif terhadap ORDER DATE.
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className={`mt-2 ${getInputClasses()}`}
              />
            </div>

            {uploadFile && (
              <p className={`text-sm ${effectiveTheme === 'light' ? 'text-gray-600' : 'text-neutral-400'}`}>
                File dipilih: {uploadFile.name}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={handleUploadSubmit}
                disabled={!uploadFile || isUploading}
                className={`w-full sm:w-auto ${
                  effectiveTheme === 'light'
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
                }`}
              >
                {isUploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isUploading ? 'Mengunggah...' : 'Unggah Data'}
              </Button>

              <Button variant={effectiveTheme === 'light' ? 'outline' : 'secondary'} asChild className="w-full sm:w-auto">
                <a href="/forecast-upload-template.csv" download>
                  <Download className="mr-2 h-4 w-4" />
                  Unduh Template CSV
                </a>
              </Button>
            </div>

            {message && (
              <div className={`rounded-lg border p-3 text-sm ${effectiveTheme === 'light' ? 'border-gray-200 text-gray-700' : 'border-neutral-700 text-neutral-200'}`}>
                {message}
              </div>
            )}

            {summary && (
              <div className={`rounded-xl border p-4 text-sm ${effectiveTheme === 'light' ? 'border-gray-200 bg-gray-50 text-gray-700' : 'border-neutral-800 bg-neutral-900 text-neutral-200'}`}>
                <p className="font-semibold">Ringkasan:</p>
                <ul className="mt-2 space-y-1 list-disc pl-5">
                  <li>SKU baru: {summary.skusCreated}</li>
                  <li>Entry forecast baru: {summary.forecastEntriesCreated}</li>
                  <li>Ship-to baru: {summary.shipTosCreated}</li>
                  {versionsUsed.length > 0 && (
                    <li>Versi digunakan: {versionsUsed.join(', ')}</li>
                  )}
                  {summary.errors.length > 0 && (
                    <li>
                      Error ({summary.errors.length}):
                      <ul className="mt-1 space-y-1 list-disc pl-5">
                        {summary.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
