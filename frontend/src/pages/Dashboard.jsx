import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, UserCheck, AlertCircle, 
  Calendar, Clock, Users, Receipt, RefreshCw,
  ArrowUp, ArrowDown, Activity, BarChart3,
  ShoppingCart, Package, Star, Zap, Target,
  TrendingDown, Eye, EyeOff, Filter, Download,
  MoreVertical, Settings, Bell, Search, CheckCircle,
  Utensils, CreditCard, Timer, Award
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('today');
  const [salesTrends, setSalesTrends] = useState(null);
  const [topItems, setTopItems] = useState([]);

  // API Base URL - Replace with your actual API URL
  const API_BASE = 'http://localhost:4000/api';

  const apiCall = async (endpoint) => {
    const token = localStorage.getItem('token'); // Your auth token
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('API call failed');
    }
    
    return response.json();
  };

  const showToast = (message, type) => {
    // Your toast notification function
    console.log(`${type}: ${message}`);
  };

  useEffect(() => {
    fetchDashboardData();
    fetchSalesTrends();
    fetchTopItems();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/analytics/dashboard');
      console.log('Dashboard data:', data);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
      // Fallback data for demo
      setDashboardData({
        todayStats: { earnings: 15420, orders: 34, averageOrder: 453 },
        employeeStats: { present: 8, total: 12, absent: 4 },
        alerts: { lowStockItems: 3, lowStockDetails: [] },
        recentOrders: []
      });
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
      // Fallback data for demo
      setSalesTrends({
        dailySales: [
          { date: '2025-01-25', earnings: 12000, orders: 28 },
          { date: '2025-01-26', earnings: 15000, orders: 35 },
          { date: '2025-01-27', earnings: 18000, orders: 42 },
          { date: '2025-01-28', earnings: 14000, orders: 31 },
          { date: '2025-01-29', earnings: 16000, orders: 38 },
          { date: '2025-01-30', earnings: 20000, orders: 45 },
          { date: '2025-01-31', earnings: 17000, orders: 39 }
        ]
      });
    }
  };

  const fetchTopItems = async () => {
    try {
      const period = timeRange === 'today' ? 'today' : timeRange === 'week' ? 'week' : 'month';
      const data = await apiCall(`/analytics/top-selling?period=${period}&limit=5`);
      setTopItems(data.topSellingItems || []);
    } catch (error) {
      console.error('Failed to fetch top items:', error);
      // Fallback data for demo
      setTopItems([
        { name: 'Butter Chicken', quantity: 45, totalRevenue: 6750 },
        { name: 'Biryani', quantity: 38, totalRevenue: 5700 },
        { name: 'Dal Makhani', quantity: 32, totalRevenue: 4800 },
        { name: 'Naan', quantity: 67, totalRevenue: 2010 },
        { name: 'Paneer Tikka', quantity: 28, totalRevenue: 4200 }
      ]);
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
  const StatCard = ({ title, value, icon: Icon, gradient, change, changeType, subtitle, trend }) => (
    <div className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300 group overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {change && (
                <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
                  changeType === 'increase' ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'
                }`}>
                  {changeType === 'increase' ? (
                    <ArrowUp className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDown className="w-3 h-3 mr-1" />
                  )}
                  <span>{change}%</span>
                </div>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={`w-16 h-16 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center space-x-2 mt-4">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div 
                className={`h-2 bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`}
                style={{ width: `${trend}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-600">{trend}%</span>
          </div>
        )}
      </div>
    </div>
  );

  // Revenue Chart with enhanced styling
  const RevenueChart = () => {
    const chartData = useMemo(() => {
      if (!salesTrends?.dailySales) return [];

      return salesTrends.dailySales.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-IN', { 
          month: 'short', 
          day: 'numeric' 
        }),
        revenue: item.earnings,
        orders: item.orders,
        avg: Math.round(item.earnings / item.orders) || 0
      }));
    }, [salesTrends]);

    const formatCurrency = (value) => `₹${value.toLocaleString()}`;

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Revenue Analytics</h3>
              <p className="text-sm text-gray-500 mt-1">Daily revenue and order trends</p>
            </div>
            <button
              onClick={refreshData}
              className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCurrency} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  border: 'none', 
                  borderRadius: '12px',
                  color: 'white'
                }}
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : value,
                  name === 'revenue' ? 'Revenue' : name === 'orders' ? 'Orders' : 'Avg Order'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3B82F6" 
                strokeWidth={3}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Orders Bar Chart
  const OrdersChart = () => {
    const chartData = useMemo(() => {
      if (!salesTrends?.dailySales) return [];
      return salesTrends.dailySales.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-IN', { 
          month: 'short', 
          day: 'numeric' 
        }),
        orders: item.orders,
        revenue: item.earnings
      }));
    }, [salesTrends]);

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Daily Orders</h3>
          <p className="text-sm text-gray-500 mt-1">Order volume by day</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  border: 'none', 
                  borderRadius: '12px',
                  color: 'white'
                }}
              />
              <Bar dataKey="orders" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Top Items Pie Chart
  const TopItemsChart = () => {
    const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];
    
    const pieData = topItems.map((item, index) => ({
      name: item.name,
      value: item.quantity,
      revenue: item.totalRevenue,
      color: COLORS[index % COLORS.length]
    }));

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Top Selling Items</h3>
          <p className="text-sm text-gray-500 mt-1">Most popular dishes by quantity</p>
        </div>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="flex-shrink-0">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx={100}
                    cy={100}
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} sold`,
                      props.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.value} sold</p>
                    </div>
                  </div>
                  <p className="font-bold text-emerald-600">₹{item.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Performance Metrics
  const PerformanceMetrics = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-900">Performance Metrics</h3>
        <p className="text-sm text-gray-500 mt-1">Key business indicators</p>
      </div>
      <div className="p-6 space-y-6">
        {/* Customer Satisfaction */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Customer Satisfaction</span>
            <span className="text-sm font-bold text-gray-900">4.8/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-500" style={{width: '96%'}}></div>
          </div>
        </div>

        {/* Order Efficiency */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Order Efficiency</span>
            <span className="text-sm font-bold text-gray-900">12 min avg</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500" style={{width: '85%'}}></div>
          </div>
        </div>

        {/* Staff Productivity */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Staff Productivity</span>
            <span className="text-sm font-bold text-gray-900">8.2/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500" style={{width: '82%'}}></div>
          </div>
        </div>

        {/* Table Turnover */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Table Turnover</span>
            <span className="text-sm font-bold text-gray-900">3.2 turns/day</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500" style={{width: '78%'}}></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Recent Activity Feed
  const ActivityFeed = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-bold text-gray-900">Live Activity</h3>
        <p className="text-sm text-gray-500 mt-1">Real-time restaurant updates</p>
      </div>
      <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
        {[
          { icon: ShoppingCart, text: "New order from Table 5", time: "2 min ago", color: "text-blue-600 bg-blue-100" },
          { icon: CheckCircle, text: "Order #1234 completed", time: "5 min ago", color: "text-emerald-600 bg-emerald-100" },
          { icon: Users, text: "Staff check-in: Rahul", time: "12 min ago", color: "text-purple-600 bg-purple-100" },
          { icon: AlertCircle, text: "Low stock: Paneer", time: "15 min ago", color: "text-amber-600 bg-amber-100" },
          { icon: DollarSign, text: "Payment received ₹850", time: "18 min ago", color: "text-emerald-600 bg-emerald-100" },
          { icon: Clock, text: "Kitchen prep completed", time: "22 min ago", color: "text-blue-600 bg-blue-100" }
        ].map((activity, index) => (
          <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
            <div className={`p-2 rounded-lg ${activity.color}`}>
              <activity.icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{activity.text}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Quick Actions with better styling
 

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100">
                <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your restaurant overview.</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={refreshData}
            className={`p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Revenue"
          value={`₹${dashboardData?.todayStats?.earnings?.toLocaleString() || '0'}`}
          icon={DollarSign}
          gradient="from-emerald-500 to-teal-500"
          change="12.5"
          changeType="increase"
          subtitle="Total earnings today"
          trend={85}
        />
        <StatCard
          title="Orders Completed"
          value={dashboardData?.todayStats?.orders || 0}
          icon={Receipt}
          gradient="from-blue-500 to-cyan-500"
          change="8.2"
          changeType="increase"
          subtitle="Orders processed"
          trend={72}
        />
        <StatCard
          title="Average Order"
          value={`₹${dashboardData?.todayStats?.averageOrder || '0'}`}
          icon={ShoppingCart}
          gradient="from-purple-500 to-indigo-500"
          change="5.1"
          changeType="increase"
          subtitle="Per order value"
          trend={68}
        />
        <StatCard
          title="Staff Present"
          value={`${dashboardData?.employeeStats?.present || 0}/${dashboardData?.employeeStats?.total || 0}`}
          icon={Users}
          gradient="from-amber-500 to-orange-500"
          subtitle="Today's attendance"
          trend={Math.round((dashboardData?.employeeStats?.present / dashboardData?.employeeStats?.total) * 100) || 0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <OrdersChart />
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopItemsChart />
        <PerformanceMetrics />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* <ActivityFeed /> */}
      
      </div>
    </div>
  );
};

export default DashboardPage;