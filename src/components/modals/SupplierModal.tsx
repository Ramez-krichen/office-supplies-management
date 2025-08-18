'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/modal'
import { FormField, Input, Select, Textarea, FormActions } from '../ui/form'
import { Building2, Plus, Edit, Eye } from 'lucide-react'

interface Supplier {
  id: string
  name: string
  contactPerson: string
  contactTitle?: string
  email: string
  phone: string
  address: string
  website?: string
  taxId?: string
  paymentTerms?: string
  itemsCount: number
  totalOrders: number
  lastOrderDate: string
  status: 'Active' | 'Inactive'
  rating?: number
  notes?: string
  categories?: string[]
  createdAt?: string
  updatedAt?: string
}

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (supplier: Partial<Supplier>) => void
  initialData?: Supplier
  mode: 'add' | 'edit' | 'view'
  title: string
  categories?: Array<{ id: string; name: string }>
}

export function SupplierModal({ isOpen, onClose, onSave, initialData, mode, title, categories = [] }: SupplierModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    contactTitle: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    taxId: '',
    paymentTerms: '',
    categories: [] as string[],
    status: 'Active' as 'Active' | 'Inactive',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({ form: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialData && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: initialData.name || '',
        contactPerson: initialData.contactPerson || '',
        contactTitle: initialData.contactTitle || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        website: initialData.website || '',
        taxId: initialData.taxId || '',
        paymentTerms: initialData.paymentTerms || '',
        categories: initialData.categories || [],
        status: initialData.status || 'Active',
        notes: initialData.notes || ''
      })
    } else {
      setFormData({
        name: '',
        contactPerson: '',
        contactTitle: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        taxId: '',
        paymentTerms: '',
        categories: [],
        status: 'Active',
        notes: ''
      })
    }
    setErrors({})
  }, [initialData, mode, isOpen])

  const validateForm = () => {
    // Start with empty errors but keep the form field
    const newErrors: Record<string, string> = { form: '' }

    // Name validation - required
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Company name must be less than 100 characters'
    }

    // Contact person validation - required
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required'
    } else if (formData.contactPerson.trim().length > 100) {
      newErrors.contactPerson = 'Contact person name must be less than 100 characters'
    }

    // Email validation - required
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    } else if (formData.email.trim().length > 255) {
      newErrors.email = 'Email must be less than 255 characters'
    }

    // Phone validation - required
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else {
      // Remove all non-digit characters except + for international format
      const cleanedPhone = formData.phone.replace(/[\s\-\(\)]/g, '')
      if (!/^[\+]?[0-9]{6,20}$/.test(cleanedPhone)) {
        newErrors.phone = 'Please enter a valid phone number (6-20 digits)'
      }
    }

    // Address validation - required
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    } else if (formData.address.trim().length > 500) {
      newErrors.address = 'Address must be less than 500 characters'
    }

    // Website validation - optional but format check if provided
    if (formData.website && formData.website.trim() && !/^(https?:\/\/)?([\w\-])+\.{1}([a-zA-Z]{2,63})([\/\w-]*)*\/?$/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL'
    }

    // Remove the form field from errors if no actual errors exist
    const actualErrors = Object.keys(newErrors).filter(key => key !== 'form' && newErrors[key])
    if (actualErrors.length === 0) {
      delete newErrors.form
    }

    setErrors(newErrors)
    return actualErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'view' || !onSave) {
      onClose()
      return
    }
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Sanitize and prepare data
      const sanitizedData = {
        ...formData,
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        website: formData.website?.trim() || '',
        taxId: formData.taxId?.trim() || '',
        paymentTerms: formData.paymentTerms?.trim() || '',
        notes: formData.notes?.trim() || ''
      }
      
      await onSave(sanitizedData)
      onClose()
    } catch (error) {
      console.error('Error saving supplier:', error)
      
      // Display error in the form
      if (error instanceof Error) {
        // Check for specific error types
        const errorMessage = error.message
        
        if (errorMessage.includes('name already exists')) {
          setErrors(prev => ({ ...prev, name: 'A supplier with this name already exists' }))
        } else if (errorMessage.includes('Database error')) {
          // Show a general error at the form level
          setErrors(prev => ({ ...prev, form: 'Database error. Please try again later.' }))
        } else {
          // Show the error message
          setErrors(prev => ({ ...prev, form: errorMessage }))
        }
      } else {
        setErrors(prev => ({ ...prev, form: 'An unexpected error occurred' }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const categoryOptions = [
    { value: '', label: 'Select Category' },
    ...categories.map(category => ({ value: category.name, label: category.name }))
  ]

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' }
  ]

  // Render stars for rating in view mode
  const renderStars = (rating: number = 0) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${
        i < rating ? 'text-yellow-400' : 'text-gray-300'
      }`}>
        ★
      </span>
    ))
  }

  // View mode content
  if (mode === 'view') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title || 'Supplier Details'}
        size="lg"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Supplier Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formData.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formData.contactPerson}</p>
            </div>

            {formData.contactTitle && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Title</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formData.contactTitle}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formData.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formData.phone}</p>
            </div>

            {formData.website && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formData.website}</p>
              </div>
            )}

            {formData.taxId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formData.taxId}</p>
              </div>
            )}

            {formData.paymentTerms && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formData.paymentTerms}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
              <div className="flex flex-wrap gap-1">
                {formData.categories.map((category, index) => (
                  <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {category}
                  </span>
                ))}
                {formData.categories.length === 0 && (
                  <p className="text-gray-500">No categories specified</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                formData.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {formData.status}
              </span>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formData.address}</p>
            </div>

            {initialData?.rating !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(initialData.rating)}</div>
                  <span className="text-sm text-gray-600">({initialData.rating}/5)</span>
                </div>
              </div>
            )}

            {initialData?.totalOrders !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Orders</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{initialData.totalOrders}</p>
              </div>
            )}

            {initialData?.lastOrderDate && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Order</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {new Date(initialData.lastOrderDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {formData.notes && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formData.notes}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
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

  // Edit/Add mode content
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (mode === 'add' ? 'Add New Supplier' : 'Edit Supplier')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form-level error display */}
        {errors.form && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{errors.form}</span>
          </div>
        )}
        <div className="flex items-center gap-3 mb-6">
          {mode === 'add' ? (
            <Plus className="h-6 w-6 text-blue-600" />
          ) : (
            <Edit className="h-6 w-6 text-blue-600" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'add' ? 'Register New Supplier' : 'Update Supplier Information'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Company Name" required error={errors.name}>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter company name"
              error={!!errors.name}
            />
          </FormField>

          <FormField label="Contact Person" required error={errors.contactPerson}>
            <Input
              value={formData.contactPerson}
              onChange={(e) => handleInputChange('contactPerson', e.target.value)}
              placeholder="Enter contact person name"
              error={!!errors.contactPerson}
            />
          </FormField>
          
          <FormField label="Contact Title">
            <Input
              value={formData.contactTitle}
              onChange={(e) => handleInputChange('contactTitle', e.target.value)}
              placeholder="Enter contact title (optional)"
            />
          </FormField>

          <FormField label="Email Address" required error={errors.email}>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
              error={!!errors.email}
            />
          </FormField>

          <FormField label="Phone Number" required error={errors.phone}>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
              error={!!errors.phone}
            />
          </FormField>

          <FormField label="Categories" error={errors.categories}>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.categories.map((category, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {category}
                    <button 
                      type="button"
                      className="ml-1 text-blue-500 hover:text-blue-700"
                      onClick={() => {
                        const newCategories = [...formData.categories];
                        newCategories.splice(index, 1);
                        setFormData(prev => ({ ...prev, categories: newCategories }));
                        // Clear category error if categories were previously empty
                        if (errors.categories && newCategories.length > 0) {
                          setErrors(prev => ({ ...prev, categories: '' }));
                        }
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Select
                      value=""
                      onChange={(e) => {
                        if (e.target.value && !formData.categories.includes(e.target.value)) {
                          setFormData(prev => ({
                            ...prev,
                            categories: [...prev.categories, e.target.value]
                          }));
                          if (errors.categories) {
                            setErrors(prev => ({ ...prev, categories: '' }));
                          }
                        }
                      }}
                      options={categoryOptions}
                      error={!!errors.categories}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="custom-category"
                      placeholder="Or type custom category and click Add"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          if (input.value && !formData.categories.includes(input.value)) {
                            setFormData(prev => ({
                              ...prev,
                              categories: [...prev.categories, input.value]
                            }));
                            if (errors.categories) {
                              setErrors(prev => ({ ...prev, categories: '' }));
                            }
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                      onClick={() => {
                        const categoryInput = document.getElementById('custom-category') as HTMLInputElement;
                        if (categoryInput && categoryInput.value && !formData.categories.includes(categoryInput.value)) {
                          setFormData(prev => ({
                            ...prev,
                            categories: [...prev.categories, categoryInput.value]
                          }));
                          if (errors.categories) {
                            setErrors(prev => ({ ...prev, categories: '' }));
                          }
                          categoryInput.value = '';
                        }
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              {errors.categories && <p className="text-sm text-red-500 mt-1">{errors.categories}</p>}
            </div>
          </FormField>

          <FormField label="Status">
            <Select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              options={statusOptions}
            />
          </FormField>

          <FormField label="Website">
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="Enter website URL (optional)"
            />
          </FormField>

          <FormField label="Tax ID">
            <Input
              value={formData.taxId}
              onChange={(e) => handleInputChange('taxId', e.target.value)}
              placeholder="Enter tax ID (optional)"
            />
          </FormField>

          <FormField label="Payment Terms">
            <Input
              value={formData.paymentTerms}
              onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
              placeholder="Enter payment terms (optional)"
            />
          </FormField>

          <FormField label="Address" required error={errors.address} className="md:col-span-2">
            <Textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter complete address"
              rows={3}
              error={!!errors.address}
            />
          </FormField>

          <FormField label="Notes" className="md:col-span-2">
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter additional notes (optional)"
              rows={3}
            />
          </FormField>
        </div>

        <FormActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText={mode === 'add' ? 'Add Supplier' : 'Update Supplier'}
          isSubmitting={isSubmitting}
          submitIcon={mode === 'add' ? <Plus className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
        />
      </form>
    </Modal>
  )
}

// We don't need a separate ViewSupplierModal component anymore since we've integrated view mode into the main SupplierModal component