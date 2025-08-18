'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, ShoppingCart, Calendar, DollarSign, Truck, Edit, Trash2, Eye, Download, Send, CheckCircle } from 'lucide-react'
import { OrderModal } from '@/components/modals/OrderModal'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { ExportButton } from '@/components/ui/export'
import { DateRange } from '@/components/ui/form'

interface OrderItem {
  id?: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice?: number
}

interface Order {
  id: string
  orderNumber: string
  supplier: string
  supplierId?: string
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'
  totalAmount: number
  orderDate: string
  expectedDate?: string
  receivedDate?: string
  itemsCount: number
  items: OrderItem[]
  notes?: string
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
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





const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-yellow-100 text-yellow-800',
  PARTIALLY_RECEIVED: 'bg-orange-100 text-orange-800',
  RECEIVED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const priorityColors = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800',
  Urgent: 'bg-red-100 text-red-800'
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [supplierFilter, setSupplierFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [orderToSend, setOrderToSend] = useState<Order | null>(null)
  const [orderToReceive, setOrderToReceive] = useState<Order | null>(null)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isReceiving, setIsReceiving] = useState(false)
  
  // Get unique values for filters
  const suppliers = Array.from(new Set(orders.map(order => order.supplier).filter(Boolean)))
  const departments = Array.from(new Set(orders.map(order => order.department).filter(Boolean)))

