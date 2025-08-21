'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { SystemMetricModal } from '@/components/modals/system-metric-modal'
import {
  Server,
  Database,
  Users,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Zap,
  UserX,
  UserCheck
} from 'lucide-react'

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalRequests: number
  totalPurchaseOrders: number
  totalSpending: number
  systemUptime: string
  databaseSize: string
  avgResponseTime: number
  errorRate: number
  recentActivity: {
    requests: number
    orders: number
    users: number
  }
  inactiveUsers: number
  overactiveUsers: number
}

interface Stat {
  name: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  metricType?: 'users' | 'inactive-users' | 'overactive-users' | 'requests' | 'purchase-orders' | 'spending' | 'system-health' | 'response-time'
  clickable?: boolean
}

export default function SystemDashboard() {
  const { data: session, status } = useSession()
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<{
    type: 'users' | 'inactive-users' | 'overactive-users' | 'requests' | 'purchase-orders' | 'spending' | 'system-health' | 'response-time'
    title: string
  } | null>(null)

  const fetchSystemMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/system')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      } else if (response.status === 401) {
        // Handle authentication errors silently
        console.log('Authentication required for system metrics')
      } else {
        console.error('Error fetching system metrics:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Always call useEffect hook
  useEffect(() => {
    // Only fetch if user is authenticated and is admin
    if (session && session.user.role === 'ADMIN') {
      fetchSystemMetrics()
    }
  }, [session])

  // Handle loading state
  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Handle unauthorized access
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!metrics) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load system metrics</h3>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </DashboardLayout>
    )
  }

  const stats: Stat[] = [
    {
      name: 'Total Users',
      value: metrics.totalUsers.toString(),
      change: `${metrics.activeUsers} active`,
      changeType: 'neutral',
      icon: Users,
      metricType: 'users',
      clickable: true
    },
    {
      name: 'Inactive Users',
      value: metrics.inactiveUsers.toString(),
      change: 'Not signed in for 30 days',
      changeType: 'negative',
      icon: UserX,
      metricType: 'inactive-users',
      clickable: true
    },
    {
      name: 'Overactive Users',
      value: metrics.overactiveUsers.toString(),
      change: 'More than 20 sign-ins this week',
      changeType: 'neutral',
      icon: UserCheck,
      metricType: 'overactive-users',
      clickable: true
    },
    {
      name: 'System Health',
      value: metrics.errorRate < 1 ? 'Healthy' : 'Issues',
      change: `${metrics.errorRate.toFixed(2)}% error rate`,
      changeType: metrics.errorRate < 1 ? 'positive' : 'negative',
      icon: metrics.errorRate < 1 ? CheckCircle : AlertTriangle,
      metricType: 'system-health',
      clickable: false
    },
    {
      name: 'Total Requests',
      value: metrics.totalRequests.toLocaleString(),
      change: `${metrics.recentActivity.requests} this week`,
      changeType: 'neutral',
      icon: BarChart3,
      metricType: 'requests',
      clickable: true
    },
    {
      name: 'Purchase Orders',
      value: metrics.totalPurchaseOrders.toLocaleString(),
      change: `${metrics.recentActivity.orders} this week`,
      changeType: 'neutral',
      icon: TrendingUp,
      metricType: 'purchase-orders',
      clickable: true
    },
    {
      name: 'Total Spending',
      value: `$${metrics.totalSpending.toLocaleString()}`,
      change: 'All time',
      changeType: 'neutral',
      icon: TrendingUp,
      metricType: 'spending',
      clickable: false
    },
    {
      name: 'Response Time',
      value: `${metrics.avgResponseTime}ms`,
      change: metrics.avgResponseTime < 200 ? 'Excellent' : 'Good',
      changeType: metrics.avgResponseTime < 200 ? 'positive' : 'neutral',
      icon: Zap,
      metricType: 'response-time',
      clickable: false
    }
  ]

  const handleMetricClick = (stat: Stat) => {
    if (stat.clickable && stat.metricType) {
      setSelectedMetric({
        type: stat.metricType,
        title: `${stat.name} Details`
      })
      setModalOpen(true)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Server className="h-8 w-8 mr-3 text-blue-600" />
              System Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              System-wide health, performance, and operational metrics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-400 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">System Online</span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.name}
                className={`bg-white rounded-lg shadow p-6 ${
                  stat.clickable
                    ? 'cursor-pointer hover:shadow-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105'
                    : ''
                }`}
                onClick={() => handleMetricClick(stat)}
                role={stat.clickable ? 'button' : undefined}
                tabIndex={stat.clickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (stat.clickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    handleMetricClick(stat)
                  }
                }}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-8 w-8 ${
                      stat.changeType === 'positive' ? 'text-green-600' :
                      stat.changeType === 'negative' ? 'text-red-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                        {stat.clickable && (
                          <span className="ml-2 text-xs text-blue-500">(Click for details)</span>
                        )}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className={`text-sm ${
                    stat.changeType === 'positive' ? 'text-green-600' :
                    stat.changeType === 'negative' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {stat.change}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* System Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                System Status
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Uptime</span>
                <span className="text-sm font-medium text-gray-900">{metrics.systemUptime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database Size</span>
                <span className="text-sm font-medium text-gray-900">{metrics.databaseSize}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Response Time</span>
                <span className="text-sm font-medium text-gray-900">{metrics.avgResponseTime}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Error Rate</span>
                <span className={`text-sm font-medium ${
                  metrics.errorRate < 1 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.errorRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Recent Activity (7 days)
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New Requests</span>
                <span className="text-sm font-medium text-gray-900">{metrics.recentActivity.requests}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Purchase Orders</span>
                <span className="text-sm font-medium text-gray-900">{metrics.recentActivity.orders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New Users</span>
                <span className="text-sm font-medium text-gray-900">{metrics.recentActivity.users}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-600" />
              System Health Indicators
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="text-sm font-medium text-gray-900">Database</h4>
                <p className="text-xs text-green-600">Operational</p>
              </div>
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="text-sm font-medium text-gray-900">API Services</h4>
                <p className="text-xs text-green-600">Operational</p>
              </div>
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="text-sm font-medium text-gray-900">File Storage</h4>
                <p className="text-xs text-green-600">Operational</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for detailed metrics */}
        {selectedMetric && (
          <SystemMetricModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setSelectedMetric(null)
            }}
            metricType={selectedMetric.type}
            metricTitle={selectedMetric.title}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
