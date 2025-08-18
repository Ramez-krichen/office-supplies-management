'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react'

interface ExportButtonProps {
  data: any[]
  filename: string
  title?: string
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'ghost'
}

export function ExportButton({ data, filename, title = 'Export', className = '', variant = 'default' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const getButtonClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#008332] hover:bg-[#008332]';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700';
      case 'ghost':
        return 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50';
      case 'default':
      default:
        return 'bg-[#008332] hover:bg-[#008332]';
    }
  }

  const exportToCSV = () => {
    if (!data.length) return
    
    setIsExporting(true)
    try {
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ].join('\n')
      
      downloadFile(csvContent, `${filename}.csv`, 'text/csv')
    } finally {
      setIsExporting(false)
      setShowOptions(false)
    }
  }

  const exportToJSON = () => {
    setIsExporting(true)
    try {
      const jsonContent = JSON.stringify(data, null, 2)
      downloadFile(jsonContent, `${filename}.json`, 'application/json')
    } finally {
      setIsExporting(false)
      setShowOptions(false)
    }
  }

  const exportToTXT = () => {
    if (!data.length) return
    
    setIsExporting(true)
    try {
      const headers = Object.keys(data[0])
      const txtContent = data.map(row => 
        headers.map(header => `${header}: ${row[header]}`).join(' | ')
      ).join('\n')
      
      downloadFile(txtContent, `${filename}.txt`, 'text/plain')
    } finally {
      setIsExporting(false)
      setShowOptions(false)
    }
  }

  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isExporting || !data.length}
        className={`text-white px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors ${getButtonClasses()} ${className}`}
        title={data.length ? 'Export data' : 'No data to export'}
      >
        <Download className="h-4 w-4" />
        {isExporting ? 'Exporting...' : title}
      </button>

      {showOptions && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export as CSV
            </button>
            <button
              onClick={exportToJSON}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Export as JSON
            </button>
            <button
              onClick={exportToTXT}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <File className="h-4 w-4" />
              Export as TXT
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close options */}
      {showOptions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  )
}

// Quick Export Component for single format
interface QuickExportProps {
  data: any[]
  filename: string
  format: 'csv' | 'json' | 'txt'
  title?: string
  className?: string
  variant?: 'default' | 'primary' | 'secondary' | 'ghost'
}

export function QuickExport({ data, filename, format, title, className = '', variant = 'default' }: QuickExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const getButtonClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#008332] hover:bg-[#008332]';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700';
      case 'ghost':
        return 'bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50';
      case 'default':
      default:
        return 'bg-[#008332] hover:bg-[#008332]';
    }
  }

  const handleExport = () => {
    if (!data.length) return
    
    setIsExporting(true)
    try {
      let content: string
      let mimeType: string
      let fileExtension: string

      switch (format) {
        case 'csv':
          const headers = Object.keys(data[0])
          content = [
            headers.join(','),
            ...data.map(row => 
              headers.map(header => {
                const value = row[header]
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                  return `"${value.replace(/"/g, '""')}"`
                }
                return value
              }).join(',')
            )
          ].join('\n')
          mimeType = 'text/csv'
          fileExtension = 'csv'
          break
        
        case 'json':
          content = JSON.stringify(data, null, 2)
          mimeType = 'application/json'
          fileExtension = 'json'
          break
        
        case 'txt':
          const txtHeaders = Object.keys(data[0])
          content = data.map(row => 
            txtHeaders.map(header => `${header}: ${row[header]}`).join(' | ')
          ).join('\n')
          mimeType = 'text/plain'
          fileExtension = 'txt'
          break
        
        default:
          throw new Error('Unsupported format')
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.${fileExtension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const getIcon = () => {
    switch (format) {
      case 'csv': return <FileSpreadsheet className="h-4 w-4" />
      case 'json': return <FileText className="h-4 w-4" />
      case 'txt': return <File className="h-4 w-4" />
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || !data.length}
      className={`text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors ${getButtonClasses()} ${className}`}
      title={data.length ? `Export as ${format.toUpperCase()}` : 'No data to export'}
    >
      {getIcon()}
      {isExporting ? 'Exporting...' : (title || `Export ${format.toUpperCase()}`)}
    </button>
  )
}