'use client'

import { ReactNode, useEffect, useCallback, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  className?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Memoize the escape handler to prevent unnecessary re-renders
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) {
      onClose()
    }
  }, [onClose, closeOnEscape])

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose()
    }
  }, [onClose, closeOnBackdropClick])

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement

      // Add event listeners
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'

      // Focus the modal for accessibility
      if (modalRef.current) {
        modalRef.current.focus()
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'

      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md mx-4 sm:mx-auto',
    md: 'max-w-lg mx-4 sm:mx-auto',
    lg: 'max-w-2xl mx-4 sm:mx-auto',
    xl: 'max-w-4xl mx-4 sm:mx-auto'
  } as const

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy || 'modal-title'}
      aria-describedby={ariaDescribedBy}
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all max-h-[90vh] flex flex-col ${className}`}
          tabIndex={-1}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            <h3
              id={ariaLabelledBy || 'modal-title'}
              className="text-lg font-semibold text-gray-900 truncate pr-4"
            >
              {title}
            </h3>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// Confirmation Modal Component
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  loading?: boolean
  disabled?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  loading = false,
  disabled = false
}: ConfirmModalProps) {
  const typeStyles = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
  } as const

  const handleConfirm = async () => {
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      // Let the parent component handle the error
      console.error('Confirmation action failed:', error)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdropClick={!loading}
      closeOnEscape={!loading}
      aria-describedby="confirm-modal-description"
    >
      <div className="space-y-4">
        <p id="confirm-modal-description" className="text-gray-600">
          {message}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || disabled}
            className={`px-4 py-2 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${typeStyles[type]}`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}