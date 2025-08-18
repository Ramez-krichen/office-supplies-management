'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'

interface Column {
  key: string
  label: string
  sortable?: boolean
  className?: string
  render?: (value: any, row: any) => React.ReactNode
  mobileHidden?: boolean
}

interface Action {
  label: string
  icon?: React.ReactNode
  onClick: (row: any) => void
  variant?: 'default' | 'danger' | 'warning'
  hidden?: (row: any) => boolean
}

interface ResponsiveTableProps {
  columns: Column[]
  data: any[]
  actions?: Action[]
  loading?: boolean
  emptyMessage?: string
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  className?: string
  mobileCardView?: boolean
}

export function ResponsiveTable({
  columns,
  data,
  actions = [],
  loading = false,
  emptyMessage = 'No data available',
  onSort,
  sortKey,
  sortDirection,
  className = '',
  mobileCardView = true
}: ResponsiveTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const handleSort = (key: string) => {
    if (!onSort) return
    
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(key, newDirection)
  }

  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId)
    } else {
      newExpanded.add(rowId)
    }
    setExpandedRows(newExpanded)
  }

  const getActionVariantClasses = (variant: string = 'default') => {
    switch (variant) {
      case 'danger':
        return 'text-red-600 hover:text-red-800 hover:bg-red-50'
      case 'warning':
        return 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
      default:
        return 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="flex space-x-4">
              {columns.map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
              ))}
            </div>
          </div>
          {/* Rows skeleton */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-gray-200">
              <div className="flex space-x-4">
                {columns.map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded flex-1" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="text-center py-12">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${column.className || ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={`h-3 w-3 ${
                            sortKey === column.key && sortDirection === 'asc'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                        />
                        <ChevronDown
                          className={`h-3 w-3 -mt-1 ${
                            sortKey === column.key && sortDirection === 'desc'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={row.id || index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {actions
                        .filter(action => !action.hidden || !action.hidden(row))
                        .map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => action.onClick(row)}
                            className={`p-1 rounded-md transition-colors ${getActionVariantClasses(action.variant)}`}
                            title={action.label}
                          >
                            {action.icon || <MoreVertical className="h-4 w-4" />}
                          </button>
                        ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      {mobileCardView && (
        <div className="md:hidden">
          {data.map((row, index) => {
            const rowId = row.id || index.toString()
            const isExpanded = expandedRows.has(rowId)
            const visibleColumns = columns.filter(col => !col.mobileHidden)
            const hiddenColumns = columns.filter(col => col.mobileHidden)

            return (
              <div key={rowId} className="border-b border-gray-200 last:border-b-0">
                <div className="p-4">
                  {/* Main visible content */}
                  <div className="space-y-2">
                    {visibleColumns.slice(0, 2).map((column) => (
                      <div key={column.key} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-500">{column.label}:</span>
                        <span className="text-sm text-gray-900 text-right ml-2">
                          {column.render ? column.render(row[column.key], row) : row[column.key]}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Expandable content */}
                  {(hiddenColumns.length > 0 || visibleColumns.length > 2) && (
                    <>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          {[...visibleColumns.slice(2), ...hiddenColumns].map((column) => (
                            <div key={column.key} className="flex justify-between items-start">
                              <span className="text-sm font-medium text-gray-500">{column.label}:</span>
                              <span className="text-sm text-gray-900 text-right ml-2">
                                {column.render ? column.render(row[column.key], row) : row[column.key]}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <button
                        onClick={() => toggleRowExpansion(rowId)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Show More
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {/* Actions */}
                  {actions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                      {actions
                        .filter(action => !action.hidden || !action.hidden(row))
                        .map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => action.onClick(row)}
                            className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${getActionVariantClasses(action.variant)}`}
                          >
                            {action.icon && <span className="mr-1">{action.icon}</span>}
                            {action.label}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Common action presets
export const tableActions = {
  view: (onClick: (row: any) => void): Action => ({
    label: 'View',
    icon: <Eye className="h-4 w-4" />,
    onClick,
    variant: 'default'
  }),
  
  edit: (onClick: (row: any) => void): Action => ({
    label: 'Edit',
    icon: <Edit className="h-4 w-4" />,
    onClick,
    variant: 'default'
  }),
  
  delete: (onClick: (row: any) => void): Action => ({
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick,
    variant: 'danger'
  })
}
