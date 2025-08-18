'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { 
  Users, 
  UserX, 
  UserCheck, 
  BarChart3, 
  TrendingUp,
  Calendar,
  Building,
  Clock,
  DollarSign,
  Package,
  AlertCircle
} from 'lucide-react'

interface MetricModalProps {
  isOpen: boolean
  onClose: () => void
  metricType: 'users' | 'inactive-users' | 'overactive-users' | 'requests' | 'purchase-orders' | 'spending' | 'system-health' | 'response-time'
  metricTitle: string
}

export function SystemMetricModal({ isOpen, onClose, metricType, metricTitle }: MetricModalProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && metricType) {
      fetchDetailedData()
    }
  }, [isOpen, metricType])

  const fetchDetailedData = async () => {
    setLoading(true)
    try {
      let endpoint = ''
      switch (metricType) {
        case 'users':
        case 'inactive-users':
        case 'overactive-users':
          endpoint = '/api/dashboard/system/users'
          break
        case 'requests':
          endpoint = '/api/dashboard/system/requests'
          break
        case 'purchase-orders':
          endpoint = '/api/dashboard/system/purchase-orders'
          break
        default:
          setData({ message: 'Detailed data not available for this metric' })
          setLoading(false)
          return
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This ensures cookies are included
      })
      
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        console.error('API Error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error details:', errorText)
        setData({ error: `Failed to fetch detailed data: ${response.status} ${response.statusText}` })
      }
    } catch (error) {
      console.error('Error fetching detailed data:', error)
      setData({ error: 'Failed to fetch detailed data' })
    } finally {
      setLoading(false)
    }
  }

  const renderUserDetails = () => {
    if (!data?.users) return null

    let users = []
    let title = ''
    
    switch (metricType) {
      case 'users':
        users = data.users.all.slice(0, 20) // Show first 20
        title = `All Users (${data.summary.total})`
        break
      case 'inactive-users':
        users = data.users.inactive
        title = `Inactive Users (${data.summary.inactive})`
        break
      case 'overactive-users':
        users = data.users.overactive
        title = `Overactive Users (${data.summary.overactive})`
        break
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data.summary.total}</div>
            <div className="text-sm text-blue-600">Total Users</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{data.summary.active}</div>
            <div className="text-sm text-green-600">Active Users</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{data.summary.inactive}</div>
            <div className="text-sm text-red-600">Inactive Users</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{data.summary.recent}</div>
            <div className="text-sm text-yellow-600">Recent Users</div>
          </div>
        </div>

        <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {users.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {user.departmentRef?.name && (
                      <div className="text-xs text-gray-400">{user.departmentRef.name}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </div>
                  {user.lastSignIn && (
                    <div className="text-xs text-gray-500 mt-1">
                      Last: {new Date(user.lastSignIn).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderRequestDetails = () => {
    if (!data?.requests) return null

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data.summary.total}</div>
            <div className="text-sm text-blue-600">Total Requests</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{data.summary.recent}</div>
            <div className="text-sm text-green-600">This Week</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">${data.summary.totalValue?.toLocaleString()}</div>
            <div className="text-sm text-purple-600">Total Value</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{data.summary.byStatus?.PENDING || 0}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">By Status</h4>
            <div className="space-y-2">
              {Object.entries(data.summary.byStatus || {}).map(([status, count]: [string, any]) => (
                <div key={status} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{status}</span>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">By Priority</h4>
            <div className="space-y-2">
              {Object.entries(data.summary.byPriority || {}).map(([priority, count]: [string, any]) => (
                <div key={priority} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{priority}</span>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Recent Requests</h4>
          <div className="max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {data.requests.recent.slice(0, 10).map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{request.title}</div>
                      <div className="text-sm text-gray-500">{request.user.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderPurchaseOrderDetails = () => {
    if (!data?.orders) return null

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data.summary.total}</div>
            <div className="text-sm text-blue-600">Total Orders</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{data.summary.recent}</div>
            <div className="text-sm text-green-600">This Week</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">${data.summary.totalSpending?.toLocaleString()}</div>
            <div className="text-sm text-purple-600">Total Spending</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{data.summary.byStatus?.PENDING?.count || 0}</div>
            <div className="text-sm text-yellow-600">Pending Orders</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">By Status</h4>
            <div className="space-y-2">
              {Object.entries(data.summary.byStatus || {}).map(([status, info]: [string, any]) => (
                <div key={status} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{status}</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{info.count} orders</div>
                    <div className="text-xs text-gray-500">${info.totalAmount?.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Top Suppliers</h4>
            <div className="space-y-2">
              {data.summary.topSuppliers?.map((supplier: any, index: number) => (
                <div key={supplier.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">#{index + 1} {supplier.name}</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{supplier.count} orders</div>
                    <div className="text-xs text-gray-500">${supplier.totalAmount?.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Recent Orders</h4>
          <div className="max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {data.orders.recent.slice(0, 10).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">{order.supplier.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      order.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                      order.status === 'ORDERED' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </div>
                    <div className="text-sm font-medium text-gray-900">${order.totalAmount?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (data?.error) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600">{data.error}</p>
        </div>
      )
    }

    switch (metricType) {
      case 'users':
      case 'inactive-users':
      case 'overactive-users':
        return renderUserDetails()
      case 'requests':
        return renderRequestDetails()
      case 'purchase-orders':
        return renderPurchaseOrderDetails()
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">Detailed information for this metric is not available yet.</p>
          </div>
        )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={metricTitle}
      size="xl"
    >
      {renderContent()}
    </Modal>
  )
}