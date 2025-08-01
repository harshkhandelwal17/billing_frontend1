import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, UserCheck, AlertCircle, 
  Calendar, Clock, Users, Receipt, RefreshCw,
  ArrowUp, ArrowDown, Activity, BarChart3,
  ShoppingCart, Package, Star, Zap, Target,
  TrendingDown, Eye, EyeOff, Filter, Download,
  MoreVertical, Settings, Bell, Search, CheckCircle
} from 'lucide-react';
import { useApp } from '../App';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardPage = () => {
  const { apiCall, showToast } = useApp();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('today');
  const [salesTrends, setSalesTrends] = useState(null);
  const [topItems, setTopItems] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchSalesTrends();
    fetchTopItems();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/analytics/dashboard');
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesTrends = async () => {
    try {
      const days = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : 30;
      const data = await apiCall(`/analytics/sales-trends?days=${days}`);
      setSalesTrends(data);
    } catch (error) {
      console.error('Failed to fetch sales trends:', error);
      showToast('Failed to load sales trends', 'error');
    }
  };

  const fetchTopItems = async () => {
    try {
      const period = timeRange === 'today' ? 'today' : timeRange === 'week' ? 'week' : 'month';
      const data = await apiCall(`/analytics/top-selling?period=${period}&limit=5`);
      setTopItems(data.topSellingItems || []);
    } catch (error) {
      console.error('Failed to fetch top items:', error);
      showToast('Failed to load top items', 'error');
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchSalesTrends(),
        fetchTopItems()
      ]);
      showToast('Dashboard data refreshed', 'success');
    } catch (error) {
      showToast('Failed to refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Enhanced Stat Card Component
  const StatCard = ({ title, value, icon: Icon, color, change, changeType, subtitle }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {change && (
              <div className={`flex items-center text-sm font-semibold ${
                changeType === 'increase' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {changeType === 'increase' ? (
                  <ArrowUp className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDown className="w-4 h-4 mr-1" />
                )}
                <span>{change}%</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  );

  // Revenue Chart Component with real data
  const RevenueChart = () => {
    const chartData = useMemo(() => {
      if (!salesTrends?.dailySales) return null;

      return {
        labels: salesTrends.dailySales.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-IN', { 
            month: 'short', 
            day: 'numeric' 
          });
        }),
        datasets: [
          {
            label: 'Revenue',
            data: salesTrends.dailySales.map(item => item.earnings),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          }
        ]
      };
    }, [salesTrends]);

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#3B82F6',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `Revenue: ₹${context.parsed.y.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          ticks: { 
            color: '#6B7280',
            callback: function(value) {
              return '₹' + value.toLocaleString();
            }
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#6B7280' }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };

    if (!chartData) return null;

    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Revenue Trend</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      </div>
    );
  };

  // Orders Chart Component with real data
  const OrdersChart = () => {
    const chartData = useMemo(() => {
      if (!salesTrends?.dailySales) return null;

      return {
        labels: salesTrends.dailySales.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-IN', { 
            month: 'short', 
            day: 'numeric' 
          });
        }),
        datasets: [
          {
            label: 'Orders',
            data: salesTrends.dailySales.map(item => item.orders),
            backgroundColor: '#10B981',
            borderColor: '#10B981',
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      };
    }, [salesTrends]);

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          callbacks: {
            label: function(context) {
              return `Orders: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          ticks: { color: '#6B7280' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#6B7280' }
        }
      }
    };

    if (!chartData) return null;

    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Orders by Day</h3>
        <div className="h-64">
          <Bar data={chartData} options={options} />
        </div>
      </div>
    );
  };

  // Recent Orders Component with real data
  const RecentOrders = () => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
        <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
          View All
        </button>
      </div>
      <div className="space-y-4">
        {dashboardData?.recentOrders?.length > 0 ? (
          dashboardData.recentOrders.map((order) => (
            <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{order.billNumber}</p>
                  <p className="text-sm text-gray-500">{order.customerName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">₹{order.total}</p>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No recent orders</p>
          </div>
        )}
      </div>
    </div>
  );

  // Top Items Component with real data
  const TopItems = () => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Top Selling Items</h3>
      <div className="space-y-4">
        {topItems.length > 0 ? (
          topItems.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.quantity} sold</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">₹{item.totalRevenue}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No items data available</p>
          </div>
        )}
      </div>
    </div>
  );

  // Quick Actions Component
  const QuickActions = () => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        <button className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">New Order</p>
            <p className="text-sm text-gray-500">Create bill</p>
          </div>
        </button>
        <button className="flex items-center space-x-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors group">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">Manage Menu</p>
            <p className="text-sm text-gray-500">Add items</p>
          </div>
        </button>
        <button className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors group">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">Analytics</p>
            <p className="text-sm text-gray-500">View reports</p>
          </div>
        </button>
        <button className="flex items-center space-x-3 p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors group">
          <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">Settings</p>
            <p className="text-sm text-gray-500">Configure</p>
          </div>
        </button>
      </div>
    </div>
  );

  // Low Stock Alerts Component
  const LowStockAlerts = () => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Low Stock Alerts</h3>
        <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
          {dashboardData?.alerts?.lowStockItems || 0} items
        </span>
      </div>
      <div className="space-y-4">
        {dashboardData?.alerts?.lowStockDetails?.length > 0 ? (
          dashboardData.alerts.lowStockDetails.map((item) => (
            <div key={item._id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.category}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                  {item.stock} left
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-300" />
            <p>All items are well stocked</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={refreshData}
            className={`p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Revenue"
          value={`₹${dashboardData?.todayStats?.earnings?.toLocaleString() || '0'}`}
          icon={DollarSign}
          color="bg-emerald-500"
          subtitle="Today's earnings"
        />
        <StatCard
          title="Today's Orders"
          value={dashboardData?.todayStats?.orders || 0}
          icon={Receipt}
          color="bg-blue-500"
          subtitle="Orders today"
        />
        <StatCard
          title="Avg Order Value"
          value={`₹${dashboardData?.todayStats?.averageOrder || '0'}`}
          icon={ShoppingCart}
          color="bg-purple-500"
          subtitle="Per order"
        />
        <StatCard
          title="Staff Present"
          value={`${dashboardData?.employeeStats?.present || 0}/${dashboardData?.employeeStats?.total || 0}`}
          icon={Users}
          color="bg-amber-500"
          subtitle="Today's attendance"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <OrdersChart />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentOrders />
        <TopItems />
        <LowStockAlerts />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
};

export default DashboardPage;