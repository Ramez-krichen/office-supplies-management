'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Building2, Mail, Phone, MapPin, Edit, Trash2, Eye, Download, Filter, Users } from 'lucide-react'
import { SupplierModal } from '@/components/modals/SupplierModal'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { ExportButton } from '@/components/ui/export'
import { toast } from 'react-hot-toast'

interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  address: string
  contactPerson: string
  contactTitle?: string
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

export default function SuppliersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null)
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null)
  const [supplierToDeactivate, setSupplierToDeactivate] = useState<Supplier | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  
  // Access control check
  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // Only ADMINs can access suppliers page
    if (session.user?.role !== 'ADMIN') {
      toast.error('Access denied. Only administrators can manage suppliers.')
      router.push('/dashboard/employee') // Redirect to appropriate dashboard
      return
    }
  }, [session, status, router])

  // Fetch suppliers from API
  const fetchSuppliers = async () => {
    // Don't fetch if user doesn't have access
    if (status !== 'authenticated' || !session?.user || session.user.role !== 'ADMIN') {
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch('/api/suppliers')
      
      if (!response.ok) {
        // Get more specific error information
        let errorMessage = `HTTP ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          console.error('API Error Details:', errorData)
        } catch (jsonError) {
          console.error('Could not parse error response as JSON:', jsonError)
          const textError = await response.text()
          console.error('Raw error response:', textError)
          errorMessage = textError || errorMessage
        }
        throw new Error(`Failed to fetch suppliers: ${errorMessage}`)
      }
      
      const data = await response.json()
      
      // Preserve categories from existing suppliers when refreshing
      const newSuppliers = data.suppliers || []
      if (suppliers.length > 0) {
        // Create a map of existing suppliers with their categories
        const existingSupplierMap = suppliers.reduce((map, supplier) => {
          map[supplier.id] = supplier.categories || []
          return map
        }, {} as Record<string, string[]>)
        
        // Merge new suppliers with existing categories
        const mergedSuppliers = newSuppliers.map((newSupplier: Supplier) => {
          if (existingSupplierMap[newSupplier.id]) {
            return {
              ...newSupplier,
              categories: existingSupplierMap[newSupplier.id]
            }
          }
          return newSupplier
        })
        
        setSuppliers(mergedSuppliers)
      } else {
        setSuppliers(newSuppliers)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories from API
  const fetchCategories = async () => {
    // Don't fetch if user doesn't have access
    if (status !== 'authenticated' || !session?.user || session.user.role !== 'ADMIN') {
      return
    }
    
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    }
  }

  useEffect(() => {
    // Only fetch data if user has proper access
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchSuppliers()
      fetchCategories()
    }
  }, [status, session?.user?.role])

  // Show loading while checking authentication and authorization
  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Show loading while data is being fetched (after auth check passes)
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Don't render anything if user doesn't have access (redirect will handle this)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return null
  }

  const handleAddSupplier = async (supplierData: Partial<Supplier>) => {
    try {
      // Validate required fields before sending request
      if (!supplierData.name) {
        toast.error('Supplier name is required')
        return
      }
      
      if (!supplierData.contactPerson) {
        toast.error('Contact person is required')
        return
      }
      
      // Sanitize input data
      const sanitizedData = {
        name: supplierData.name.trim(),
        email: supplierData.email?.trim(),
        phone: supplierData.phone?.trim(),
        address: supplierData.address?.trim(),
        contactPerson: supplierData.contactPerson.trim(),
        website: supplierData.website?.trim(),
        taxId: supplierData.taxId?.trim(),
        paymentTerms: supplierData.paymentTerms?.trim(),
        notes: supplierData.notes?.trim()
      }
      
      // First create the supplier without categories
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      })

      // Parse the response JSON first
      const responseData = await response.json()
      
      // Then check if the response was successful
      if (!response.ok) {
        const errorMessage = responseData.error || 'Failed to create supplier'
        const errorDetails = responseData.details ? `: ${responseData.details}` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      // Use the already parsed response data
      const createdSupplier = responseData
      
      // Store the categories in local state for display purposes
      if (supplierData.categories && supplierData.categories.length > 0) {
        const updatedSuppliers = [...suppliers]
        const index = updatedSuppliers.findIndex(s => s.id === createdSupplier.id)
        if (index !== -1) {
          updatedSuppliers[index] = {
            ...updatedSuppliers[index],
            categories: supplierData.categories
          }
          setSuppliers(updatedSuppliers)
        }
      }

      toast.success('Supplier added successfully')
      setIsAddModalOpen(false)
      fetchSuppliers() // Refresh the list
    } catch (error) {
      console.error('Error adding supplier:', error)
      
      // Enhanced error handling with more specific messages
      let errorMessage = 'Failed to create supplier'
      
      if (error instanceof Error) {
        // Check for common error patterns
        const message = error.message
        
        if (message.includes('Database error')) {
          errorMessage = 'Database error: Unable to create supplier. Please try again later.'
        } else if (message.includes('already exists')) {
          errorMessage = 'A supplier with this name already exists.'
        } else if (message.includes('required')) {
          errorMessage = message // Use the validation error message directly
        } else if (message.includes('permission')) {
          errorMessage = 'Permission error: You may not have the right permissions to create a supplier.'
        } else if (message.includes('network')) {
          errorMessage = 'Network error: Please check your connection and try again.'
        } else if (message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.'
        } else {
          // Use the error message as is, but clean it up if needed
          errorMessage = message.replace(/Error:/g, '').trim()
        }
      }
      
      toast.error(`Error adding supplier: ${errorMessage}`)
      
      // Return the error so the modal can display it
      throw new Error(errorMessage)
    }
  }
  
  const handleEditSupplier = async (supplierData: Partial<Supplier>) => {
    if (!editingSupplier) return
    
    try {
      // Validate required fields before sending request
      if (!supplierData.name) {
        toast.error('Supplier name is required')
        return
      }
      
      // Create a copy of the data to send to the API
      const apiData = {
        name: supplierData.name,
        email: supplierData.email?.trim() || undefined,
        phone: supplierData.phone?.trim() || undefined,
        address: supplierData.address?.trim() || undefined,
        contactPerson: supplierData.contactPerson?.trim() || undefined
      }
      
      // Update the supplier without categories
      const response = await fetch(`/api/suppliers/${editingSupplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })

      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update supplier')
      }

      // Update the supplier in local state including categories
      const updatedSuppliers = [...suppliers]
      const index = updatedSuppliers.findIndex(s => s.id === editingSupplier.id)
      if (index !== -1) {
        // Use the response data we already parsed
        
        // Preserve the categories from the form data since they're not stored in the database
        updatedSuppliers[index] = {
          ...responseData,
          categories: supplierData.categories || updatedSuppliers[index].categories
        }
        setSuppliers(updatedSuppliers)
      }

      toast.success('Supplier updated successfully')
      setEditingSupplier(null)
      // Refresh the list immediately to show any category changes
      setTimeout(() => {
        fetchSuppliers()
      }, 100)
    } catch (error) {
      console.error('Error updating supplier:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update supplier')
    }
  }
  
  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/suppliers/${supplierToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete supplier')
      }

      toast.success('Supplier deleted successfully')
      setSupplierToDelete(null)
      fetchSuppliers() // Refresh the list
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete supplier')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const handleDeactivateSupplier = async () => {
    if (!supplierToDeactivate) return
    
    setIsDeactivating(true)
    try {
      // Note: This is a placeholder since the API doesn't support status changes yet
      // In a real implementation, you would add a status field to the supplier model
      // and create an endpoint to update the status
      toast.success('Status change functionality will be implemented with database schema updates')
      setSupplierToDeactivate(null)
    } catch (error) {
      console.error('Error changing supplier status:', error)
      toast.error('Failed to change supplier status')
    } finally {
      setIsDeactivating(false)
    }
  }
  
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || supplier.status === statusFilter
    const matchesCategory = categoryFilter === 'ALL' || 
                           (supplier.categories && supplier.categories.includes(categoryFilter))
    
    return matchesSearch && matchesStatus && matchesCategory
  })
  
  // Get unique categories from suppliers and database categories
  const supplierCategories = [
    ...new Set([
      ...categories.map(cat => cat.name),
      ...suppliers.flatMap(supplier => supplier.categories || [])
    ])
  ].sort()
  
  const exportData = filteredSuppliers.map(supplier => ({
    ID: supplier.id,
    Name: supplier.name,
    'Contact Person': supplier.contactPerson,
    'Contact Title': supplier.contactTitle || '',
    Email: supplier.email,
    Phone: supplier.phone,
    Address: supplier.address,
    Website: supplier.website || '',
    'Tax ID': supplier.taxId || '',
    'Payment Terms': supplier.paymentTerms || '',
    Status: supplier.status,
    'Items Count': supplier.itemsCount,
    'Total Orders': supplier.totalOrders,
    'Last Order Date': supplier.lastOrderDate,
    Rating: supplier.rating || 0,
    Categories: supplier.categories?.join(', ') || '',
    'Created Date': supplier.createdAt || '',
    Notes: supplier.notes || ''
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-600">Manage your supplier relationships</p>
          </div>
          <div className="flex gap-2">
            <ExportButton 
              data={exportData}
              filename="suppliers"
              variant="primary"
            >
              <Download className="h-4 w-4" />
              Export
            </ExportButton>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search suppliers by name, contact person, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Categories</option>
                  {supplierCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Suppliers Grid */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Suppliers ({filteredSuppliers.length})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 p-6">
            {filteredSuppliers.map((supplier) => (
              <div key={supplier.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Building2 className="h-8 w-8 text-gray-400" />
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">{supplier.name}</h3>
                        <p className="text-sm text-gray-500">{supplier.contactPerson}</p>
                        {supplier.contactTitle && (
                          <p className="text-xs text-gray-400">{supplier.contactTitle}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      supplier.status === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {supplier.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      {supplier.phone}
                    </div>
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="break-words">{supplier.address}</span>
                    </div>
                  </div>

                  {supplier.categories && supplier.categories.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {supplier.categories.slice(0, 2).map(category => (
                          <span key={category} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {category}
                          </span>
                        ))}
                        {supplier.categories.length > 2 && (
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            +{supplier.categories.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{supplier.itemsCount}</div>
                        <div className="text-xs text-gray-500">Items</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{supplier.totalOrders}</div>
                        <div className="text-xs text-gray-500">Orders</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {supplier.rating ? supplier.rating.toFixed(1) : 'N/A'}</div>
                        <div className="text-xs text-gray-500">Rating</div>
                      </div>
                    </div>
                    
                    {supplier.lastOrderDate && (
                      <div className="text-center mb-4">
                        <div className="text-sm text-gray-600">
                          Last order: {new Date(supplier.lastOrderDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => setViewingSupplier(supplier)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors hover:bg-gray-50"
                        title="View supplier details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setEditingSupplier(supplier)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors hover:bg-indigo-50"
                        title="Edit supplier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSupplierToDeactivate(supplier)}
                        className={`p-1 rounded transition-colors ${
                          supplier.status === 'Active'
                            ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        }`}
                        title={supplier.status === 'Active' ? 'Deactivate supplier' : 'Activate supplier'}
                      >
                        <Users className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setSupplierToDelete(supplier)}
                        className="text-red-600 hover:text-red-900 p-1 rounded transition-colors hover:bg-red-50"
                        title="Delete supplier"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No suppliers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding a new supplier.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Supplier Modal */}
      <SupplierModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddSupplier}
        mode="add"
        title="Add New Supplier"
        categories={categories}
      />

      {/* Edit Supplier Modal */}
      <SupplierModal
        isOpen={!!editingSupplier}
        onClose={() => {
          setEditingSupplier(null)
          // Refresh suppliers when modal closes to show any category updates
          setTimeout(() => {
            fetchSuppliers()
          }, 100)
        }}
        onSave={handleEditSupplier}
        mode="edit"
        title="Edit Supplier"
        initialData={editingSupplier || undefined}
        categories={categories}
      />

      {/* View Supplier Modal */}
      <SupplierModal
        isOpen={!!viewingSupplier}
        onClose={() => setViewingSupplier(null)}
        mode="view"
        title="Supplier Details"
        initialData={viewingSupplier || undefined}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={handleDeleteSupplier}
        type="delete"
        entityType="supplier"
        entityName={supplierToDelete?.name}
        loading={isDeleting}
      />

      {/* Deactivate/Activate Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!supplierToDeactivate}
        onClose={() => setSupplierToDeactivate(null)}
        onConfirm={handleDeactivateSupplier}
        type={supplierToDeactivate?.status === 'Active' ? 'deactivate' : 'warning'}
        entityType="supplier"
        entityName={supplierToDeactivate?.name}
        loading={isDeactivating}
        title={`${supplierToDeactivate?.status === 'Active' ? 'Deactivate' : 'Activate'} Supplier`}
        message={`Are you sure you want to ${supplierToDeactivate?.status === 'Active' ? 'deactivate' : 'activate'} this supplier?`}
      />
    </DashboardLayout>
  )
}

