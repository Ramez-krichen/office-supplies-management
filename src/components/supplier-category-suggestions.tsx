'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, Check, X, RefreshCw, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CategorySuggestion {
  category: string
  confidence: number
  method: string
  reasoning: string
}

interface SupplierCategorySuggestionsProps {
  supplierId: string
  supplierName: string
  currentCategories?: string[]
  onCategoriesUpdated?: (categories: string[]) => void
  autoRefresh?: boolean
}

export default function SupplierCategorySuggestions({
  supplierId,
  supplierName,
  currentCategories = [],
  onCategoriesUpdated,
  autoRefresh = false
}: SupplierCategorySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([])
  const [freshSuggestions, setFreshSuggestions] = useState<CategorySuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set())

  // Fetch current suggestions
  const fetchSuggestions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/suppliers/${supplierId}/detect-categories?enhanced=true`)
      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.statusText}`)
      }

      const data = await response.json()
      setSuggestions(data.currentSuggestions || [])
      setFreshSuggestions(data.freshSuggestions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions')
    } finally {
      setIsLoading(false)
    }
  }

  // Run category detection
  const runDetection = async () => {
    try {
      setIsDetecting(true)
      setError(null)

      const response = await fetch(`/api/suppliers/${supplierId}/detect-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enhanced: true })
      })

      if (!response.ok) {
        throw new Error(`Detection failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setSuggestions(data.suggestions || [])
        setFreshSuggestions(data.suggestions || [])
        onCategoriesUpdated?.(data.categories)
      } else {
        throw new Error(data.message || 'Detection failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed')
    } finally {
      setIsDetecting(false)
    }
  }

  useEffect(() => {
    fetchSuggestions()
  }, [supplierId])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchSuggestions, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const toggleSuggestion = (category: string) => {
    const newSelection = new Set(selectedSuggestions)
    if (newSelection.has(category)) {
      newSelection.delete(category)
    } else {
      newSelection.add(category)
    }
    setSelectedSuggestions(newSelection)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  const formatMethod = (method: string) => {
    return method
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const displaySuggestions = freshSuggestions.length > 0 ? freshSuggestions : suggestions

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading category suggestions...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle>Category Suggestions</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSuggestions}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={runDetection}
              disabled={isDetecting}
            >
              {isDetecting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              Detect Categories
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {displaySuggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No category suggestions available</p>
            <p className="text-sm">Run detection to get AI-powered suggestions</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              <Info className="h-4 w-4 inline mr-1" />
              AI-powered suggestions for <strong>{supplierName}</strong>
            </div>

            <div className="space-y-3">
              {displaySuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {suggestion.category}
                        </h4>
                        <Badge className={getConfidenceColor(suggestion.confidence)}>
                          {getConfidenceLabel(suggestion.confidence)} ({(suggestion.confidence * 100).toFixed(0)}%)
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatMethod(suggestion.method)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {suggestion.reasoning}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={selectedSuggestions.has(suggestion.category) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSuggestion(suggestion.category)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {selectedSuggestions.has(suggestion.category) ? 'Selected' : 'Accept'}
                        </Button>
                        {currentCategories.includes(suggestion.category) && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedSuggestions.size > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  Selected categories ({selectedSuggestions.size}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedSuggestions).map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                      <button
                        onClick={() => toggleSuggestion(category)}
                        className="ml-2 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Hook for managing category suggestions
export const useSupplierCategorySuggestions = (supplierId: string) => {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSuggestions = async (enhanced = true) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/suppliers/${supplierId}/detect-categories?enhanced=${enhanced}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.statusText}`)
      }

      const data = await response.json()
      setSuggestions(data.freshSuggestions || data.currentSuggestions || [])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const runDetection = async (enhanced = true) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/suppliers/${supplierId}/detect-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enhanced })
      })

      if (!response.ok) {
        throw new Error(`Detection failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setSuggestions(data.suggestions || [])
        return data
      } else {
        throw new Error(data.message || 'Detection failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    runDetection
  }
}