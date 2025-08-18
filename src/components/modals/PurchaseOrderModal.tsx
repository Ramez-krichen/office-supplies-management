'use client'

import { useState, useEffect } from 'react'
import { Modal } from '../ui/modal'
import { FormField, Input, Select, Textarea, FormActions } from '../ui/form'
import { ShoppingCart, Plus, Trash2, Package } from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  category: string
  sku: string
  description: string
  quantity: number
  unit: string
  minStock: number
  maxStock: number
  unitPrice: number
  supplier: string
  location: string
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'discontinued'
  lastUpdated: string
  expiryDate?: string
  isActive: boolean
  isEcoFriendly: boolean
  ecoRating?: number
  carbonFootprint?: number
  recyclable: boolean
}

interface Supplier {
  id: string
  name: string
}

interface OrderItem {
  itemId: string
  itemName: string
  quantity: number
  unitPrice: number
  unit: string
}

interface PurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (orderData: any) => Promise<void>
  suppliers: Supplier[]
  preselectedItem?: InventoryItem
  mode: 'create'
}

export function PurchaseOrderModal({
  isOpen,
  onClose,
  onSave,
  suppliers,
  preselectedItem,
  mode
}: PurchaseOrderModalProps) {
  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDelivery: '',
    notes: '',
    items: [] as OrderItem[]
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (preselectedItem) {
        // Find supplier for preselected item
        const supplierForItem = suppliers.find(s => s.name === preselectedItem.supplier)
        
        setFormData({
          supplierId: supplierForItem?.id || '',
          expectedDelivery: '',
          notes: `Reorder for low stock item: ${preselectedItem.name}`,
          items: [{
            itemId: preselectedItem.id,
            itemName: preselectedItem.name,
            quantity: Math.max(preselectedItem.maxStock - preselectedItem.quantity, 1),
            unitPrice: preselectedItem.unitPrice,
            unit: preselectedItem.unit
          }]
        })
      } else {
        setFormData({
          supplierId: '',
          expectedDelivery: '',
          notes: '',
          items: []
        })
      }
      setErrors({})
      fetchAvailableItems()
    }
  }, [isOpen, preselectedItem, suppliers])

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        itemId: '',
        itemName: '',
        quantity: 1,
        unitPrice: 0,
        unit: ''
      }]
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          if (field === 'itemId') {
            const selectedItem = availableItems.find(ai => ai.id === value)
            if (selectedItem) {
              return {
                ...item,
                itemId: value,
                itemName: selectedItem.name,
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

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required'
    }

    formData.items.forEach((item, index) => {
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
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving purchase order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalAmount = formData.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice)
  }, 0)

  const getFilteredItems = (currentItemId?: string) => {
    const selectedItemIds = formData.items
      .filter(item => item.itemId && item.itemId !== currentItemId)
      .map(item => item.itemId)
    
    return availableItems.filter(item => 
      !selectedItemIds.includes(item.id) && item.isActive
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order"
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
              {preselectedItem ? `Reorder: ${preselectedItem.name}` : 'New Purchase Order'}
            </h3>
            <p className="text-sm text-gray-600">
              {preselectedItem 
                ? `Current stock: ${preselectedItem.quantity} ${preselectedItem.unit} (Min: ${preselectedItem.minStock})`
                : 'Create a new purchase order for inventory restocking'
              }
            </p>
          </div>
        </div>

        {/* Supplier and Delivery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Supplier" required error={errors.supplierId}>
            <Select
              value={formData.supplierId}
              onChange={(e) => handleInputChange('supplierId', e.target.value)}
              error={!!errors.supplierId}
            >
              <option value="">Select supplier...</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Expected Delivery" error={errors.expectedDelivery}>
            <Input
              type="date"
              value={formData.expectedDelivery}
              onChange={(e) => handleInputChange('expectedDelivery', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              error={!!errors.expectedDelivery}
            />
          </FormField>
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">Order Items</h4>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          {errors.items && (
            <div className="text-sm text-red-600">{errors.items}</div>
          )}

          <div className="space-y-3">
            {formData.items.map((item, index) => {
              const filteredItems = getFilteredItems(item.itemId)
              
              return (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Item #{index + 1}</span>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
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
                        >
                          <option value="">Select item...</option>
                          {filteredItems.map((availableItem, itemIndex) => (
                            <option key={`item-${availableItem.id}-${itemIndex}`} value={availableItem.id}>
                              {availableItem.name} ({availableItem.sku}) - {availableItem.quantity} {availableItem.unit} available
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
                        placeholder="0"
                        error={!!errors[`item_${index}_quantity`]}
                      />
                    </FormField>

                    <FormField label="Unit Price" required error={errors[`item_${index}_unitPrice`]}>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        error={!!errors[`item_${index}_unitPrice`]}
                      />
                    </FormField>
                  </div>

                  {item.itemId && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <div className="flex justify-between">
                        <span>Unit: {item.unit}</span>
                        <span className="font-medium">
                          Total: ${(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
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
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes for this purchase order..."
            rows={3}
            error={!!errors.notes}
          />
        </FormField>

        {/* Order Summary */}
        {formData.items.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Order Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span>{formData.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Quantity:</span>
                <span>{formData.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
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
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || formData.items.length === 0}
          >
            {isLoading ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </FormActions>
      </form>
    </Modal>
  )
}