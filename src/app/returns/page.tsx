'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Pagination } from '@/components/ui/pagination';

interface Return {
  id: string;
  returnNumber: string;
  quantity: number;
  reason: string;
  condition: string;
  description?: string;
  status: string;
  returnDate: string;
  processedDate?: string;
  refundAmount?: number;
  item: {
    name: string;
    reference: string;
    unit: string;
  };
  requester: {
    name: string;
    email: string;
  };
  processor?: {
    name: string;
    email: string;
  };
}

interface Item {
  id: string;
  name: string;
  reference: string;
  unit: string;
  currentStock: number;
}

const RETURN_REASONS = [
  { value: 'DEFECTIVE', label: 'Defective' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'WRONG_ITEM', label: 'Wrong Item' },
  { value: 'EXCESS_QUANTITY', label: 'Excess Quantity' },
  { value: 'NOT_NEEDED', label: 'Not Needed' },
  { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
  { value: 'OTHER', label: 'Other' }
];

const ITEM_CONDITIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'UNUSABLE', label: 'Unusable' }
];

const RETURN_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'APPROVED', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'PROCESSED', label: 'Processed', color: 'bg-blue-100 text-blue-800' },
  { value: 'REFUNDED', label: 'Refunded', color: 'bg-purple-100 text-purple-800' }
];

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const [newReturn, setNewReturn] = useState({
    itemId: '',
    quantity: '',
    reason: '',
    condition: '',
    description: ''
  });

  const [processData, setProcessData] = useState({
    status: '',
    refundAmount: '',
    description: ''
  });

  useEffect(() => {
    fetchReturns();
    fetchItems();
  }, [statusFilter, reasonFilter]);

  const fetchReturns = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      if (statusFilter) params.append('status', statusFilter);
      if (reasonFilter) params.append('reason', reasonFilter);

      const response = await fetch(`/api/returns?${params}`);
      if (!response.ok) throw new Error('Failed to fetch returns');

      const data = await response.json();
      setReturns(data.returns);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Failed to fetch returns');
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

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newReturn)
      });
      
      if (!response.ok) throw new Error('Failed to create return');
      
      toast.success('Return created successfully');
      setShowCreateModal(false);
      setNewReturn({
        itemId: '',
        quantity: '',
        reason: '',
        condition: '',
        description: ''
      });
      fetchReturns();
    } catch (error) {
      console.error('Error creating return:', error);
      toast.error('Failed to create return');
    }
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReturn) return;
    
    try {
      const response = await fetch(`/api/returns/${selectedReturn.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processData)
      });
      
      if (!response.ok) throw new Error('Failed to process return');
      
      toast.success('Return processed successfully');
      setShowProcessModal(false);
      setSelectedReturn(null);
      setProcessData({
        status: '',
        refundAmount: '',
        description: ''
      });
      fetchReturns();
    } catch (error) {
      console.error('Error processing return:', error);
      toast.error('Failed to process return');
    }
  };

  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = returnItem.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnItem.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnItem.requester.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const statusConfig = RETURN_STATUSES.find(s => s.value === status);
    return statusConfig?.color || 'bg-gray-100 text-gray-800';
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
        <h1 className="text-2xl font-bold text-gray-900">Returns Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Return
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search returns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {RETURN_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
          
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Reasons</option>
            {RETURN_REASONS.map(reason => (
              <option key={reason.value} value={reason.value}>{reason.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Return #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Condition
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requester
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredReturns.map((returnItem) => (
              <tr key={returnItem.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {returnItem.returnNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{returnItem.item.name}</div>
                    <div className="text-sm text-gray-500">{returnItem.item.reference}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {returnItem.quantity} {returnItem.item.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {RETURN_REASONS.find(r => r.value === returnItem.reason)?.label || returnItem.reason}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {ITEM_CONDITIONS.find(c => c.value === returnItem.condition)?.label || returnItem.condition}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(returnItem.status)}`}>
                    {RETURN_STATUSES.find(s => s.value === returnItem.status)?.label || returnItem.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {returnItem.requester.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(returnItem.returnDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {returnItem.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        setSelectedReturn(returnItem);
                        setShowProcessModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Process
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredReturns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No returns found</p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={fetchReturns}
          showInfo={true}
        />
      </div>

      {/* Create Return Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create Return</h3>
            <form onSubmit={handleCreateReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <select
                  value={newReturn.itemId}
                  onChange={(e) => setNewReturn({ ...newReturn, itemId: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={newReturn.quantity}
                  onChange={(e) => setNewReturn({ ...newReturn, quantity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  value={newReturn.reason}
                  onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a reason</option>
                  {RETURN_REASONS.map(reason => (
                    <option key={reason.value} value={reason.value}>{reason.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  value={newReturn.condition}
                  onChange={(e) => setNewReturn({ ...newReturn, condition: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select condition</option>
                  {ITEM_CONDITIONS.map(condition => (
                    <option key={condition.value} value={condition.value}>{condition.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={newReturn.description}
                  onChange={(e) => setNewReturn({ ...newReturn, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Additional details about the return..."
                />
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
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Create Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Process Return Modal */}
      {showProcessModal && selectedReturn && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Process Return</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Return: {selectedReturn.returnNumber}</p>
              <p className="text-sm text-gray-600">Item: {selectedReturn.item.name}</p>
              <p className="text-sm text-gray-600">Quantity: {selectedReturn.quantity} {selectedReturn.item.unit}</p>
            </div>
            
            <form onSubmit={handleProcessReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={processData.status}
                  onChange={(e) => setProcessData({ ...processData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select status</option>
                  <option value="APPROVED">Approve</option>
                  <option value="REJECTED">Reject</option>
                  <option value="PROCESSED">Process</option>
                  <option value="REFUNDED">Refund</option>
                </select>
              </div>
              
              {(processData.status === 'REFUNDED' || processData.status === 'PROCESSED') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={processData.refundAmount}
                    onChange={(e) => setProcessData({ ...processData, refundAmount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={processData.description}
                  onChange={(e) => setProcessData({ ...processData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Processing notes..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowProcessModal(false);
                    setSelectedReturn(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Process Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}