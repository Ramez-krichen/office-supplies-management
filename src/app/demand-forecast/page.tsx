'use client';

import { useState, useEffect } from 'react';
import { ChartBarIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Pagination } from '@/components/ui/pagination';

interface DemandForecast {
  id: string;
  period: string;
  periodType: string;
  predictedDemand: number;
  actualDemand?: number;
  confidence: number;
  algorithm: string;
  factors?: string;
  createdAt: string;
  item: {
    name: string;
    reference: string;
    unit: string;
  };
}

interface Item {
  id: string;
  name: string;
  reference: string;
  unit: string;
  currentStock: number;
  minStock: number;
}

const PERIOD_TYPES = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' }
];

const ALGORITHMS = [
  { value: 'MOVING_AVERAGE', label: 'Moving Average' },
  { value: 'LINEAR_TREND', label: 'Linear Trend' }
];

export default function DemandForecastPage() {
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [periodTypeFilter, setPeriodTypeFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const [newForecast, setNewForecast] = useState({
    itemId: '',
    periodType: 'MONTHLY',
    algorithm: 'MOVING_AVERAGE'
  });

  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchForecasts();
    fetchItems();
  }, [periodTypeFilter, itemFilter]);

  const fetchForecasts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      if (periodTypeFilter) params.append('periodType', periodTypeFilter);
      if (itemFilter) params.append('itemId', itemFilter);

      const response = await fetch(`/api/demand-forecast?${params}`);
      if (!response.ok) throw new Error('Failed to fetch forecasts');

      const data = await response.json();
      setForecasts(data.forecasts);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      toast.error('Failed to fetch forecasts');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (!response.ok) throw new Error('Failed to fetch items');
      
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleGenerateForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    
    try {
      const response = await fetch('/api/demand-forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newForecast)
      });
      
      if (!response.ok) throw new Error('Failed to generate forecast');
      
      toast.success('Forecast generated successfully');
      setShowCreateModal(false);
      setNewForecast({
        itemId: '',
        periodType: 'MONTHLY',
        algorithm: 'MOVING_AVERAGE'
      });
      fetchForecasts();
    } catch (error) {
      console.error('Error generating forecast:', error);
      toast.error('Failed to generate forecast');
    } finally {
      setGenerating(false);
    }
  };

  const generateBulkForecasts = async () => {
    setGenerating(true);
    
    try {
      // Generate forecasts for all items
      const promises = items.slice(0, 10).map(item => // Limit to first 10 items to avoid overwhelming
        fetch('/api/demand-forecast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            itemId: item.id,
            periodType: 'MONTHLY',
            algorithm: 'MOVING_AVERAGE'
          })
        })
      );
      
      await Promise.all(promises);
      toast.success('Bulk forecasts generated successfully');
      fetchForecasts();
    } catch (error) {
      console.error('Error generating bulk forecasts:', error);
      toast.error('Failed to generate bulk forecasts');
    } finally {
      setGenerating(false);
    }
  };

  const filteredForecasts = forecasts.filter(forecast => {
    const matchesSearch = forecast.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         forecast.item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         forecast.period.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const getStockStatus = (item: Item, predictedDemand: number) => {
    const stockRatio = item.currentStock / Math.max(predictedDemand, 1);
    if (stockRatio < 0.5) return { label: 'Critical', color: 'text-red-600' };
    if (stockRatio < 1) return { label: 'Low', color: 'text-yellow-600' };
    if (stockRatio < 2) return { label: 'Adequate', color: 'text-green-600' };
    return { label: 'High', color: 'text-blue-600' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Demand Forecasting</h1>
        <div className="flex space-x-3">
          <button
            onClick={generateBulkForecasts}
            disabled={generating}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <ChartBarIcon className="h-5 w-5" />
            {generating ? 'Generating...' : 'Generate All'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Generate Forecast
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Forecasts</p>
              <p className="text-2xl font-semibold text-gray-900">{forecasts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold">H</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">High Confidence</p>
              <p className="text-2xl font-semibold text-gray-900">
                {forecasts.filter(f => f.confidence >= 0.8).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">M</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Medium Confidence</p>
              <p className="text-2xl font-semibold text-gray-900">
                {forecasts.filter(f => f.confidence >= 0.6 && f.confidence < 0.8).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-semibold">L</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Confidence</p>
              <p className="text-2xl font-semibold text-gray-900">
                {forecasts.filter(f => f.confidence < 0.6).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search forecasts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={periodTypeFilter}
            onChange={(e) => setPeriodTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Period Types</option>
            {PERIOD_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          
          <select
            value={itemFilter}
            onChange={(e) => setItemFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Items</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.reference})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Forecasts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Predicted Demand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Algorithm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Generated
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredForecasts.map((forecast) => {
              const item = items.find(i => i.id === forecast.item.id) || {
                currentStock: 0,
                minStock: 0
              } as Item;
              const stockStatus = getStockStatus(item, forecast.predictedDemand);
              
              return (
                <tr key={forecast.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{forecast.item.name}</div>
                      <div className="text-sm text-gray-500">{forecast.item.reference}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{forecast.period}</div>
                      <div className="text-sm text-gray-500">
                        {PERIOD_TYPES.find(t => t.value === forecast.periodType)?.label}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-semibold">{forecast.predictedDemand}</span> {forecast.item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.currentStock} {forecast.item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${getConfidenceColor(forecast.confidence)}`}>
                        {getConfidenceLabel(forecast.confidence)}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({Math.round(forecast.confidence * 100)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ALGORITHMS.find(a => a.value === forecast.algorithm)?.label || forecast.algorithm}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(forecast.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredForecasts.length === 0 && (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No forecasts</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by generating your first demand forecast.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Generate Forecast
              </button>
            </div>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={fetchForecasts}
          showInfo={true}
        />
      </div>

      {/* Generate Forecast Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Generate Demand Forecast</h3>
            <form onSubmit={handleGenerateForecast} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <select
                  value={newForecast.itemId}
                  onChange={(e) => setNewForecast({ ...newForecast, itemId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select an item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.reference})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period Type</label>
                <select
                  value={newForecast.periodType}
                  onChange={(e) => setNewForecast({ ...newForecast, periodType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {PERIOD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Algorithm</label>
                <select
                  value={newForecast.algorithm}
                  onChange={(e) => setNewForecast({ ...newForecast, algorithm: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {ALGORITHMS.map(algorithm => (
                    <option key={algorithm.value} value={algorithm.value}>{algorithm.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The forecast will be generated based on historical stock movement data.
                  More historical data leads to better accuracy.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate Forecast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}