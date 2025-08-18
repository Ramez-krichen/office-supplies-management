'use client'

import React from 'react'
import { Loader2, Package, Users, ShoppingCart, BarChart3 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  )
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className = '', lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-200 rounded h-4 ${i > 0 ? 'mt-2' : ''} ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  )
}

interface TableLoadingProps {
  rows?: number
  columns?: number
}

export function TableLoading({ rows = 5, columns = 4 }: TableLoadingProps) {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-50 rounded-lg p-4">
        {/* Header */}
        <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-300 rounded" />
          ))}
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4 mb-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface PageLoadingProps {
  title?: string
  subtitle?: string
  type?: 'inventory' | 'users' | 'orders' | 'reports' | 'default'
}

export function PageLoading({ title = 'Loading...', subtitle, type = 'default' }: PageLoadingProps) {
  const getIcon = () => {
    switch (type) {
      case 'inventory':
        return <Package className="h-8 w-8 text-blue-500" />
      case 'users':
        return <Users className="h-8 w-8 text-green-500" />
      case 'orders':
        return <ShoppingCart className="h-8 w-8 text-purple-500" />
      case 'reports':
        return <BarChart3 className="h-8 w-8 text-orange-500" />
      default:
        return <LoadingSpinner size="lg" className="text-blue-500" />
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          {getIcon()}
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>
        <div className="flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

interface CardLoadingProps {
  className?: string
}

export function CardLoading({ className = '' }: CardLoadingProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    </div>
  )
}

interface ButtonLoadingProps {
  children: React.ReactNode
  loading?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit'
}

export function ButtonLoading({ 
  children, 
  loading = false, 
  disabled = false, 
  className = '', 
  onClick,
  type = 'button'
}: ButtonLoadingProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`
        relative inline-flex items-center justify-center px-4 py-2 
        border border-transparent text-sm font-medium rounded-lg
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${loading ? 'cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && (
        <LoadingSpinner size="sm" className="mr-2" />
      )}
      <span className={loading ? 'opacity-75' : ''}>{children}</span>
    </button>
  )
}

// Loading states for specific components
export const LoadingStates = {
  // Dashboard stats loading
  DashboardStats: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded" />
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  ),

  // Form loading
  Form: ({ fields = 3 }: { fields?: number }) => (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      ))}
      <div className="flex justify-end space-x-3 pt-4">
        <div className="h-10 bg-gray-200 rounded w-20" />
        <div className="h-10 bg-gray-200 rounded w-16" />
      </div>
    </div>
  ),

  // List loading
  List: ({ items = 5 }: { items?: number }) => (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="w-20 h-8 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}
