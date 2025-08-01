import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Download, Calendar, 
  Receipt, DollarSign, Clock, User, Phone,
  ChevronLeft, ChevronRight, X, Printer,
  CreditCard, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

const BillsHistoryPage = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);

  const API_BASE_URL = 'http://localhost:4000/api';

  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchBills();
  }, [currentPage, statusFilter, paymentFilter, dateRange]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentFilter !== 'all' && { paymentMethod: paymentFilter }),
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });

      const data = await apiCall(`/bills?${params}`);
      setBills(data.bills || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewBillDetails = async (billId) => {
    try {
      const data = await apiCall(`/bills/${billId}`);
      setSelectedBill(data);
      setShowBillModal(true);
    } catch (error) {
      alert('Failed to fetch bill details: ' + error.message);
    }
  };

  const printBill = async (billId) => {
    try {
      await apiCall(`/printer/print/${billId}`, { method: 'POST' });
      alert('Bill sent to printer successfully!');
    } catch (error) {
      alert('Failed to print bill: ' + error.message);
    }
  };

  const exportBills = () => {
    // This would generate a CSV/PDF export
    alert('Export functionality would be implemented here');
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Receipt className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'cash':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  const BillCard = ({ bill }) => (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Receipt className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{bill.billNumber}</h3>
            <p className="text-sm text-gray-600">{bill.customerName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(bill.status)}
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(bill.status)}`}>
            {bill.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>{new Date(bill.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            {getPaymentIcon(bill.paymentMethod)}
            <span className="ml-2 capitalize">{bill.paymentMethod}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="text-xl font-bold text-green-600">₹{bill.total.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {bill.items?.length || 0} items • 
          {bill.customerPhone && (
            <span className="ml-1">{bill.customerPhone}</span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => viewBillDetails(bill._id)}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
          <button
            onClick={() => printBill(bill._id)}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );

  const BillDetailsModal = ({ bill, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Bill Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Bill Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Bill Number</p>
                <p className="text-lg font-bold text-gray-800">{bill.billNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date & Time</p>
                <p className="text-lg font-bold text-gray-800">
                  {new Date(bill.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Customer</p>
                <p className="text-lg font-bold text-gray-800">{bill.customerName}</p>
                {bill.customerPhone && (
                  <p className="text-sm text-gray-600">{bill.customerPhone}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Method</p>
                <div className="flex items-center space-x-2">
                  {getPaymentIcon(bill.paymentMethod)}
                  <span className="text-lg font-bold text-gray-800 capitalize">
                    {bill.paymentMethod}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Items</h3>
            <div className="space-y-3">
              {bill.items?.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-600">₹{item.price} × {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">₹{item.total.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>₹{bill.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (18%):</span>
                <span>₹{bill.gst?.toFixed(2) || '0.00'}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount:</span>
                  <span>-₹{bill.discount?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span>₹{bill.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => printBill(bill._id)}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-200 rounded flex-1"></div>
            <div className="h-8 bg-gray-200 rounded flex-1"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bills History</h1>
          <p className="text-gray-600">View and manage all restaurant bills</p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Bills History</h1>
            <p className="text-gray-600">View and manage all restaurant bills</p>
          </div>
          <button
            onClick={exportBills}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export Bills</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payments</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="online">Online</option>
            </select>

            {/* Date Range */}
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bills</p>
              <p className="text-2xl font-bold text-gray-800">{filteredBills.length}</p>
            </div>
            <Receipt className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{filteredBills.reduce((sum, bill) => sum + bill.total, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Bill</p>
              <p className="text-2xl font-bold text-purple-600">
                ₹{filteredBills.length > 0 
                  ? Math.round(filteredBills.reduce((sum, bill) => sum + bill.total, 0) / filteredBills.length)
                  : 0
                }
              </p>
            </div>
            <Receipt className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid Bills</p>
              <p className="text-2xl font-bold text-blue-600">
                {filteredBills.filter(bill => bill.status === 'paid').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Bills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredBills.map(bill => (
          <BillCard key={bill._id} bill={bill} />
        ))}
      </div>

      {/* Empty State */}
      {filteredBills.length === 0 && !loading && (
        <div className="text-center py-12">
          <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No bills found</p>
          <p className="text-gray-400">Try adjusting your search filters</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex space-x-2">
            {[...Array(Math.min(5, totalPages))].map((_, index) => {
              const pageNumber = currentPage <= 3 ? index + 1 : currentPage - 2 + index;
              if (pageNumber > totalPages) return null;
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    currentPage === pageNumber
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bill Details Modal */}
      {showBillModal && selectedBill && (
        <BillDetailsModal
          bill={selectedBill}
          onClose={() => {
            setShowBillModal(false);
            setSelectedBill(null);
          }}
        />
      )}
    </div>
  );
};

export default BillsHistoryPage;