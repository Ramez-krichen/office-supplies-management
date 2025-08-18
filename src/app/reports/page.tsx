'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  FileText,
  Download,
  Calendar,
  Building2
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface ReportCard {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  description: string
}

interface Category {
  name: string
  amount: number
  percentage: number
}

interface Supplier {
  name: string
  orders: number
  amount: number
}

interface MonthlyData {
  month: string
  amount: number
}

interface AnalyticsData {
  reportCards: ReportCard[]
  topCategories: Category[]
  topSuppliers: Supplier[]
  monthlyTrend: MonthlyData[]
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchAnalytics()
  }, [searchParams])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const department = searchParams.get('department')
      const url = department
        ? `/api/reports/analytics?department=${encodeURIComponent(department)}`
        : '/api/reports/analytics'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const data = await response.json()
      setAnalyticsData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading session...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading analytics...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !analyticsData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error || 'Failed to load data'}</div>
        </div>
      </DashboardLayout>
    )
  }

  const { reportCards, topCategories, topSuppliers, monthlyTrend } = analyticsData
  
  // Determine if this is department-specific data
  const urlDepartment = searchParams.get('department') || undefined
  const userDepartment = session?.user?.department
  const isDepartmentSpecific = Boolean(urlDepartment || (session?.user?.role === 'MANAGER' && userDepartment))
  const departmentLabel = urlDepartment || userDepartment || 'Department'

  const iconMap = {
    'Monthly Spending': DollarSign,
    'Requests Processed': FileText,
    'Items Ordered': Package,
    'Average Order Value': TrendingUp,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isDepartmentSpecific ? `${departmentLabel} Department Reports` : 'Reports & Analytics'}
            </h1>
            <p className="text-gray-600">
              {isDepartmentSpecific 
                ? `Track spending, consumption, and trends for ${departmentLabel} department`
                : 'Track spending, consumption, and trends across all departments'
              }
            </p>
            {isDepartmentSpecific && (
              <div className="flex items-center mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
                <Building2 className="h-4 w-4 mr-2" />
                Showing data filtered for {departmentLabel} department only
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reportCards.map((card) => {
            const IconComponent = iconMap[card.title as keyof typeof iconMap] || DollarSign
            return (
            <div key={card.title} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <IconComponent className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {card.value}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center">
                    <div className={`text-sm ${
                      card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {card.change}
                    </div>
                    <div className="text-sm text-gray-500 ml-2">
                      vs last month
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {card.description}
                  </div>
                </div>
              </div>
            </div>
          )})
        }</div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending by Category */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Spending by Category
              {isDepartmentSpecific && (
                <span className="text-sm font-normal text-gray-500 ml-2">({userDepartment})</span>
              )}
            </h3>
            <div className="space-y-4">
              {topCategories.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <span className="text-gray-500">${category.amount.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Suppliers */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Top Suppliers
              {isDepartmentSpecific && (
                <span className="text-sm font-normal text-gray-500 ml-2">({userDepartment})</span>
              )}
            </h3>
            <div className="space-y-4">
              {topSuppliers.map((supplier, index) => (
                <div key={supplier.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-600">{index + 1}</span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      <div className="text-sm text-gray-500">{supplier.orders} orders</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ${supplier.amount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Spending Trend */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Monthly Spending Trend
            {isDepartmentSpecific && (
              <span className="text-sm font-normal text-gray-500 ml-2">({userDepartment} Department)</span>
            )}
          </h3>
          <div className="mt-4">
            <div className="h-64 relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
                {[...Array(5)].map((_, i) => {
                  const maxAmount = Math.max(...monthlyTrend.map(m => m.amount), 1)
                  const value = maxAmount - (i * (maxAmount / 4))
                  return (
                    <div key={i} className="flex items-center">
                      <span>${value > 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(0)}</span>
                    </div>
                  )
                })}
              </div>
              
              {/* Grid lines */}
              <div className="ml-12 h-full flex flex-col justify-between">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border-b border-gray-200 w-full h-0"></div>
                ))}
              </div>
              
              {/* Line chart */}
              <div className="absolute left-12 right-0 top-0 bottom-0">
                {monthlyTrend.length > 0 && (
                  <svg className="w-full h-full" viewBox={`0 0 ${monthlyTrend.length * 100} 100`} preserveAspectRatio="none">
                    <path
                      d={monthlyTrend.map((month, i) => {
                        const maxAmount = Math.max(...monthlyTrend.map(m => m.amount), 1)
                        const x = (i / Math.max(monthlyTrend.length - 1, 1)) * 100 * Math.max(monthlyTrend.length - 1, 1)
                        const y = 100 - ((month.amount / maxAmount) * 100)
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ')}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="2"
                    />
                    
                    {/* Data points */}
                    {monthlyTrend.map((month, i) => {
                      const maxAmount = Math.max(...monthlyTrend.map(m => m.amount), 1)
                      const x = (i / Math.max(monthlyTrend.length - 1, 1)) * 100 * Math.max(monthlyTrend.length - 1, 1)
                      const y = 100 - ((month.amount / maxAmount) * 100)
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#4f46e5"
                        />
                      )
                    })}
                  </svg>
                )}
              </div>
              
              {/* X-axis labels */}
              <div className="absolute left-12 right-0 bottom-0 translate-y-6 flex justify-between text-xs text-gray-500">
                {monthlyTrend.map((month) => (
                  <div key={month.month}>{month.month}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Reports */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Quick Reports
            {isDepartmentSpecific && (
              <span className="text-sm font-normal text-gray-500 ml-2">({userDepartment} Department)</span>
            )}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => router.push('/quick-reports?type=consumption')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <BarChart3 className="h-6 w-6 text-indigo-600 mb-2" />
              <div className="font-medium text-gray-900">Consumption Report</div>
              <div className="text-sm text-gray-500">
                {isDepartmentSpecific 
                  ? `Items consumed by ${userDepartment} department`
                  : 'Items consumed by department'
                }
              </div>
            </button>
            <button 
              onClick={() => router.push('/quick-reports?type=cost')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <DollarSign className="h-6 w-6 text-green-600 mb-2" />
              <div className="font-medium text-gray-900">Cost Analysis</div>
              <div className="text-sm text-gray-500">
                {isDepartmentSpecific 
                  ? `Detailed cost breakdown for ${userDepartment}`
                  : 'Detailed cost breakdown'
                }
              </div>
            </button>
            <button 
              onClick={() => router.push('/quick-reports?type=forecast')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <TrendingUp className="h-6 w-6 text-blue-600 mb-2" />
              <div className="text-lg font-medium text-gray-900">Forecast Report</div>
              <div className="text-sm text-gray-500">
                {isDepartmentSpecific 
                  ? `Demand forecasting for ${userDepartment}`
                  : 'Demand forecasting'
                }
              </div>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
