'use client'

import { useState, useEffect } from 'react'
import { Modal } from '../ui/modal'
import { FormField, Input, Select, Textarea, FormActions } from '../ui/form'
import { Package, Plus, Edit, Eye } from 'lucide-react'
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
  isEcoFriendly: boolean
  ecoRating?: number
  carbonFootprint?: number
  recyclable: boolean
}

interface InventoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: Omit<InventoryItem, 'id' | 'lastUpdated' | 'status'>) => void
  item?: InventoryItem | null
  mode: 'add' | 'edit'
  suppliers?: Array<{ id: string; name: string }>
  categories?: Array<{ id: string; name: string }>
}

export function InventoryModal({ isOpen, onClose, onSave, item, mode, suppliers = [], categories = [] }: InventoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    description: '',
    quantity: 0,
    unit: '',
    minStock: 0,
    maxStock: 0,
    unitPrice: 0,
    supplier: '',
    location: '',
    expiryDate: '',
    isEcoFriendly: false,
    ecoRating: 0,
    carbonFootprint: 0,
    recyclable: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (item && mode === 'edit') {
      setFormData({
        name: item.name,
        category: item.category,
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        minStock: item.minStock,
        maxStock: item.maxStock,
        unitPrice: item.unitPrice,
        supplier: item.supplier,
        location: item.location,
        expiryDate: item.expiryDate || '',
        isEcoFriendly: item.isEcoFriendly || false,
        ecoRating: item.ecoRating || 0,
        carbonFootprint: item.carbonFootprint || 0,
        recyclable: item.recyclable || false
      })
    } else {
      setFormData({
        name: '',
        category: '',
        sku: '',
        description: '',
        quantity: 0,
        unit: '',
        minStock: 0,
        maxStock: 0,
        unitPrice: 0,
        supplier: '',
        location: '',
        expiryDate: '',
        isEcoFriendly: false,
        ecoRating: 0,
        carbonFootprint: 0,
        recyclable: false
      })
    }
    setErrors({})
  }, [item, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required'
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required'
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative'
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required'
    }

    if (formData.minStock < 0) {
      newErrors.minStock = 'Minimum stock cannot be negative'
    }

    if (formData.maxStock < 0) {
      newErrors.maxStock = 'Maximum stock cannot be negative'
    }

    if (formData.maxStock > 0 && formData.minStock >= formData.maxStock) {
      newErrors.maxStock = 'Maximum stock must be greater than minimum stock'
    }

    if (formData.unitPrice < 0) {
      newErrors.unitPrice = 'Unit price cannot be negative'
    }

    if (!formData.supplier.trim()) {
      newErrors.supplier = 'Supplier is required'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    if (formData.expiryDate) {
      const expiryDate = new Date(formData.expiryDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (expiryDate < today) {
        newErrors.expiryDate = 'Expiry date cannot be in the past'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving inventory item:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const generateSKU = () => {
    const prefix = formData.category.substring(0, 3).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    const sku = `${prefix}${timestamp}`
    handleInputChange('sku', sku)
  }

  const categoryOptions = [
    { value: '', label: 'Select Category' },
    ...categories.map(category => ({ value: category.name, label: category.name }))
  ]

  const unitOptions = [
    { value: '', label: 'Select Unit' },
    { value: 'pieces', label: 'Pieces' },
    { value: 'boxes', label: 'Boxes' },
    { value: 'packs', label: 'Packs' },
    { value: 'sets', label: 'Sets' },
    { value: 'units', label: 'Units' },
    { value: 'kg', label: 'Kilograms' },
    { value: 'liters', label: 'Liters' },
    { value: 'meters', label: 'Meters' },
    { value: 'rolls', label: 'Rolls' }
  ]

  const supplierOptions = [
    { value: '', label: 'Select Supplier' },
    ...suppliers.map(supplier => ({ value: supplier.name, label: supplier.name }))
  ]

  const locationOptions = [
    { value: '', label: 'Select Location' },
    { value: 'Warehouse A', label: 'Warehouse A' },
    { value: 'Warehouse B', label: 'Warehouse B' },
    { value: 'Storage Room 1', label: 'Storage Room 1' },
    { value: 'Storage Room 2', label: 'Storage Room 2' },
    { value: 'Office Storage', label: 'Office Storage' },
    { value: 'IT Storage', label: 'IT Storage' },
    { value: 'Maintenance Room', label: 'Maintenance Room' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? 'Add New Item' : 'Edit Item'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          {mode === 'add' ? (
            <Plus className="h-6 w-6 text-blue-600" />
          ) : (
            <Edit className="h-6 w-6 text-blue-600" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'add' ? 'Add New Inventory Item' : 'Update Item Information'}
          </h3>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Item Name" required error={errors.name || undefined}>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter item name"
              error={!!errors.name}
            />
          </FormField>

          <FormField label="Category" required error={errors.category}>
            <Select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              options={categoryOptions}
              error={!!errors.category}
            />
          </FormField>

          <FormField label="SKU" required error={errors.sku}>
            <div className="flex gap-2">
              <Input
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Enter SKU"
                error={!!errors.sku}
                className="flex-1"
              />
              <button
                type="button"
                onClick={generateSKU}
                className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                disabled={!formData.category}
              >
                Generate
              </button>
            </div>
          </FormField>

          <FormField label="Unit" required error={errors.unit}>
            <Select
              value={formData.unit}
              onChange={(e) => handleInputChange('unit', e.target.value)}
              options={unitOptions}
              error={!!errors.unit}
            />
          </FormField>

          <FormField label="Description" required error={errors.description} className="md:col-span-2">
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter item description"
              rows={2}
              error={!!errors.description}
            />
          </FormField>
        </div>

        {/* Stock Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Current Quantity" required error={errors.quantity}>
            <Input
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
              placeholder="0"
              error={!!errors.quantity}
            />
          </FormField>

          <FormField label="Minimum Stock" required error={errors.minStock}>
            <Input
              type="number"
              min="0"
              value={formData.minStock}
              onChange={(e) => handleInputChange('minStock', parseInt(e.target.value) || 0)}
              placeholder="0"
              error={!!errors.minStock}
            />
          </FormField>

          <FormField label="Maximum Stock" required error={errors.maxStock}>
            <Input
              type="number"
              min="0"
              value={formData.maxStock}
              onChange={(e) => handleInputChange('maxStock', parseInt(e.target.value) || 0)}
              placeholder="0"
              error={!!errors.maxStock}
            />
          </FormField>
        </div>

        {/* Pricing and Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Unit Price" required error={errors.unitPrice}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.unitPrice}
              onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              error={!!errors.unitPrice}
            />
          </FormField>

          <FormField label="Supplier" required error={errors.supplier}>
            <Select
              value={formData.supplier}
              onChange={(e) => handleInputChange('supplier', e.target.value)}
              options={supplierOptions}
              error={!!errors.supplier}
            />
          </FormField>

          <FormField label="Storage Location" required error={errors.location}>
            <Select
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              options={locationOptions}
              error={!!errors.location}
            />
          </FormField>

          <FormField label="Expiry Date (Optional)" error={errors.expiryDate}>
            <Input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => handleInputChange('expiryDate', e.target.value)}
              error={!!errors.expiryDate}
            />
          </FormField>
        </div>

        {/* Eco-Design Features */}
        <div className="border-t pt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-green-600">🌱</span>
            Eco-Design Features
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isEcoFriendly"
                checked={formData.isEcoFriendly}
                onChange={(e) => handleInputChange('isEcoFriendly', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="isEcoFriendly" className="text-sm font-medium text-gray-700">
                Eco-Friendly Product
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="recyclable"
                checked={formData.recyclable}
                onChange={(e) => handleInputChange('recyclable', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="recyclable" className="text-sm font-medium text-gray-700">
                Recyclable
              </label>
            </div>

            <FormField label="Eco Rating (1-5)" error={errors.ecoRating}>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.ecoRating}
                onChange={(e) => handleInputChange('ecoRating', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                error={!!errors.ecoRating}
                disabled={!formData.isEcoFriendly}
              />
            </FormField>

            <FormField label="Carbon Footprint (kg CO2)" error={errors.carbonFootprint}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.carbonFootprint}
                onChange={(e) => handleInputChange('carbonFootprint', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                error={!!errors.carbonFootprint}
                disabled={!formData.isEcoFriendly}
              />
            </FormField>
          </div>
        </div>

        <FormActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText={mode === 'add' ? 'Add Item' : 'Update Item'}
          isSubmitting={isSubmitting}
          submitIcon={mode === 'add' ? <Plus className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
        />
      </form>
    </Modal>
  )
}

// View Inventory Item Modal
interface ViewInventoryModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem | null
}

export function ViewInventoryModal({ isOpen, onClose, item }: ViewInventoryModalProps) {
  if (!item) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800'
      case 'low-stock': return 'bg-yellow-100 text-yellow-800'
      case 'out-of-stock': return 'bg-red-100 text-red-800'
      case 'discontinued': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockLevel = () => {
    if (item.quantity === 0) return 'Out of Stock'
    if (item.quantity <= item.minStock) return 'Low Stock'
    if (item.quantity >= item.maxStock) return 'Overstocked'
    return 'In Stock'
  }

  const getStockLevelColor = () => {
    if (item.quantity === 0) return 'text-red-600'
    if (item.quantity <= item.minStock) return 'text-yellow-600'
    if (item.quantity >= item.maxStock) return 'text-blue-600'
    return 'text-green-600'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Item Details"
      size="xl"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Package className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Inventory Item Information</h3>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{item.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{item.category}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-mono">{item.sku}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{item.unit}</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{item.description}</p>
          </div>
        </div>

        {/* Stock Information */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Stock Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
              <p className="text-2xl font-bold text-gray-900">{item.quantity}</p>
              <p className={`text-sm font-medium ${getStockLevelColor()}`}>{getStockLevel()}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
              <p className="text-lg font-semibold text-gray-900">{item.minStock}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Stock</label>
              <p className="text-lg font-semibold text-gray-900">{item.maxStock}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                {item.status.replace('-', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing and Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-semibold">${item.unitPrice.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Value</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-semibold">
              ${(item.quantity * item.unitPrice).toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{item.supplier}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{item.location}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              {new Date(item.lastUpdated).toLocaleString()}
            </p>
          </div>

          {item.expiryDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <p className={`bg-gray-50 px-3 py-2 rounded-md ${
                new Date(item.expiryDate) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-900'
              }`}>
                {new Date(item.expiryDate).toLocaleDateString()}
                {new Date(item.expiryDate) < new Date() && ' (Expired)'}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}