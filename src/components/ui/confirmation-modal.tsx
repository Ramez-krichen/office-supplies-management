'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { AlertTriangle, Trash2, UserX, Package, Building2 } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'delete' | 'deactivate' | 'warning'
  entityType?: 'user' | 'item' | 'supplier' | 'request' | 'order'
  entityName?: string
  loading?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  entityType,
  entityName,
  loading = false
}: ConfirmationModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 className="h-6 w-6 text-red-600" />
      case 'deactivate':
        return <UserX className="h-6 w-6 text-orange-600" />
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />
    }
  }

  const getEntityIcon = () => {
    switch (entityType) {
      case 'user':
        return <UserX className="h-4 w-4" />
      case 'item':
        return <Package className="h-4 w-4" />
      case 'supplier':
        return <Building2 className="h-4 w-4" />
      default:
        return null
    }
  }

  const getButtonColor = () => {
    switch (type) {
      case 'delete':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      case 'deactivate':
        return 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
      default:
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'delete':
        return 'bg-red-100'
      case 'deactivate':
        return 'bg-orange-100'
      default:
        return 'bg-yellow-100'
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${getBackgroundColor()} sm:mx-0 sm:h-10 sm:w-10`}>
                    {getIcon()}
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {message}
                      </p>
                      {entityName && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center text-sm">
                            {getEntityIcon()}
                            <span className="ml-2 font-medium text-gray-900">
                              {entityType?.charAt(0).toUpperCase() + entityType?.slice(1)}: {entityName}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${getButtonColor()} disabled:opacity-50 disabled:cursor-not-allowed`}
                    onClick={onConfirm}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      confirmText
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                    disabled={loading}
                  >
                    {cancelText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}