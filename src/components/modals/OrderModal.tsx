'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Modal } from '../ui/modal'
import { FormField, Input, Select, Textarea, FormActions } from '../ui/form'
import { ShoppingCart, Plus, Trash2, Package } from 'lucide-react'

interface OrderItem {
  id?: string
  itemId: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice?: number
  unit?: string
}

interface Order {
  id?: string
  orderNumber?: string
  supplierId?: string
  supplier?: string
  status?: string
  totalAmount?: number
  orderDate?: string
  expectedDate?: string
  receivedDate?: string
  itemsCount?: number
  items?: OrderItem[]
  notes?: string
  priority?: string
  department?: string
  requestedBy?: string
  approvedBy?: string
  createdBy?: {
    id: string
    name: string
    email: string
    department: string
  }
  createdAt?: string
  updatedAt?: string
}

interface Supplier {
  id: string
  name: string
}

interface InventoryItem {
  id: string
  name: string
  unitPrice: number
  unit: string
  isActive: boolean
}

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (order: Partial<Order>) => Promise<void>
  order?: Order | null
  mode?: 'add' | 'edit' | 'view'
  readOnly?: boolean
  title?: string
  initialData?: Order
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  order,
  mode = 'add',
  readOnly = false,
  title
}) => {
  const { data: session } = useSession()
  const [formData, setFormData] = useState<Partial<Order>>({
    supplierId: '',
    expectedDate: '',
    notes: '',
    priority: 'MEDIUM',
    department: '',
    items: []
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([])
  const [availableDepartments, setAvailableDepartments] = useState<Array<{id: string, name: string, code: string}>>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)

  // Fetch suppliers, items, and departments
  useEffect(() => {
    if (isOpen) {
      fetchSuppliers()
      fetchAvailableItems()
      fetchDepartments()
    }
  }, [isOpen])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (order) {
        // For existing orders, use the order's department or fall back to user's current department
        const department = order.department || session?.user?.department || ''
        setFormData({
          supplierId: order.supplierId || '',
          expectedDate: order.expectedDate || '',
          notes: order.notes || '',
          priority: order.priority || 'MEDIUM',
          department: department,
          items: order.items || []
        })
      } else {
        // Auto-populate department from current user's session
        const userDepartment = session?.user?.department || ''
        setFormData({
          supplierId: '',
          expectedDate: '',
          notes: '',
          priority: 'MEDIUM',
          department: userDepartment,
          items: []
        })
      }
      setErrors({})
    }
  }, [isOpen, order, session])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const fetchAvailableItems = async () => {
    try {
      const response = await fetch('/api/items')
      if (response.ok) {
        const data = await response.json()
        setAvailableItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true)
      const response = await fetch('/api/departments/overview')
      if (response.ok) {
        const data = await response.json()
        setAvailableDepartments(data.departments || [])
      } else {
        console.error('Failed to fetch departments:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setLoadingDepartments(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), {
        itemId: '',
        name: '',
        quantity: 1,
        unitPrice: 0,
        unit: ''
      }]
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).map((item, i) => {
        if (i === index) {
          if (field === 'itemId') {
            const selectedItem = availableItems.find(ai => ai.id === value)
            if (selectedItem) {
              return {
                ...item,
                itemId: value,
                name: selectedItem.name,
                unitPrice: selectedItem.unitPrice,
                unit: selectedItem.unit
              }
            }
          }
          return { ...item, [field]: value }
        }
        return item
      })
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.supplierId) {
      newErrors.supplierId = 'Supplier is required'
    }

    // Department is auto-populated from user session, so we don't need to validate it
    // But we can add a fallback validation in case the session doesn't have department info
    if (!formData.department && !session?.user?.department) {
      newErrors.department = 'Department could not be auto-detected. Please contact an administrator.'
    }

    if (!formData.items || formData.items.length === 0) {
      newErrors.items = 'At least one item is required'
    }

    // Check for duplicate items
    const itemIds = (formData.items || []).map(item => item.itemId).filter(id => id)
    const duplicateItemIds = itemIds.filter((id, index) => itemIds.indexOf(id) !== index)
    if (duplicateItemIds.length > 0) {
      newErrors.items = 'Duplicate items are not allowed'
    }

    formData.items?.forEach((item, index) => {
      if (!item.itemId) {
        newErrors[`item_${index}_itemId`] = 'Item is required'
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0'
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        newErrors[`item_${index}_unitPrice`] = 'Unit price must be greater than 0'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (readOnly || !onSave) return
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      // Calculate total amount
      const totalAmount = (formData.items || []).reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice)
      }, 0)

      // Ensure department is always set from user session
      const orderData = {
        ...formData,
        department: formData.department || session?.user?.department || '',
        totalAmount,
        itemsCount: formData.items?.length || 0
      }

      await onSave(orderData)
      onClose()
    } catch (error) {
      console.error('Error saving order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalAmount = (formData.items || []).reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice)
  }, 0)

  const getFilteredItems = (currentItemId?: string) => {
    const selectedItemIds = (formData.items || [])
      .filter(item => item.itemId && item.itemId !== currentItemId)
      .map(item => item.itemId)
    
    return availableItems.filter(item => 
      !selectedItemIds.includes(item.id) && item.isActive
    )
  }

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...availableDepartments.map(dept => ({
      value: dept.name,
      label: dept.name
    }))
  ]

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (mode === 'add' ? 'Add Order' : mode === 'edit' ? 'Edit Order' : 'Order Details')}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Info */}
        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {mode === 'add' ? 'New Order' : mode === 'edit' ? 'Edit Order' : 'Order Details'}
            </h3>
            <p className="text-sm text-gray-600">
              {mode === 'add' ? 'Create a new order for supplies' : 'Manage order information'}
            </p>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Supplier" required error={errors.supplierId}>
            <Select
              value={formData.supplierId || ''}
              onChange={(e) => handleInputChange('supplierId', e.target.value)}
              error={!!errors.supplierId}
              disabled={readOnly}
            >
              <option value="">Select supplier...</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Department" required error={errors.department}>
            <Input
              type="text"
              value={formData.department || 'Auto-detected from your profile'}
              error={!!errors.department}
              disabled={true}
              className="bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Department is automatically set based on your user profile</p>
          </FormField>

          <FormField label="Expected Delivery" error={errors.expectedDate}>
            <Input
              type="date"
              value={formData.expectedDate || ''}
              onChange={(e) => handleInputChange('expectedDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              error={!!errors.expectedDate}
              disabled={readOnly}
            />
          </FormField>

          <FormField label="Priority" error={errors.priority}>
            <Select
              value={formData.priority || 'MEDIUM'}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              error={!!errors.priority}
              disabled={readOnly}
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Creator Information - Only show in view mode */}
        {readOnly && order?.createdBy && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="text-lg font-medium text-gray-900">Order Creator</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created By</label>
                <p className="text-sm text-gray-900">{order.createdBy.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{order.createdBy.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <p className="text-sm text-gray-900">{order.createdBy.department}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created Date</label>
                <p className="text-sm text-gray-900">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">Order Items</h4>
            {!readOnly && (
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            )}
          </div>

          {errors.items && (
            <div className="text-sm text-red-600">{errors.items}</div>
          )}

          <div className="space-y-3">
            {(formData.items || []).map((item, index) => {
              const filteredItems = getFilteredItems(item.itemId)
              
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Item #{index + 1}</span>
                    {!readOnly && (formData.items || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <FormField label="Item" required error={errors[`item_${index}_itemId`]}>
                        <Select
                          value={item.itemId}
                          onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                          error={!!errors[`item_${index}_itemId`]}
                          disabled={readOnly}
                        >
                          <option value="">Select item...</option>
                          {filteredItems.map((availableItem, itemIndex) => (
                            <option key={`item-${availableItem.id}-${itemIndex}`} value={availableItem.id}>
                              {availableItem.name}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    </div>

                    <FormField label="Quantity" required error={errors[`item_${index}_quantity`]}>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        error={!!errors[`item_${index}_quantity`]}
                        disabled={readOnly}
                      />
                    </FormField>

                    <FormField label="Unit Price" required error={errors[`item_${index}_unitPrice`]}>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        error={!!errors[`item_${index}_unitPrice`]}
                        disabled={readOnly}
                      />
                    </FormField>
                  </div>

                  {item.unit && (
                    <div className="text-sm text-gray-600">
                      Unit: {item.unit} | Total: ${(item.quantity * item.unitPrice).toFixed(2)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <FormField label="Notes" error={errors.notes}>
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes for this order..."
            rows={3}
            error={!!errors.notes}
            disabled={readOnly}
          />
        </FormField>

        {/* Order Summary */}
        {(formData.items || []).length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Order Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span>{(formData.items || []).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Quantity:</span>
                <span>{(formData.items || []).reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between font-medium text-lg border-t pt-2">
                <span>Total Amount:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <FormActions>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          {!readOnly && onSave && (
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || (formData.items || []).length === 0}
            >
              {isLoading ? 'Saving...' : (mode === 'add' ? 'Create Order' : 'Update Order')}
            </button>
          )}
        </FormActions>
      </form>
    </Modal>
  )
}
