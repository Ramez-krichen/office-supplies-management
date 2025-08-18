'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message })
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 7000 })
  }, [addToast])

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message })
  }, [addToast])

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message })
  }, [addToast])

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info
    }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getTitleColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
    }
  }

  const getMessageColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-700'
      case 'error':
        return 'text-red-700'
      case 'warning':
        return 'text-yellow-700'
      case 'info':
        return 'text-blue-700'
    }
  }

  return (
    <div className={`
      relative p-4 rounded-lg border shadow-lg transform transition-all duration-300 ease-in-out
      animate-in slide-in-from-right-full
      ${getBackgroundColor()}
    `}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${getTitleColor()}`}>
            {toast.title}
          </h3>
          {toast.message && (
            <p className={`mt-1 text-sm ${getMessageColor()}`}>
              {toast.message}
            </p>
          )}
          {toast.action && (
            <div className="mt-3">
              <button
                onClick={toast.action.onClick}
                className={`
                  text-sm font-medium underline hover:no-underline
                  ${getTitleColor()}
                `}
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => onRemove(toast.id)}
            className={`
              inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
              hover:bg-white/50 transition-colors
              ${toast.type === 'success' ? 'text-green-500 focus:ring-green-600' : ''}
              ${toast.type === 'error' ? 'text-red-500 focus:ring-red-600' : ''}
              ${toast.type === 'warning' ? 'text-yellow-500 focus:ring-yellow-600' : ''}
              ${toast.type === 'info' ? 'text-blue-500 focus:ring-blue-600' : ''}
            `}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Utility functions for common toast patterns
export const toastUtils = {
  // API operation toasts
  apiSuccess: (operation: string, entity?: string) => {
    const title = entity ? `${entity} ${operation} successfully` : `${operation} successful`
    return { type: 'success' as const, title }
  },

  apiError: (operation: string, entity?: string, error?: string) => {
    const title = entity ? `Failed to ${operation} ${entity}` : `${operation} failed`
    const message = error || 'Please try again or contact support if the problem persists.'
    return { type: 'error' as const, title, message }
  },

  // Form validation toasts
  validationError: (message: string = 'Please check the form for errors') => ({
    type: 'error' as const,
    title: 'Validation Error',
    message
  }),

  // Loading state toasts
  loading: (operation: string) => ({
    type: 'info' as const,
    title: `${operation}...`,
    duration: 0 // Don't auto-dismiss
  }),

  // Permission toasts
  unauthorized: () => ({
    type: 'error' as const,
    title: 'Access Denied',
    message: 'You do not have permission to perform this action.'
  }),

  // Network toasts
  networkError: () => ({
    type: 'error' as const,
    title: 'Network Error',
    message: 'Please check your internet connection and try again.'
  }),

  // Data sync toasts
  syncSuccess: () => ({
    type: 'success' as const,
    title: 'Data synchronized',
    message: 'All changes have been saved successfully.'
  }),

  // Bulk operation toasts
  bulkSuccess: (count: number, operation: string) => ({
    type: 'success' as const,
    title: `${count} items ${operation}`,
    message: 'The operation completed successfully.'
  }),

  bulkPartialSuccess: (success: number, failed: number, operation: string) => ({
    type: 'warning' as const,
    title: `${operation} partially completed`,
    message: `${success} items succeeded, ${failed} items failed.`
  })
}
