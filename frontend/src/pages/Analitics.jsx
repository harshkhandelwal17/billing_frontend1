import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, ShoppingCart, Calendar, 
  BarChart3, PieChart, Download, Filter, RefreshCw,
  ArrowUp, ArrowDown, Star, Clock, Users, Target,
  AlertTriangle, CheckCircle, Activity, CreditCard,
  Award, Zap, TrendingDown
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

  const StatCard = ({ title, value, change, changeType, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {change && (
            <div className={`flex items-center mt-3 text-sm font-medium ${
              changeType === 'increase' ? 'text-emerald-600' : 'text-red-500'
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
        <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-lg border-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-9 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="h-80 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Analytics Dashboard</h1>
          <p className="text-gray-600 text-lg">Track your restaurant's performance and insights</p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  // Calculate metrics based on selected date range
  const dailyData = analyticsData.dailyEarnings;
  const trendsData = analyticsData.salesTrends?.dailySales || [];
  const monthlyData = analyticsData.monthlyReport;
  
  // Calculate current period data based on dateRange selection
  const getCurrentPeriodData = () => {
    switch (dateRange) {
      case 'today':
        return {
          revenue: dailyData?.totalEarnings || 0,
          orders: dailyData?.totalBills || 0,
          averageOrder: dailyData?.averageBillValue || 0,
          period: "Today's"
        };
      case 'week':
        const weekRevenue = trendsData.slice(-7).reduce((sum, day) => sum + (day.earnings || 0), 0);
        const weekOrders = trendsData.slice(-7).reduce((sum, day) => sum + (day.orders || 0), 0);
        return {
          revenue: weekRevenue,
          orders: weekOrders,
          averageOrder: weekOrders > 0 ? weekRevenue / weekOrders : 0,
          period: "This Week's"
        };
      case 'month':
        return {
          revenue: monthlyData?.summary?.totalRevenue || 0,
          orders: monthlyData?.summary?.totalOrders || 0,
          averageOrder: monthlyData?.summary?.averageOrderValue || 0,
          period: "This Month's"
        };
      default:
        return {
          revenue: dailyData?.totalEarnings || 0,
          orders: dailyData?.totalBills || 0,
          averageOrder: dailyData?.averageBillValue || 0,
          period: "Today's"
        };
    }
  };

  const currentPeriodData = getCurrentPeriodData();

  // Calculate growth percentages
  const todayIndex = trendsData.length - 1;
  const yesterdayIndex = trendsData.length - 2;

  const revenueGrowth = yesterdayIndex >= 0 ? 
    ((trendsData[todayIndex]?.earnings - trendsData[yesterdayIndex]?.earnings) / trendsData[yesterdayIndex]?.earnings * 100).toFixed(1) : 0;
  
  const ordersGrowth = yesterdayIndex >= 0 ? 
    ((trendsData[todayIndex]?.orders - trendsData[yesterdayIndex]?.orders) / trendsData[yesterdayIndex]?.orders * 100).toFixed(1) : 0;

  // Find peak hour (only for daily view)
  const hourlyData = dailyData?.hourlyBreakdown || {};
  const peakHour = Object.entries(hourlyData).reduce((max, [hour, amount]) => 
    amount > (hourlyData[max] || 0) ? hour : max, '12');

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Enhanced Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Analytics Dashboard</h1>
            <p className="text-gray-600 text-lg">Track your restaurant's performance and insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 font-medium transition-all"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            
            <button
              onClick={fetchAnalyticsData}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="font-medium">Refresh</span>
            </button>
            
            <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl">
              <Download className="w-5 h-5" />
              <span className="font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title={`${currentPeriodData.period} Revenue`}
          value={`₹${currentPeriodData.revenue.toLocaleString()}`}
          change={dateRange === 'today' ? `${Math.abs(revenueGrowth)}% vs yesterday` : null}
          changeType={revenueGrowth >= 0 ? 'increase' : 'decrease'}
          subtitle={`From ${currentPeriodData.orders} orders`}
          icon={DollarSign}
          color="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700"
        />
        
        <StatCard
          title={`${currentPeriodData.period} Orders`}
          value={currentPeriodData.orders.toLocaleString()}
          change={dateRange === 'today' ? `${Math.abs(ordersGrowth)}% vs yesterday` : null}
          changeType={ordersGrowth >= 0 ? 'increase' : 'decrease'}
          subtitle="Orders completed"
          icon={ShoppingCart}
          color="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700"
        />
        
        <StatCard
          title="Average Order"
          value={`₹${currentPeriodData.averageOrder.toFixed(0)}`}
          subtitle="Per order value"
          icon={TrendingUp}
          color="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700"
        />
        
        <StatCard
          title={dateRange === 'today' ? "Peak Hour" : dateRange === 'week' ? "Weekly Growth" : "Monthly Target"}
          value={dateRange === 'today' ? `${peakHour}:00 - ${parseInt(peakHour) + 1}:00` : 
                 dateRange === 'week' ? `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}%` :
                 `₹${(monthlyData?.summary?.netProfit || 0).toLocaleString()}`}
          subtitle={dateRange === 'today' ? `₹${hourlyData[peakHour]?.toLocaleString() || '0'} earned` :
                   dateRange === 'week' ? "vs last week" :
                   "Net profit"}
          icon={dateRange === 'today' ? Clock : dateRange === 'week' ? TrendingUp : Target}
          color="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700"
        />
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Enhanced Sales Trends */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Sales Trends</h3>
              <p className="text-gray-600">Daily performance overview</p>
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
          
          <div className="h-80 flex items-end justify-between space-x-2 px-4">
            {trendsData?.map((day, index) => {
              const maxEarning = Math.max(...trendsData.map(d => d.earnings));
              const height = maxEarning > 0 ? (day.earnings / maxEarning) * 100 : 0;
              const isToday = index === trendsData.length - 1;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className={`text-xs font-medium mb-3 px-2 py-1 rounded-full ${
                    isToday ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                  }`}>
                    ₹{day.earnings?.toLocaleString()}
                  </div>
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer ${
                      isToday 
                        ? 'bg-gradient-to-t from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600' 
                        : 'bg-gradient-to-t from-blue-400 to-blue-300 hover:from-blue-500 hover:to-blue-400'
                    }`}
                    style={{ height: `${height}%`, minHeight: '12px' }}
                    title={`${day.date}: ₹${day.earnings?.toLocaleString()} (${day.orders} orders)`}
                  ></div>
                  <div className={`text-xs mt-3 font-medium ${
                    isToday ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced Payment Methods - Only show for daily */}
        {dateRange === 'today' ? (
          <div className="bg-white p-8 rounded-2xl shadow-lg border-0">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Methods</h3>
              <p className="text-gray-600">Payment distribution today</p>
            </div>
            
            <div className="space-y-6">
              {dailyData?.paymentBreakdown && Object.entries(dailyData.paymentBreakdown).map(([method, amount]) => {
                const total = Object.values(dailyData.paymentBreakdown).reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
                
                const methodColors = {
                  cash: 'from-green-500 to-green-600',
                  card: 'from-blue-500 to-blue-600', 
                  upi: 'from-purple-500 to-purple-600'
                };

                const methodIcons = {
                  cash: '💵',
                  card: '💳',
                  upi: '📱'
                };
                
                return (
                  <div key={method} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{methodIcons[method] || '💰'}</span>
                        <span className="text-lg font-semibold text-gray-800 capitalize">{method}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">₹{amount?.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{percentage}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`bg-gradient-to-r ${methodColors[method] || 'from-gray-500 to-gray-600'} h-3 rounded-full transition-all duration-500 shadow-sm`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Period Summary for Week/Month */
          <div className="bg-white p-8 rounded-2xl shadow-lg border-0">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {dateRange === 'week' ? 'Weekly' : 'Monthly'} Summary
              </h3>
              <p className="text-gray-600">
                {dateRange === 'week' ? 'Last 7 days' : 'This month'} performance overview
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-blue-700 font-medium mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-800">
                  ₹{currentPeriodData.revenue.toLocaleString()}
                </p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-green-700 font-medium mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-green-800">
                  {currentPeriodData.orders.toLocaleString()}
                </p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-purple-700 font-medium mb-1">Avg Order</p>
                <p className="text-2xl font-bold text-purple-800">
                  ₹{currentPeriodData.averageOrder.toFixed(0)}
                </p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-orange-700 font-medium mb-1">
                  {dateRange === 'week' ? 'Daily Avg' : 'Growth Rate'}
                </p>
                <p className="text-2xl font-bold text-orange-800">
                  {dateRange === 'week' 
                    ? `₹${(currentPeriodData.revenue / 7).toFixed(0)}`
                    : `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}%`
                  }
                </p>
              </div>
            </div>
            
            {/* Show trend for selected period */}
            <div className="mt-8">
              <h4 className="font-bold text-gray-800 mb-4 text-lg">
                {dateRange === 'week' ? 'Daily Breakdown' : 'Top Items'}
              </h4>
              {dateRange === 'week' ? (
                <div className="space-y-3">
                  {trendsData.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">₹{day.earnings?.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{day.orders} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {monthlyData?.topSellingItems?.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-800">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">₹{item.revenue?.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{item.quantity} sold</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Top Selling Items & Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Enhanced Top Selling Items */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border-0">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Top Selling Items</h3>
            <p className="text-gray-600">Best performers {dateRange}</p>
          </div>
          
          <div className="space-y-4">
            {analyticsData.topSelling?.topSellingItems?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-300 border-l-4 border-blue-500">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                    index === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                    'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`}>
                    {index < 3 ? <Award className="w-6 h-6" /> : `#${index + 1}`}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} sold • ₹{item.price} each • {item.orders} orders
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-xl">₹{item.totalRevenue?.toLocaleString()}</p>
                  <p className="text-sm text-green-600 font-medium">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Monthly Summary */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border-0">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Monthly Summary</h3>
            <p className="text-gray-600">This month's performance</p>
          </div>
          
          {analyticsData.monthlyReport && (
            <div className="space-y-8">
              {/* Enhanced Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-green-700 font-medium mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-800">
                    ₹{analyticsData.monthlyReport.summary.totalRevenue?.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {analyticsData.monthlyReport.summary.totalOrders?.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-purple-700 font-medium mb-1">Avg Order Value</p>
                  <p className="text-2xl font-bold text-purple-800">
                    ₹{analyticsData.monthlyReport.summary.averageOrderValue}
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-orange-700 font-medium mb-1">Net Profit</p>
                  <p className="text-2xl font-bold text-orange-800">
                    ₹{analyticsData.monthlyReport.summary.netProfit?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Top Monthly Items */}
              <div>
                <h4 className="font-bold text-gray-800 mb-4 text-lg">Top Items This Month</h4>
                <div className="space-y-3">
                  {analyticsData.monthlyReport.topSellingItems?.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-500' :
                          'bg-blue-500'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        {item.quantity} sold • ₹{item.revenue?.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Hourly Breakdown - Only show for daily */}
      {dateRange === 'today' && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border-0">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Hourly Sales Breakdown</h3>
            <p className="text-gray-600">Sales distribution throughout the day</p>
          </div>
          
          <div className="grid grid-cols-12 gap-3">
            {Object.entries(hourlyData).map(([hour, amount]) => {
              const maxAmount = Math.max(...Object.values(hourlyData));
              const height = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
              const isPeakHour = hour === peakHour;
              
              return (
                <div key={hour} className="flex flex-col items-center group">
                  <div className={`text-xs font-medium mb-3 px-2 py-1 rounded-full transition-colors ${
                    isPeakHour ? 'bg-green-100 text-green-700' : 'text-gray-600 group-hover:text-green-600'
                  }`}>
                    ₹{amount?.toLocaleString()}
                  </div>
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer ${
                      isPeakHour 
                        ? 'bg-gradient-to-t from-green-600 to-green-500 shadow-lg' 
                        : 'bg-gradient-to-t from-green-400 to-green-300 hover:from-green-500 hover:to-green-400'
                    }`}
                    style={{ height: `${Math.max(height, 8)}px`, maxHeight: '120px' }}
                    title={`${hour}:00 - ₹${amount?.toLocaleString()}`}
                  ></div>
                  <div className={`text-xs mt-3 font-medium ${
                    isPeakHour ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {hour}h
                  </div>
                  {isPeakHour && (
                    <div className="mt-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;