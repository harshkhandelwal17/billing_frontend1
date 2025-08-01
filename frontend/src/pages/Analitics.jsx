import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, ShoppingCart, Calendar, 
  BarChart3, PieChart, Download, Filter, RefreshCw,
  ArrowUp, ArrowDown, Star, Clock, Users
} from 'lucide-react';

const AnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState({
    dailyEarnings: null,
    topSelling: null,
    salesTrends: null,
    monthlyReport: null
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const [selectedPeriod, setSelectedPeriod] = useState('7');

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
    fetchAnalyticsData();
  }, [dateRange, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [dailyEarnings, topSelling, salesTrends, monthlyReport] = await Promise.all([
        apiCall('/analytics/daily-earnings'),
        apiCall(`/analytics/top-selling?period=${dateRange}&limit=10`),
        apiCall(`/analytics/sales-trends?days=${selectedPeriod}`),
        apiCall('/analytics/monthly-report')
      ]);

      setAnalyticsData({
        dailyEarnings,
        topSelling,
        salesTrends,
        monthlyReport
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, changeType, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'increase' ? (
                <ArrowUp className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDown className="w-4 h-4 mr-1" />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your restaurant's performance and insights</p>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Track your restaurant's performance and insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            
            <button
              onClick={fetchAnalyticsData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Revenue"
          value={`₹${analyticsData.dailyEarnings?.totalEarnings?.toLocaleString() || '0'}`}
          change="12% vs yesterday"
          changeType="increase"
          icon={DollarSign}
          color="bg-gradient-to-r from-green-500 to-green-600"
        />
        
        <StatCard
          title="Total Orders"
          value={analyticsData.dailyEarnings?.totalBills || 0}
          change="8% vs yesterday"
          changeType="increase"
          icon={ShoppingCart}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        
        <StatCard
          title="Average Order"
          value={`₹${analyticsData.dailyEarnings?.averageBillValue?.toFixed(0) || '0'}`}
          change="5% vs yesterday"
          changeType="decrease"
          icon={TrendingUp}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        
        <StatCard
          title="Peak Hour"
          value="7-9 PM"
          change="Most busy time"
          icon={Clock}
          color="bg-gradient-to-r from-orange-500 to-orange-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trends */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Sales Trends</h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
          
          <div className="h-64 flex items-end justify-between space-x-2">
            {analyticsData.salesTrends?.dailySales?.map((day, index) => {
              const maxEarning = Math.max(...analyticsData.salesTrends.dailySales.map(d => d.earnings));
              const height = (day.earnings / maxEarning) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="text-xs text-gray-600 mb-2">₹{day.earnings}</div>
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-md hover:from-blue-600 hover:to-blue-700 transition-colors cursor-pointer"
                    style={{ height: `${height}%`, minHeight: '8px' }}
                    title={`${day.date}: ₹${day.earnings} (${day.orders} orders)`}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-45">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Payment Methods</h3>
          
          <div className="space-y-4">
            {analyticsData.dailyEarnings?.paymentBreakdown && Object.entries(analyticsData.dailyEarnings.paymentBreakdown).map(([method, amount]) => {
              const total = Object.values(analyticsData.dailyEarnings.paymentBreakdown).reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
              
              return (
                <div key={method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">{method}</span>
                    <span className="text-sm text-gray-600">₹{amount.toLocaleString()} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Selling Items & Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Selling Items */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Top Selling Items</h3>
          
          <div className="space-y-4">
            {analyticsData.topSelling?.topSellingItems?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.quantity} sold • ₹{item.price} each</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{item.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{item.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Monthly Summary</h3>
          
          {analyticsData.monthlyReport && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-xl font-bold text-green-600">
                    ₹{analyticsData.monthlyReport.summary.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-xl font-bold text-blue-600">
                    {analyticsData.monthlyReport.summary.totalOrders}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                  <p className="text-xl font-bold text-purple-600">
                    ₹{analyticsData.monthlyReport.summary.averageOrderValue}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className="text-xl font-bold text-orange-600">
                    ₹{analyticsData.monthlyReport.summary.netProfit.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Top Monthly Items */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Top Items This Month</h4>
                <div className="space-y-2">
                  {analyticsData.monthlyReport.topSellingItems.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.quantity} sold • ₹{item.revenue.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hourly Breakdown */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Hourly Sales Breakdown</h3>
        
        <div className="grid grid-cols-12 gap-2">
          {analyticsData.dailyEarnings?.hourlyBreakdown && Object.entries(analyticsData.dailyEarnings.hourlyBreakdown).map(([hour, amount]) => {
            const maxAmount = Math.max(...Object.values(analyticsData.dailyEarnings.hourlyBreakdown));
            const height = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
            
            return (
              <div key={hour} className="flex flex-col items-center">
                <div className="text-xs text-gray-600 mb-2">₹{amount}</div>
                <div 
                  className="w-full bg-gradient-to-t from-green-500 to-green-600 rounded-t-md hover:from-green-600 hover:to-green-700 transition-colors cursor-pointer"
                  style={{ height: `${height}px`, minHeight: '4px', maxHeight: '80px' }}
                  title={`${hour}:00 - ₹${amount}`}
                ></div>
                <div className="text-xs text-gray-500 mt-2">{hour}h</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;