  // Function to fetch individual order details
  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/purchase-orders/${orderId}`)
      if (response.ok) {
        const orderData = await response.json()
        return orderData
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
    }
    return null
  }

  // Function to fetch orders data
  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/purchase-orders')

      if (response.ok) {
        const ordersData = await response.json()
        console.log('Fetched orders data:', ordersData)

        // Transform the data to match the expected interface
        const transformedOrders = (ordersData.orders || []).map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          supplier: order.supplierName || order.supplier?.name || order.supplier || 'Unknown Supplier',
          supplierId: order.supplierId,
          status: order.status,
          totalAmount: order.totalAmount,
          orderDate: order.orderDate,
          expectedDate: order.expectedDate,
          receivedDate: order.receivedDate,
          itemsCount: order.items?.length || 0,
          items: order.items || [],
          notes: order.notes,
          priority: order.priority,
          department: order.department,
          requestedBy: order.requestedBy,
          approvedBy: order.approvedBy,
          createdBy: order.createdBy,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }))

        setOrders(transformedOrders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Check access and fetch data on component mount
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user has access to purchase orders
    const checkAccess = async () => {
      try {
        // For admins, always allow access
        if (session.user.role === 'ADMIN') {
          setHasAccess(true)
          fetchOrders()
          return
        }

        // For managers, check if they have explicit permission
        if (session.user.role === 'MANAGER') {
          const response = await fetch(`/api/admin/users/${session.user.id}/permissions`)
          if (response.ok) {
            const data = await response.json()
            const hasPermission = data.user.permissions.includes('purchase_orders')
            setHasAccess(hasPermission)
            if (hasPermission) {
              fetchOrders()
            }
          } else {
            setHasAccess(false)
          }
        } else {
          // Employees don't have access
          setHasAccess(false)
        }
      } catch (error) {
        console.error('Error checking access:', error)
        setHasAccess(false)
      }
    }

    checkAccess()
  }, [session, status, router])
  
  const handleAddOrder = async (orderData: Partial<Order>) => {
    try {
      const response = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        alert('Order created successfully!')
        // Refresh the orders list to get updated data
        await fetchOrders()
      } else {
        const errorData = await response.json()
        alert(`Failed to create order: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding order:', error)
      alert('Error creating order. Please try again.')
    }
  }

  
  const handleEditOrder = async (orderData: Partial<Order>) => {
    if (!editingOrder) return

    try {
      console.log('Sending order update data:', JSON.stringify(orderData, null, 2))

      const response = await fetch(`/api/purchase-orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      console.log('Update response status:', response.status)

      if (response.ok) {
        alert('Order updated successfully!')
        // Refresh the orders list to get updated data
        await fetchOrders()
      } else {
        const errorData = await response.json()
        console.error('Update error response:', errorData)
        alert(`Failed to update order: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error updating order. Please try again.')
    }
  }


  const handleViewOrder = (order: Order) => {
    setViewingOrder(order)
  }
  
  const handleDeleteOrder = async (orderId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/purchase-orders/${orderId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setOrderToDelete(null)
        alert('Order deleted successfully!')
        // Refresh the orders list to get updated data
        await fetchOrders()
      } else {
        const errorData = await response.json()
        alert(`Failed to delete order: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Error deleting order. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const handleSendOrder = async () => {
    if (!orderToSend) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/purchase-orders/${orderToSend.id}/send`, {
        method: 'POST',
      })

      if (response.ok) {
        setOrderToSend(null)
        alert('Order sent successfully!')
        // Refresh the orders list to get updated data
        await fetchOrders()
      } else {
        const errorData = await response.json()
        alert(`Failed to send order: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error sending order:', error)
      alert('Error sending order. Please try again.')
    } finally {
      setIsSending(false)
    }
  }
  
  const handleReceiveOrder = async () => {
    if (!orderToReceive) return

    setIsReceiving(true)
    try {
      const response = await fetch(`/api/purchase-orders/${orderToReceive.id}/receive`, {
        method: 'POST',
      })

      if (response.ok) {
        setOrderToReceive(null)
        alert('Order received successfully! Inventory has been updated.')
        // Refresh the orders list to get updated data
        await fetchOrders()
      } else {
        const errorData = await response.json()
        alert(`Failed to receive order: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error receiving order:', error)
      alert('Error receiving order. Please try again.')
    } finally {
      setIsReceiving(false)
    }
  }
  
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.requestedBy && order.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter
    const matchesSupplier = supplierFilter === 'ALL' || order.supplier === supplierFilter
    const matchesPriority = priorityFilter === 'ALL' || order.priority === priorityFilter
    const matchesDepartment = departmentFilter === 'ALL' || order.department === departmentFilter
    
    let matchesDateRange = true
    if (dateRange.start && dateRange.end) {
      const orderDate = new Date(order.orderDate)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      matchesDateRange = orderDate >= startDate && orderDate <= endDate
    }
    
    return matchesSearch && matchesStatus && matchesSupplier && matchesPriority && matchesDepartment && matchesDateRange
  })
  
  const exportData = filteredOrders.map(order => ({
    'Order Number': order.orderNumber,
    Supplier: order.supplier,
    Status: order.status,
    Priority: order.priority || '',
    Department: order.department || '',
    'Requested By': order.requestedBy || '',
    'Approved By': order.approvedBy || '',
    'Order Date': order.orderDate,
    'Expected Date': order.expectedDate || '',
    'Received Date': order.receivedDate || '',
    'Total Amount': order.totalAmount,
    'Items Count': order.itemsCount,
    Notes: order.notes || ''
  }))

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Calendar className="h-4 w-4" />
      case 'SENT': return <Send className="h-4 w-4" />
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4" />
      case 'PARTIALLY_RECEIVED': return <Truck className="h-4 w-4" />
      case 'RECEIVED': return <Truck className="h-4 w-4" />
      case 'CANCELLED': return <Calendar className="h-4 w-4" />
      default: return <ShoppingCart className="h-4 w-4" />
    }
  }

  // Show loading state
  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Show access denied for users without permission
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-4">
            You don't have permission to access purchase orders.
          </p>
          {session?.user?.role === 'MANAGER' && (
            <p className="text-sm text-gray-500">
              Contact your administrator to request purchase order access.
            </p>
          )}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600">Manage supplier orders and deliveries</p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={exportData}
              filename="purchase-orders"
              variant="primary"
            >
              <Download className="h-4 w-4" />
              Export
            </ExportButton>
            <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 w-fit"
          >
            <Plus className="h-4 w-4" />
            New Order
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
                placeholder="Search orders by number, supplier, or requester..."
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PARTIALLY_RECEIVED">Partially Received</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Suppliers</option>
                  {suppliers.map((supplier, index) => (
                    <option key={`supplier-${supplier}-${index}`} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((department, index) => (
                    <option key={`department-${department}-${index}`} value={department}>{department}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Date Range</label>
                <DateRange
                  value={dateRange}
                  onChange={setDateRange}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Orders Grid */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Purchase Orders ({filteredOrders.length})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 p-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-500">{order.supplier}</p>
                        {order.department && (
                          <p className="text-xs text-gray-400">{order.department}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                      {order.priority && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[order.priority]}`}>
                          {order.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Order Date</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Expected Date</div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : 'TBD'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Amount</div>
                      <div className="text-lg font-semibold text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Items</div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.itemsCount} item(s)
                      </div>
                    </div>
                  </div>

                  {order.requestedBy && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500">Requested by</div>
                      <div className="text-sm font-medium text-gray-900">{order.requestedBy}</div>
                    </div>
                  )}

                  {order.receivedDate && (
                    <div className="mb-4 p-3 bg-green-50 rounded-md">
                      <div className="text-sm text-green-800">
                        <strong>Received:</strong> {new Date(order.receivedDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            const fullOrderDetails = await fetchOrderDetails(order.id)
                            if (fullOrderDetails) {
                              setViewingOrder(fullOrderDetails)
                            } else {
                              setViewingOrder(order)
                            }
                          }}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors hover:bg-gray-50"
                          title="View order details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {order.status === 'DRAFT' && (
                          <button 
                            onClick={() => setEditingOrder(order)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors hover:bg-indigo-50"
                            title="Edit order"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => setOrderToDelete(order)}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors hover:bg-red-50"
                          title="Delete order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        {order.status === 'DRAFT' && (
                          <button 
                            onClick={() => setOrderToSend(order)}
                            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors flex items-center gap-1"
                            title="Send order to supplier"
                          >
                            <Send className="h-3 w-3" />
                            Send
                          </button>
                        )}
                        {(order.status === 'SENT' || order.status === 'CONFIRMED') && (
                          <button 
                            onClick={() => setOrderToReceive(order)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                            title="Mark order as received"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Received
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'ALL' || supplierFilter !== 'ALL' || priorityFilter !== 'ALL' || departmentFilter !== 'ALL' || dateRange.start || dateRange.end
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating a new purchase order.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Order Modal */}
      <OrderModal
        isOpen={isAddModalOpen && !editingOrder && !viewingOrder}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddOrder}
        mode="add"
        title="Add New Order"
      />

      {/* Edit Order Modal */}
      <OrderModal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        onSave={handleEditOrder}
        order={editingOrder}
        mode="edit"
        title="Edit Order"
      />

      {/* View Order Modal */}
      <OrderModal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        order={viewingOrder}
        mode="view"
        title="Order Details"
        readOnly={true}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={() => handleDeleteOrder(orderToDelete?.id || '')}
        type="delete"
        entityType="Order"
        entityName={orderToDelete?.orderNumber || ''}
        isLoading={isDeleting}
      />

      {/* Send Order Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!orderToSend}
        onClose={() => setOrderToSend(null)}
        onConfirm={handleSendOrder}
        type="send"
        entityType="Order"
        entityName={orderToSend?.orderNumber || ''}
        isLoading={isSending}
        customMessage={`Are you sure you want to send order "${orderToSend?.orderNumber}" to ${orderToSend?.supplier}?`}
      />

      {/* Mark Received Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!orderToReceive}
        onClose={() => setOrderToReceive(null)}
        onConfirm={handleReceiveOrder}
        type="receive"
        entityType="Order"
        entityName={orderToReceive?.orderNumber || ''}
        isLoading={isReceiving}
        customMessage={`Are you sure you want to mark order "${orderToReceive?.orderNumber}" as received?`}
      />
    </DashboardLayout>
  )
}
