'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, AlertTriangle, Package, DollarSign, Calendar, RefreshCw } from 'lucide-react'
import { ExportButton } from '@/components/ui/export'

interface ReportData {
  totalItems: number
  totalCost: number
  lowStockAlerts: number
  topConsumingDepartments: Array<{
    department: string
    totalConsumed: number
    totalCost: number
  }>
  mostConsumedItems: Array<{
    itemName: string
    totalConsumed: number
    totalCost: number
    unit: string
  }>
  costByCategory: Array<{
    category: string
    totalCost: number
    itemCount: number
  }>
  costByDepartment: Array<{
    department: string
    totalCost: number
    orderCount: number
  }>
  predictedDemand: Array<{
    itemName: string
    currentStock: number
    predictedDemand: number
    recommendedOrder: number
    unit: string
  }>
  lowStockItems: Array<{
    itemName: string
    currentStock: number
    minimumStock: number
    unit: string
    category: string
  }>
}

type ReportPeriod = 7 | 30 | 90 | 365
type ActiveTab = 'consumption' | 'cost' | 'forecast'

export default function QuickReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>(30)
  const [activeTab, setActiveTab] = useState<ActiveTab>('consumption')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchReportData = async (period: ReportPeriod) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reports/quick?period=${period}`)
      if (response.ok) {
        const apiData = await response.json()
        // Transform API response to match expected data structure
        const transformedData = {
          totalItems: apiData.consumption?.totalItems || 0,
          totalCost: apiData.consumption?.periodTotalCost || 0,
          lowStockAlerts: apiData.forecast?.lowStockItems?.length || 0,
          topConsumingDepartments: apiData.consumption?.topDepartments?.map((dept: { department: string; consumed: number; cost: number }) => ({
            department: dept.department,
            totalConsumed: dept.consumed,
            totalCost: dept.cost
          })) || [],
          mostConsumedItems: apiData.consumption?.topItems?.map((item: { name: string; consumed: number; cost: number; unit: string }) => ({
            itemName: item.name,
            totalConsumed: item.consumed,
            totalCost: item.cost,
            unit: item.unit
          })) || [],
          costByCategory: apiData.costAnalysis?.topCategories?.map((cat: { category: string; amount: number; itemCount: number }) => ({
            category: cat.category,
            totalCost: cat.amount,
            itemCount: cat.itemCount || 0
          })) || [],
          costByDepartment: apiData.costAnalysis?.topDepartments?.map((dept: { department: string; amount: number; orderCount: number }) => ({
            department: dept.department,
            totalCost: dept.amount,
            orderCount: dept.orderCount || 0
          })) || [],
          predictedDemand: apiData.forecast?.items?.map((forecast: { item?: { name: string; unit: string; currentStock?: number; minStock?: number }; predictedDemand?: number }) => ({
            itemName: forecast.item?.name || 'Unknown Item',
            currentStock: forecast.item?.currentStock || 0,
            predictedDemand: forecast.predictedDemand || 0,
            recommendedOrder: Math.max(0, (forecast.predictedDemand || 0) - (forecast.item?.currentStock || 0)),
            unit: forecast.item?.unit || ''
          })) || [],
          lowStockItems: apiData.forecast?.lowStockItems?.map((item: { name: string; unit: string; category?: { name: string }; currentStock: number; minStock: number }) => ({
            itemName: item.name,
            currentStock: item.currentStock,
            minimumStock: item.minStock,
            unit: item.unit,
            category: item.category?.name || 'Uncategorized'
          })) || []
        }
        setReportData(transformedData)
        setLastUpdated(new Date())
      } else if (response.status === 401) {
        console.error('Authentication required. Please log in to view reports.')
        // Could redirect to login page here if needed
        // window.location.href = '/auth/signin'
      } else if (response.status === 403) {
        console.error('You do not have permission to view Quick Reports.')
      } else {
        console.error('Failed to fetch report data:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData(selectedPeriod)
  }, [selectedPeriod])

  const handleRefresh = () => {
    fetchReportData(selectedPeriod)
  }

  const periodOptions = [
    { value: 7, label: 'Last 7 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 90 days' },
    { value: 365, label: 'Last year' }
  ]

  const getExportData = () => {
    if (!reportData) return []
    
    switch (activeTab) {
      case 'consumption':
        // For consumption tab, we'll export both departments and items
        // Let's combine them into a single array with a type indicator
        const consumptionData = [
          ...(reportData.topConsumingDepartments || []).map(dept => ({
            type: 'Department',
            'Name': dept.department,
            'Total Consumed': dept.totalConsumed,
            'Total Cost': dept.totalCost
          })),
          ...(reportData.mostConsumedItems || []).map(item => ({
            type: 'Item',
            'Name': item.itemName,
            'Total Consumed': item.totalConsumed,
            'Total Cost': item.totalCost,
            'Unit': item.unit
          }))
        ]
        return consumptionData
      case 'cost':
        // For cost tab, we'll export both categories and departments
        const costData = [
          ...(reportData.costByCategory || []).map(cat => ({
            type: 'Category',
            'Name': cat.category,
            'Total Cost': cat.totalCost,
            'Item Count': cat.itemCount
          })),
          ...(reportData.costByDepartment || []).map(dept => ({
            type: 'Department',
            'Name': dept.department,
            'Total Cost': dept.totalCost,
            'Order Count': dept.orderCount
          }))
        ]
        return costData
      case 'forecast':
        // For forecast tab, we'll export both predictions and low stock items
        const forecastData = [
          ...(reportData.predictedDemand || []).map(pred => ({
            type: 'Prediction',
            'Item Name': pred.itemName,
            'Current Stock': pred.currentStock,
            'Predicted Demand': pred.predictedDemand,
            'Recommended Order': pred.recommendedOrder,
            'Unit': pred.unit
          })),
          ...(reportData.lowStockItems || []).map(item => ({
            type: 'Low Stock',
            'Item Name': item.itemName,
            'Current Stock': item.currentStock,
            'Minimum Stock': item.minimumStock,
            'Unit': item.unit,
            'Category': item.category
          }))
        ]
        return forecastData
      default:
        return []
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string
    value: string | number
    icon: any
    color: string
    subtitle?: string
  }) => (
    <div className="bg-white p-6 rounded-lg shadow border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  )

  const TabButton = ({ tab, label, icon: Icon, isActive, onClick }: {
    tab: ActiveTab
    label: string
    icon: any
    isActive: boolean
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )

  const DataTable = ({ title, data, columns }: {
    title: string
    data: any[]
    columns: Array<{ key: string; label: string; format?: (value: any) => string }>
  }) => (
    <div className="bg-white rounded-lg shadow border">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.format ? column.format(row[column.key]) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading reports...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quick Reports</h1>
            <p className="text-gray-600">Overview of inventory consumption, costs, and forecasts</p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <ExportButton
              data={getExportData()}
              filename={`${activeTab}-report-${selectedPeriod}days`}
              variant="primary"
            />
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Period:</span>
            </div>
            <div className="flex gap-2">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedPeriod(option.value as ReportPeriod)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedPeriod === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {reportData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Items Consumed"
              value={reportData.totalItems.toLocaleString()}
              icon={Package}
              color="text-blue-600"
              subtitle={`In the last ${selectedPeriod} days`}
            />
            <StatCard
              title="Total Cost"
              value={`$${reportData.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              color="text-green-600"
              subtitle={`In the last ${selectedPeriod} days`}
            />
            <StatCard
              title="Low Stock Alerts"
              value={reportData.lowStockAlerts}
              icon={AlertTriangle}
              color="text-red-600"
              subtitle="Items below minimum stock"
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <TabButton
            tab="consumption"
            label="Consumption Report"
            icon={BarChart3}
            isActive={activeTab === 'consumption'}
            onClick={() => setActiveTab('consumption')}
          />
          <TabButton
            tab="cost"
            label="Cost Analysis"
            icon={DollarSign}
            isActive={activeTab === 'cost'}
            onClick={() => setActiveTab('cost')}
          />
          <TabButton
            tab="forecast"
            label="Forecast Report"
            icon={TrendingUp}
            isActive={activeTab === 'forecast'}
            onClick={() => setActiveTab('forecast')}
          />
        </div>

        {/* Tab Content */}
        {reportData && (
          <div className="space-y-6">
            {activeTab === 'consumption' && (
              <>
                <DataTable
                  title="Top Consuming Departments"
                  data={reportData.topConsumingDepartments}
                  columns={[
                    { key: 'department', label: 'Department' },
                    { key: 'totalConsumed', label: 'Total Consumed', format: (value) => value.toLocaleString() },
                    { key: 'totalCost', label: 'Total Cost', format: (value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` }
                  ]}
                />
                <DataTable
                  title="Most Consumed Items"
                  data={reportData.mostConsumedItems}
                  columns={[
                    { key: 'itemName', label: 'Item Name' },
                    { key: 'totalConsumed', label: 'Total Consumed', format: (value) => value.toLocaleString() },
                    { key: 'unit', label: 'Unit' },
                    { key: 'totalCost', label: 'Total Cost', format: (value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` }
                  ]}
                />
              </>
            )}

            {activeTab === 'cost' && (
              <>
                <DataTable
                  title="Cost by Category"
                  data={reportData.costByCategory}
                  columns={[
                    { key: 'category', label: 'Category' },
                    { key: 'itemCount', label: 'Item Count', format: (value) => value.toLocaleString() },
                    { key: 'totalCost', label: 'Total Cost', format: (value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` }
                  ]}
                />
                <DataTable
                  title="Cost by Department"
                  data={reportData.costByDepartment}
                  columns={[
                    { key: 'department', label: 'Department' },
                    { key: 'orderCount', label: 'Order Count', format: (value) => value.toLocaleString() },
                    { key: 'totalCost', label: 'Total Cost', format: (value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` }
                  ]}
                />
              </>
            )}

            {activeTab === 'forecast' && (
              <>
                <DataTable
                  title="Predicted Demand"
                  data={reportData.predictedDemand}
                  columns={[
                    { key: 'itemName', label: 'Item Name' },
                    { key: 'currentStock', label: 'Current Stock', format: (value) => value.toLocaleString() },
                    { key: 'predictedDemand', label: 'Predicted Demand', format: (value) => value.toLocaleString() },
                    { key: 'recommendedOrder', label: 'Recommended Order', format: (value) => value.toLocaleString() },
                    { key: 'unit', label: 'Unit' }
                  ]}
                />
                <DataTable
                  title="Low Stock Alerts"
                  data={reportData.lowStockItems}
                  columns={[
                    { key: 'itemName', label: 'Item Name' },
                    { key: 'category', label: 'Category' },
                    { key: 'currentStock', label: 'Current Stock', format: (value) => value.toLocaleString() },
                    { key: 'minimumStock', label: 'Minimum Stock', format: (value) => value.toLocaleString() },
                    { key: 'unit', label: 'Unit' }
                  ]}
                />
              </>
            )}
          </div>
        )}

        {!reportData && !isLoading && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No report data available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Unable to load report data. Please try refreshing the page.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}