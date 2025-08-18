'use client'

import { useState, useEffect } from 'react'
import { Modal } from '../ui/modal'
import { FormField, Input, Select, Textarea, FormActions } from '../ui/form'
import { FileText, Plus, Edit, Eye, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

interface RequestItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  unit?: string
  urgency?: 'low' | 'medium' | 'high'
  description?: string
  category?: string
  itemId?: string
  notes?: string
}

interface Request {
  id: string
  title: string
  description?: string
  department: string
  requester: string
  requesterId?: string
  createdAt: string
  updatedAt: string
  expectedDelivery?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  items: RequestItem[]
  totalAmount: number
  notes?: string
  approvedBy?: string
  approvedAt?: string
  rejectedReason?: string
}

interface RequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (request: any) => void
  request?: Request | null
  mode: 'add' | 'edit' | 'view'
  readOnly?: boolean
}

export function RequestModal({ isOpen, onClose, onSave, request, mode, readOnly = false }: RequestModalProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    expectedDelivery: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    notes: '',
    items: [] as Array<{
      name: string
      quantity: number
      unitPrice: number
      totalPrice: number
      itemId?: string
      notes?: string
    }>
  })

  // States for approve/reject functionality
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionInput, setShowRejectionInput] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableItems, setAvailableItems] = useState<Array<{id: string, name: string, category: string}>>([])
  const [availableDepartments, setAvailableDepartments] = useState<Array<{id: string, name: string, code: string}>>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)

  // Fetch available items and departments for selection
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/items')
        if (response.ok) {
          const data = await response.json()
          setAvailableItems(data.items || [])
        } else {
          console.error('Failed to fetch items:', response.status, response.statusText)
          toast.error('Failed to load available items')
        }
      } catch (error) {
        console.error('Error fetching items:', error)
        toast.error('Unable to connect to server. Please check your connection.')
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

    if (isOpen) {
      fetchItems()
      fetchDepartments()
    }
  }, [isOpen])

  useEffect(() => {
    if (request && (mode === 'edit' || mode === 'view')) {
      setFormData({
        title: request.title,
        department: request.department,
        description: request.description || '',
        expectedDelivery: request.expectedDelivery || '',
        priority: request.priority,
        notes: request.notes || '',
        items: request.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || 0,
          itemId: item.itemId || item.id, // Handle both itemId and id fields
          notes: item.notes || item.description || ''
        }))
      })
    } else {
      setFormData({
        title: '',
        department: '',
        description: '',
        expectedDelivery: '',
        priority: 'MEDIUM',
        notes: '',
        items: []
      })
    }
    setErrors({})
  }, [request, mode, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Request title is required'
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required'
    }

    if (formData.expectedDelivery) {
      const expectedDate = new Date(formData.expectedDelivery)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (expectedDate < today) {
        newErrors.expectedDelivery = 'Expected delivery date cannot be in the past'
      }
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required'
    }

    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.itemId || item.itemId.trim() === '') {
        newErrors[`item_${index}_itemId`] = 'Item selection is required'
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Valid quantity is required'
      }
      if (item.unitPrice === undefined || item.unitPrice === null || item.unitPrice < 0) {
        newErrors[`item_${index}_unitPrice`] = 'Valid unit price is required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (readOnly) return; // Prevent submission in read-only mode

    // Check session
    if (!session?.user?.id) {
      toast.error('You must be logged in to perform this action')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Calculate total amount
      const totalAmount = formData.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice),
        0
      )

      // Ensure all items have valid itemId
      const validatedItems = formData.items.map(item => {
        if (!item.itemId || item.itemId.trim() === '') {
          throw new Error(`Item "${item.name}" is missing a valid item ID`)
        }
        return {
          itemId: item.itemId.trim(),
          quantity: parseInt(item.quantity.toString()),
          unitPrice: parseFloat(item.unitPrice.toString()),
          totalPrice: parseInt(item.quantity.toString()) * parseFloat(item.unitPrice.toString()),
          notes: item.notes || null
        }
      })

      const requestData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        department: formData.department.trim(),
        priority: formData.priority,
        totalAmount,
        items: validatedItems
      }

      console.log('Submitting request data:', requestData) // Debug log
      console.log('Session user:', session.user) // Debug log

      // If in edit mode, use the API directly
      if (mode === 'edit' && request?.id) {
        console.log('Making PUT request to:', `/api/requests/${request.id}`)

        const response = await fetch(`/api/requests/${request.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          credentials: 'include', // Ensure cookies are sent
        })

        console.log('PUT response status:', response.status)

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Edit request error:', errorData) // Debug log
          throw new Error(errorData.error || `Failed to update request (${response.status})`)
        }

        const result = await response.json()
        console.log('PUT response data:', result)

        toast.success('Request updated successfully')
      } else if (mode === 'add') {
        console.log('Making POST request to: /api/requests')

        const response = await fetch('/api/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          credentials: 'include', // Ensure cookies are sent
        })

        console.log('POST response status:', response.status)

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Create request error:', errorData) // Debug log
          throw new Error(errorData.error || `Failed to create request (${response.status})`)
        }

        const result = await response.json()
        console.log('POST response data:', result)

        toast.success('Request created successfully')
      }

      await onSave(requestData)
      onClose()
    } catch (error) {
      console.error('Error saving request:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Approve/Reject handlers for view mode
  const handleApprove = async () => {
    if (!request || isApproving) return

    setIsApproving(true)
    try {
      const response = await fetch(`/api/requests/${request.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          status: 'APPROVED',
          comments: 'Approved via request view modal'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve request')
      }

      toast.success('Request approved successfully')
      onSave(request) // Trigger refresh
      onClose()
    } catch (error) {
      console.error('Error approving request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to approve request')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!request) return

    if (!showRejectionInput) {
      setShowRejectionInput(true)
      return
    }

    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setIsApproving(true)
    try {
      const response = await fetch(`/api/requests/${request.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // Ensure cookies are sent
        body: JSON.stringify({
          status: 'REJECTED',
          comments: rejectionReason.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Handle specific error cases
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.')
          window.location.href = '/auth/signin'
          return
        } else if (response.status === 403) {
          toast.error('You do not have permission to perform this action.')
          return
        }

        throw new Error(errorData.error || 'Failed to reject request')
      }

      const data = await response.json()
      toast.success(data.message || 'Request rejected successfully')
      onSave(request) // Trigger refresh
      onClose()
    } catch (error) {
      console.error('Error rejecting request:', error)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Network error. Please check your connection and try again.')
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to reject request')
      }
    } finally {
      setIsApproving(false)
      setShowRejectionInput(false)
      setRejectionReason('')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, unitPrice: 0, totalPrice: 0, itemId: '', notes: '' }]
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
    // Clear related errors
    const newErrors = { ...errors }
    delete newErrors[`item_${index}_name`]
    delete newErrors[`item_${index}_quantity`]
    delete newErrors[`item_${index}_unit`]
    setErrors(newErrors)
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      const updatedItem = { ...updatedItems[index], [field]: value };
      
      // If updating itemId, also update the name and fetch price from database
      if (field === 'itemId' && typeof value === 'string' && value) {
        const selectedItem = availableItems.find(item => item.id === value);
        if (selectedItem) {
          updatedItem.name = selectedItem.name;
          
          // Fetch item details including price from database
          fetch(`/api/items/${value}`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`Failed to fetch item details: ${res.status} ${res.statusText}`)
              }
              return res.json()
            })
            .then(itemData => {
              setFormData(prevData => ({
                ...prevData,
                items: prevData.items.map((prevItem, prevIndex) => {
                  if (prevIndex === index) {
                    const newItem = {
                      ...prevItem,
                      unitPrice: itemData.price || itemData.unitPrice || 0,
                      unit: itemData.unit || ''
                    }
                    newItem.totalPrice = newItem.quantity * newItem.unitPrice
                    return newItem
                  }
                  return prevItem
                })
              }))
            })
            .catch(error => {
              console.error('Error fetching item details:', error)
              toast.error('Failed to load item price. Please enter manually.')
            })
        }
      }
      
      // If updating quantity or unitPrice, recalculate totalPrice
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = field === 'quantity' ? Number(value) : updatedItem.quantity;
        const unitPrice = field === 'unitPrice' ? Number(value) : updatedItem.unitPrice;
        updatedItem.totalPrice = quantity * unitPrice;
      }
      
      updatedItems[index] = updatedItem;
      return { ...prev, items: updatedItems };
    });
    
    // Clear related error
    const errorKey = `item_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
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

  // Transform available items into options for select
  const itemOptions = [
    { value: '', label: 'Select Item' },
    ...availableItems.map(item => ({
      value: item.id,
      label: `${item.name} (${item.category})`
    }))
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? 'New Supply Request' : (readOnly ? 'View Request' : 'Edit Request')}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          {mode === 'add' ? (
            <Plus className="h-6 w-6 text-blue-600" />
          ) : readOnly ? (
            <Eye className="h-6 w-6 text-blue-600" />
          ) : (
            <Edit className="h-6 w-6 text-blue-600" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'add' ? 'Create New Supply Request' : (readOnly ? 'View Request Details' : 'Update Request Information')}
          </h3>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Request Title" required error={errors.title}>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter request title"
              error={!!errors.title}
              readOnly={readOnly}
            />
          </FormField>

          <FormField label="Department" required error={errors.department}>
            <Select
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              options={departmentOptions}
              error={!!errors.department}
              disabled={readOnly}
            />
          </FormField>

          <FormField label="Expected Delivery Date" error={errors.expectedDelivery}>
            <Input
              type="date"
              value={formData.expectedDelivery}
              onChange={(e) => handleInputChange('expectedDelivery', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              error={!!errors.expectedDelivery}
              readOnly={readOnly}
            />
          </FormField>

          <FormField label="Priority" className="md:col-span-2">
            <Select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              options={priorityOptions}
              disabled={readOnly}
            />
          </FormField>
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">Requested Items</h4>
            {!readOnly && (
              <button
                type="button"
                onClick={addItem}
                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            )}
          </div>

          {errors.items && (
            <p className="text-red-600 text-sm">{errors.items}</p>
          )}

          {formData.items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-900">Item {index + 1}</h5>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <FormField label="Item" required error={errors[`item_${index}_itemId`]}>
                  <Select
                    value={item.itemId || ''}
                    onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                    options={itemOptions}
                    error={!!errors[`item_${index}_itemId`]}
                    disabled={readOnly}
                  />
                </FormField>

                <FormField label="Quantity" required error={errors[`item_${index}_quantity`]}>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="Qty"
                    error={!!errors[`item_${index}_quantity`]}
                    readOnly={readOnly}
                  />
                </FormField>

                <FormField label="Unit Price" required error={errors[`item_${index}_unitPrice`]}>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    placeholder="Unit Price"
                    error={!!errors[`item_${index}_unitPrice`]}
                    readOnly={readOnly}
                  />
                </FormField>

                <FormField label="Total Price">
                  <Input
                    type="number"
                    value={item.totalPrice}
                    disabled
                    placeholder="Total Price"
                  />
                </FormField>
              </div>

              <FormField label="Notes (Optional)">
                <Input
                  value={item.notes || ''}
                  onChange={(e) => updateItem(index, 'notes', e.target.value)}
                  placeholder="Additional details about this item"
                  readOnly={readOnly}
                />
              </FormField>
            </div>
          ))}
        </div>

        {/* Description and Notes */}
        <div className="space-y-4">
          <FormField label="Description">
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the purpose of this request"
              rows={3}
              readOnly={readOnly}
            />
          </FormField>

          <FormField label="Additional Notes">
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information or special requirements"
              rows={2}
              readOnly={readOnly}
            />
          </FormField>
        </div>

        {!readOnly && (
          <FormActions
            onCancel={onClose}
            onSubmit={handleSubmit}
            submitText={mode === 'add' ? 'Submit Request' : 'Update Request'}
            isSubmitting={isSubmitting}
            submitIcon={mode === 'add' ? <Plus className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
          />
        )}
      </form>

      {/* Rejection reason input (shown when rejecting in view mode) */}
      {readOnly && showRejectionInput && (
        <div className="space-y-3 pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700">
            Reason for rejection
          </label>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejecting this request..."
            rows={3}
            disabled={isApproving}
          />
        </div>
      )}

      {/* Action buttons at the bottom for view mode */}
      {readOnly && (
        <div className="flex justify-between items-center pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>

          {request?.status === 'PENDING' && session?.user && (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') && (
            <div className="flex gap-3">
              {showRejectionInput ? (
                <>
                  <button
                    onClick={() => setShowRejectionInput(false)}
                    disabled={isApproving}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isApproving || !rejectionReason.trim()}
                    className={`px-4 py-2 text-white rounded-md transition-colors flex items-center gap-2 ${
                      isApproving || !rejectionReason.trim()
                        ? 'bg-red-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isApproving ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Confirm Rejection
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleReject}
                    disabled={isApproving}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    {isApproving ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

// View Request Modal
interface ViewRequestModalProps {
  isOpen: boolean
  onClose: () => void
  request: Request | null
  onUpdateStatus?: (requestId: string, status: Request['status'], comments?: string) => void
}

export function ViewRequestModal({ isOpen, onClose, request, onUpdateStatus }: ViewRequestModalProps) {
  const { data: session } = useSession()
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionInput, setShowRejectionInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  if (!request) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'FULFILLED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const handleApprove = async () => {
    if (!request) return

    if (!session?.user) {
      toast.error('You must be logged in to approve requests')
      return
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      toast.error('Only managers and administrators can approve requests')
      return
    }

    if (request.status !== 'PENDING') {
      toast.error('Only pending requests can be approved')
      return
    }

    setIsSubmitting(true)
    try {
      // First check if we have a valid session
      console.log('🔐 Checking session status...')
      const sessionResponse = await fetch('/api/auth/session')
      console.log(`📡 Session check status: ${sessionResponse.status}`)

      if (!sessionResponse.ok) {
        console.error('❌ No valid session found')
        toast.error('Please log in again to continue')
        window.location.href = '/auth/signin'
        return
      }

      const sessionData = await sessionResponse.json()
      console.log('✅ Session data:', sessionData)

      if (!sessionData?.user) {
        console.error('❌ No user in session')
        toast.error('Please log in again to continue')
        window.location.href = '/auth/signin'
        return
      }

      const response = await fetch(`/api/requests/${request.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // Ensure cookies are sent
        body: JSON.stringify({
          status: 'APPROVED'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Handle specific error cases
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.')
          window.location.href = '/auth/signin'
          return
        } else if (response.status === 403) {
          toast.error('You do not have permission to perform this action.')
          return
        }

        throw new Error(errorData.error || 'Failed to approve request')
      }

      const data = await response.json()
      toast.success(data.message || 'Request approved successfully')
      if (onUpdateStatus) {
        onUpdateStatus(request.id, 'APPROVED')
      }
    } catch (error) {
      console.error('Error approving request:', error)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Network error. Please check your connection and try again.')
      } else {
        toast.error(error instanceof Error ? error.message : 'An error occurred while approving the request')
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleReject = async () => {
    if (!request) return

    if (!session?.user) {
      toast.error('You must be logged in to reject requests')
      return
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      toast.error('Only managers and administrators can reject requests')
      return
    }

    if (request.status !== 'PENDING') {
      toast.error('Only pending requests can be rejected')
      return
    }

    if (!showRejectionInput) {
      setShowRejectionInput(true)
      return
    }

    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setIsSubmitting(true)
    try {
      // First check if we have a valid session
      console.log('🔐 Checking session status...')
      const sessionResponse = await fetch('/api/auth/session')
      console.log(`📡 Session check status: ${sessionResponse.status}`)

      if (!sessionResponse.ok) {
        console.error('❌ No valid session found')
        toast.error('Please log in again to continue')
        window.location.href = '/auth/signin'
        return
      }

      const sessionData = await sessionResponse.json()
      console.log('✅ Session data:', sessionData)

      if (!sessionData?.user) {
        console.error('❌ No user in session')
        toast.error('Please log in again to continue')
        window.location.href = '/auth/signin'
        return
      }

      const response = await fetch(`/api/requests/${request.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // Ensure cookies are sent
        body: JSON.stringify({
          status: 'REJECTED',
          comments: rejectionReason
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()

        // Handle specific error cases
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.')
          window.location.href = '/auth/signin'
          return
        } else if (response.status === 403) {
          toast.error('You do not have permission to perform this action.')
          return
        }

        throw new Error(errorData.error || 'Failed to reject request')
      }

      const data = await response.json()
      toast.success(data.message || 'Request rejected successfully')
      setShowRejectionInput(false)
      if (onUpdateStatus) {
        onUpdateStatus(request.id, 'REJECTED', rejectionReason)
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Network error. Please check your connection and try again.')
      } else {
        toast.error(error instanceof Error ? error.message : 'An error occurred while rejecting the request')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Details"
      size="xl"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Supply Request Information</h3>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Request Title</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{request.title}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{request.department}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{request.requester}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Request Date</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>

          {request.expectedDelivery && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {new Date(request.expectedDelivery).toLocaleDateString()}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
              {request.priority}
            </span>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>

              </div>

              
              {request.approvedBy && request.status === 'APPROVED' && (
                <div className="text-sm text-gray-600">
                  Approved by: {request.approvedBy} on {new Date(request.approvedAt).toLocaleString()}
                </div>
              )}
              
              {request.rejectedReason && request.status === 'REJECTED' && (
                <div className="text-sm text-gray-600">
                  <div>Rejection reason:</div>
                  <div className="italic">"{request.rejectedReason}"</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-3">Requested Items</h4>
          <div className="space-y-3">
            {request.items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Item Name</label>
                    <p className="text-gray-900">{item.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                    <p className="text-gray-900">{item.quantity}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price</label>
                    <p className="text-gray-900">${item.unitPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Total Price</label>
                    <p className="text-gray-900">${item.totalPrice.toFixed(2)}</p>
                  </div>
                  {item.description && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                      <p className="text-gray-900 text-sm">{item.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Description and Notes */}
        <div className="space-y-4">
          {request.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{request.description}</p>
            </div>
          )}

          {request.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{request.notes}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-semibold">
              ${request.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Rejection reason input (shown when rejecting) */}
        {showRejectionInput && (
          <div className="space-y-3 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700">
              Reason for rejection
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this request..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Action buttons at the bottom */}
        <div className="flex justify-between items-center pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>

          {request.status === 'PENDING' && session?.user && (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') && (
            <div className="flex gap-3">
              {showRejectionInput ? (
                <>
                  <button
                    onClick={() => setShowRejectionInput(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isSubmitting || !rejectionReason.trim()}
                    className={`px-4 py-2 text-white rounded-md transition-colors flex items-center gap-2 ${
                      isSubmitting || !rejectionReason.trim()
                        ? 'bg-red-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Confirm Rejection
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

// The submit button is now part of FormActions, which is conditionally rendered