'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Search, Filter, Calendar, Eye, Trash2, Edit, Plus, AlertTriangle } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  performedBy: string
  timestamp: string
  details: string | null
  user: {
    name: string | null
    email: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AuditLogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [entityFilter, setEntityFilter] = useState('ALL')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  const fetchAuditLogs = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (actionFilter !== 'ALL') params.append('action', actionFilter)
      if (entityFilter !== 'ALL') params.append('entity', entityFilter)
      if (dateRange.start) params.append('startDate', dateRange.start)
      if (dateRange.end) params.append('endDate', dateRange.end)

      const response = await fetch(`/api/audit-logs?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }
      
      const data = await response.json()
      setAuditLogs(data.auditLogs)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchAuditLogs()
    }
  }, [session, actionFilter, entityFilter, dateRange])

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-500" />
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-500" />
      case 'CREATE':
        return <Plus className="h-4 w-4 text-green-500" />
      default:
        return <Eye className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800'
      case 'CREATE':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600">Track all system activities and changes</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Actions</option>
                  <option value="DELETE">Delete</option>
                  <option value="UPDATE">Update</option>
                  <option value="CREATE">Create</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity</label>
                <select
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Entities</option>
                  <option value="User">Users</option>
                  <option value="Item">Items</option>
                  <option value="Request">Requests</option>
                  <option value="Supplier">Suppliers</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getActionIcon(log.action)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.entity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.details || 'No details available'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{log.user.name || 'Unknown'}</div>
                          <div className="text-gray-500">{log.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={fetchAuditLogs}
            showInfo={true}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}