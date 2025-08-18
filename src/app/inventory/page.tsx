'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, AlertTriangle, Package, Edit, Trash2, Eye, Calendar, Filter, ShoppingCart, CheckCircle } from 'lucide-react'
import { InventoryModal, ViewInventoryModal } from '../../components/modals/InventoryModal'
import { ConfirmModal } from '../../components/ui/modal'
import { ConfirmationModal } from '../../components/ui/confirmation-modal'
import { PurchaseOrderModal } from '../../components/modals/PurchaseOrderModal'
import { DateRange } from '../../components/ui/form'
import { ExportButton } from '../../components/ui/export'
import { canAccessFeature } from '@/lib/access-control'

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

// Mock data removed - now fetching from API

function InventoryPageContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [stockFilter, setStockFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [ecoFilter, setEcoFilter] = useState('ALL')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [showDateFilter, setShowDateFilter] = useState(false)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [deactivatingItem, setDeactivatingItem] = useState<InventoryItem | null>(null)
  const [purchaseOrderModal, setPurchaseOrderModal] = useState<{ isOpen: boolean; item: InventoryItem | null }>({ isOpen: false, item: null })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  
  // Data state
  const [items, setItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<{id: string, name: string}[]>([])
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const categoryOptions = ['ALL', ...Array.from(new Set(items.map(item =>
    typeof item.category === 'object' ? item.category?.name || 'Unknown' : item.category
  )))]
  const statuses = ['ALL', 'in-stock', 'low-stock', 'out-of-stock', 'discontinued']
  const ecoOptions = ['ALL', 'eco-friendly', 'recyclable', 'non-eco']

  // Filter items based on all criteria
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'ALL' ||
      (typeof item.category === 'object' ? item.category?.name === categoryFilter : item.category === categoryFilter)
    
    const matchesStock = stockFilter === 'ALL' || 
                        (stockFilter === 'LOW' && item.quantity <= item.minStock) ||
                        (stockFilter === 'IN_STOCK' && item.quantity > item.minStock && item.quantity > 0) ||
                        (stockFilter === 'OUT_OF_STOCK' && item.quantity === 0)

    const matchesEco = ecoFilter === 'ALL' ||
                       (ecoFilter === 'eco-friendly' && item.isEcoFriendly) ||
                       (ecoFilter === 'recyclable' && item.recyclable) ||
                       (ecoFilter === 'non-eco' && !item.isEcoFriendly && !item.recyclable)
    
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
    
    const matchesDateRange = !dateRange.from || !dateRange.to || 
                            (new Date(item.lastUpdated) >= new Date(dateRange.from) && 
                             new Date(item.lastUpdated) <= new Date(dateRange.to))
    
    return matchesSearch && matchesCategory && matchesStock && matchesStatus && matchesEco && matchesDateRange
  })

  const lowStockItems = items.filter(item => item.quantity <= item.minStock && item.isActive)
  const outOfStockItems = items.filter(item => item.quantity === 0 && item.isActive)

  // Function to auto-receive orders due today
  const autoReceiveOrders = async () => {
    // Check if user has permission to auto-receive orders
    if (!session?.user?.role || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      alert('❌ You do not have permission to auto-receive orders. This feature is only available to Administrators and Managers.')
      return
    }

    try {
      console.log('Checking for orders to auto-receive...')
      const response = await fetch('/api/purchase-orders/auto-receive', {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        if (result.processedOrders && result.processedOrders.length > 0) {
          console.log(`Auto-received ${result.processedOrders.length} orders:`, result.processedOrders)
          // Show a notification to the user
          alert(`✅ Automatically received ${result.processedOrders.length} purchase order(s) that were due for delivery today. Inventory has been updated.`)
        } else {
          console.log('No orders were due for auto-receiving today')
          alert('ℹ️ No orders were due for auto-receiving today.')
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to auto-receive orders:', errorText)

        if (response.status === 403) {
          alert('❌ You do not have permission to auto-receive orders. This feature is only available to Administrators and Managers.')
        } else {
          alert('❌ Failed to auto-receive orders. Please try again or contact support.')
        }
      }
    } catch (error) {
      console.error('Error in auto-receive process:', error)
      alert('❌ An error occurred while trying to auto-receive orders. Please try again.')
    }
  }

  // Function to fetch all data
  const fetchData = async () => {
    try {
      setIsLoading(true)

      // First, auto-receive any orders due today (only for ADMIN/MANAGER)
      if (session?.user?.role && (session.user.role === 'ADMIN' || session.user.role === 'MANAGER')) {
        await autoReceiveOrders()
      }

      const [itemsResponse, suppliersResponse, categoriesResponse] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/suppliers'),
        fetch('/api/categories')
      ])

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        console.log('Fetched items data:', itemsData)

        // The backend API already returns data in the correct format, so use it directly
        setItems(itemsData.items || [])
      }

      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json()
        setSuppliers(suppliersData.suppliers || [])
      }

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.categories || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on component mount and when page becomes visible
  useEffect(() => {
    fetchData()

    // Add event listener for when the page becomes visible (user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Handle URL parameters for filtering
  useEffect(() => {
    const status = searchParams.get('status')

    if (status === 'low-stock') {
      setStockFilter('LOW')
    }
  }, [searchParams])

  // CRUD Operations
  const handleAddItem = async (itemData: Omit<InventoryItem, 'id' | 'lastUpdated' | 'status'>) => {
    setIsLoading(true)
    try {
      // Find category ID by name
      const categoryId = categories.find(cat => cat.name === itemData.category)?.id
      // Find supplier ID by name
      const supplierId = suppliers.find(sup => sup.name === itemData.supplier)?.id
      
      if (!categoryId) {
        console.error('Category not found:', itemData.category)
        return
      }
      
      if (!supplierId) {
        console.error('Supplier not found:', itemData.supplier)
        return
      }
      
      // Map frontend field names to backend field names
      const mappedData = {
        name: itemData.name,
        description: itemData.description,
        reference: itemData.sku, // sku maps to reference
        unit: itemData.unit,
        price: itemData.unitPrice, // unitPrice maps to price
        minStock: itemData.minStock,
        currentStock: itemData.quantity, // quantity maps to currentStock
        categoryId: categoryId,
        supplierId: supplierId,
        isActive: true,
        isEcoFriendly: itemData.isEcoFriendly,
        ecoRating: itemData.ecoRating,
        carbonFootprint: itemData.carbonFootprint,
        recyclable: itemData.recyclable
      }
      
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappedData),
      })
      
      if (response.ok) {
        alert('Item added successfully!')
        setIsAddModalOpen(false)
        // Refresh the items list to get updated data
        await fetchData()
      } else {
        const errorData = await response.json()
        console.error('Failed to add item:', errorData)
        alert(`Failed to add item: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding item:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditItem = async (itemData: Omit<InventoryItem, 'id' | 'lastUpdated' | 'status'>) => {
    if (!editingItem) return
    
    setIsLoading(true)
    try {
      // Find category ID by name
      const categoryId = categories.find(cat => cat.name === itemData.category)?.id || null
      // Find supplier ID by name
      const supplierId = suppliers.find(sup => sup.name === itemData.supplier)?.id || null
      
      // Map frontend field names to backend field names
      const mappedData = {
        name: itemData.name,
        description: itemData.description,
        reference: itemData.sku, // sku maps to reference
        unit: itemData.unit,
        price: itemData.unitPrice, // unitPrice maps to price
        minStock: itemData.minStock,
        currentStock: itemData.quantity, // quantity maps to currentStock
        categoryId: categoryId,
        supplierId: supplierId,
        isActive: true,
        isEcoFriendly: itemData.isEcoFriendly,
        ecoRating: itemData.ecoRating,
        carbonFootprint: itemData.carbonFootprint,
        recyclable: itemData.recyclable
      }
      
      const response = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappedData),
      })
      
      if (response.ok) {
        alert('Item updated successfully!')
        setEditingItem(null)
        // Refresh the items list to get updated data
        await fetchData()
      } else {
        const errorData = await response.json()
        console.error('Failed to update item:', errorData)
        alert(`Failed to update item: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating item:', error)
      alert(`Error updating item: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!deletingItem) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/items/${deletingItem.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        alert('Item deleted successfully!')
        setDeletingItem(null)
        // Refresh the items list to get updated data
        await fetchData()
      } else {
        console.error('Failed to delete item')
        alert('Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeactivateItem = async () => {
    if (!deactivatingItem) return
    
    setIsDeactivating(true)
    try {
      // TODO: Implement status change API when database schema supports it
      // For now, just update local state
      setItems(prev => prev.map(item => 
        item.id === deactivatingItem.id 
          ? { ...item, isActive: false, status: 'discontinued' as const, lastUpdated: new Date().toISOString() }
          : item
      ))
      setDeactivatingItem(null)
    } catch (error) {
      console.error('Error deactivating item:', error)
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleCreatePurchaseOrder = async (orderData: any) => {
    try {
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        console.log('Purchase order created successfully')
        setPurchaseOrderModal({ isOpen: false, item: null })
        // Refresh the items list to get updated data
        await fetchData()
      } else {
        const errorData = await response.json()
        console.error('Failed to create purchase order:', errorData)
        alert(`Failed to create purchase order: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating purchase order:', error)
      alert('Error creating purchase order. Please try again.')
    }
  }

  const handleViewItem = (item: InventoryItem) => {
    setViewingItem(item)
  }

  const getStockStatus = (item: InventoryItem) => {
    if (!item.isActive) return { status: 'Discontinued', color: 'text-gray-600' }
    if (item.quantity === 0) return { status: 'Out of Stock', color: 'text-red-600' }
    if (item.quantity <= item.minStock) return { status: 'Low Stock', color: 'text-orange-600' }
    if (item.quantity >= item.maxStock) return { status: 'Overstocked', color: 'text-blue-600' }
    return { status: 'In Stock', color: 'text-green-600' }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800'
      case 'low-stock': return 'bg-yellow-100 text-yellow-800'
      case 'out-of-stock': return 'bg-red-100 text-red-800'
      case 'discontinued': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('ALL')
    setStockFilter('ALL')
    setStatusFilter('ALL')
    setEcoFilter('ALL')
    setDateRange({ from: '', to: '' })
    setShowDateFilter(false)
  }

  const exportData = filteredItems.map(item => ({
    SKU: item.sku,
    Name: item.name,
    Category: typeof item.category === 'object' ? item.category?.name || 'Unknown' : item.category,
    Description: item.description,
    'Current Stock': item.quantity,
    Unit: item.unit,
    'Min Stock': item.minStock,
    'Max Stock': item.maxStock,
    'Unit Price': item.unitPrice || 0,
    'Total Value': ((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2),
    Supplier: typeof item.supplier === 'object' ? item.supplier?.name || 'Unknown' : item.supplier,
    Location: item.location,
    Status: item.status,
    'Last Updated': new Date(item.lastUpdated).toLocaleDateString(),
    'Expiry Date': item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
    Active: item.isActive ? 'Yes' : 'No'
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600">Manage your office supplies inventory</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2 transition-colors"
              disabled={isLoading}
              title="Refresh inventory data"
            >
              <Package className="h-4 w-4" />
              Refresh
            </button>
            {/* Auto-Receive button - only show to ADMIN/MANAGER */}
            {session?.user?.role && (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') && (
              <button
                onClick={autoReceiveOrders}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors"
                disabled={isLoading}
                title="Process orders due for delivery today (Admin/Manager only)"
              >
                <CheckCircle className="h-4 w-4" />
                Auto-Receive
              </button>
            )}
            <ExportButton
              data={exportData}
              filename="inventory-report"
              variant="primary"
            />
            {/* Only show Add Item button if user can create inventory items */}
            {canAccessFeature(session?.user?.role, 'inventory', 'create') && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            )}
          </div>
        </div>

        {/* Stock Alerts - Only show for admins and managers, not employees */}
        {(lowStockItems.length > 0 || outOfStockItems.length > 0) && session?.user?.role !== 'EMPLOYEE' && (
          <div className="space-y-3">
            {outOfStockItems.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                  <h3 className="text-sm font-medium text-red-800">
                    Out of Stock Alert
                  </h3>
                </div>
                <div className="mt-2 text-sm text-red-700">
                  {outOfStockItems.length} item(s) are out of stock:
                  <span className="font-medium ml-1">
                    {outOfStockItems.slice(0, 3).map(item => item.name).join(', ')}
                    {outOfStockItems.length > 3 && ` and ${outOfStockItems.length - 3} more`}
                  </span>
                </div>
              </div>
            )}
            
            {lowStockItems.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-400 mr-2" />
                  <h3 className="text-sm font-medium text-orange-800">
                    Low Stock Alert
                  </h3>
                </div>
                <div className="mt-2 text-sm text-orange-700">
                  {lowStockItems.length} item(s) are running low on stock:
                  <span className="font-medium ml-1">
                    {lowStockItems.slice(0, 3).map(item => item.name).join(', ')}
                    {lowStockItems.length > 3 && ` and ${lowStockItems.length - 3} more`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, SKU, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                {categoryOptions.map(category => (
                  <option key={category} value={category}>
                    {category === 'ALL' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'ALL' ? 'All Statuses' : (status || 'in-stock').replace('-', ' ')}
                  </option>
                ))}
              </select>

              <select
                value={ecoFilter}
                onChange={(e) => setEcoFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                {ecoOptions.map(option => (
                  <option key={option} value={option}>
                    {option === 'ALL' ? 'All Eco Types' : option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-colors ${
                  showDateFilter || dateRange.from || dateRange.to
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Calendar className="h-4 w-4" />
                Date Range
              </button>
              
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          {/* Date Range Filter */}
          {showDateFilter && (
            <div className="border-t pt-4">
              <DateRange
                value={dateRange}
                onChange={setDateRange}
                label="Filter by Last Updated Date"
              />
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredItems.length} of {items.length} items
            {searchTerm && ` for "${searchTerm}"`}
          </span>
          <span>
            Total Value: ${filteredItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0).toFixed(2)}
          </span>
        </div>

        {/* Inventory Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const stockStatus = getStockStatus(item)
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${!item.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Package className="h-8 w-8 text-gray-400 mr-3 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.sku}</div>
                            <div className="text-xs text-gray-400 truncate">{item.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {typeof item.category === 'object' ? item.category?.name || 'Unknown' : item.category}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <span className={`font-medium ${stockStatus.color}`}>
                            {item.quantity}
                          </span> {item.unit}
                        </div>
                        <div className="text-xs text-gray-500">
                          Min: {item.minStock} | Max: {item.maxStock}
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          ${item.unitPrice?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total: ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(item.status || 'in-stock')}`}>
                          {(item.status || 'in-stock').replace('-', ' ')}
                        </span>
                        <div className={`text-xs mt-1 ${stockStatus.color}`}>
                          {stockStatus.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {typeof item.supplier === 'object' ? item.supplier?.name || 'Unknown' : item.supplier}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(item)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors hover:bg-blue-50"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {/* Only show edit button if user can edit inventory */}
                          {canAccessFeature(session?.user?.role, 'inventory', 'edit') && (
                            <button
                              onClick={() => setEditingItem(item)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors hover:bg-indigo-50"
                              title="Edit item"
                              disabled={isLoading}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {/* Only show purchase order button if user can create orders and item is low stock */}
                          {canAccessFeature(session?.user?.role, 'inventory', 'edit') && (item.quantity <= item.minStock && item.isActive) && (
                            <button
                              onClick={() => setPurchaseOrderModal({ isOpen: true, item })}
                              className="text-green-600 hover:text-green-900 p-1 rounded transition-colors hover:bg-green-50"
                              title="Create purchase order"
                              disabled={isLoading}
                            >
                              <ShoppingCart className="h-4 w-4" />
                            </button>
                          )}
                          {/* Only show deactivate/delete buttons if user can edit inventory */}
                          {canAccessFeature(session?.user?.role, 'inventory', 'edit') && (
                            item.isActive ? (
                              <button
                                onClick={() => setDeactivatingItem(item)}
                                className="text-orange-600 hover:text-orange-900 p-1 rounded transition-colors hover:bg-orange-50"
                                title="Deactivate item"
                                disabled={isLoading}
                              >
                                <Package className="h-4 w-4" />
                              </button>
                            ) : (
                              canAccessFeature(session?.user?.role, 'inventory', 'delete') && (
                                <button
                                  onClick={() => setDeletingItem(item)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded transition-colors hover:bg-red-50"
                                  title="Delete item permanently"
                                  disabled={isLoading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || categoryFilter !== 'ALL' || stockFilter !== 'ALL' || statusFilter !== 'ALL' || dateRange.from || dateRange.to
                ? 'No items match your current search criteria.'
                : 'Get started by adding your first inventory item.'}
            </p>
            {(searchTerm || categoryFilter !== 'ALL' || stockFilter !== 'ALL' || statusFilter !== 'ALL' || dateRange.from || dateRange.to) && (
              <button
                onClick={clearFilters}
                className="mt-3 text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <InventoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddItem}
        mode="add"
        suppliers={suppliers}
        categories={categories}
      />

      <InventoryModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleEditItem}
        item={editingItem}
        mode="edit"
        suppliers={suppliers}
        categories={categories}
      />

      <ViewInventoryModal
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
        item={viewingItem}
      />

      <ConfirmationModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteItem}
        type="delete"
        entityType="item"
        entityName={deletingItem?.name}
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={!!deactivatingItem}
        onClose={() => setDeactivatingItem(null)}
        onConfirm={handleDeactivateItem}
        type="deactivate"
        entityType="item"
        entityName={deactivatingItem?.name}
        isLoading={isDeactivating}
        customMessage="This will mark the item as discontinued but keep it in the system for historical records."
      />

      <PurchaseOrderModal
        isOpen={purchaseOrderModal.isOpen}
        onClose={() => setPurchaseOrderModal({ isOpen: false, item: null })}
        onSave={handleCreatePurchaseOrder}
        suppliers={suppliers}
        preselectedItem={purchaseOrderModal.item || undefined}
        mode="create"
      />
    </DashboardLayout>
  )
}

export default function InventoryPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading inventory...</div>
        </div>
      </DashboardLayout>
    }>
      <InventoryPageContent />
    </Suspense>
  )
}
