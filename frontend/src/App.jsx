import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  X, CheckCircle, AlertCircle, Info, Loader2,
  TrendingUp, TrendingDown, Activity, BarChart3,
  DollarSign, Users, ShoppingCart, Receipt
} from 'lucide-react';

// Import Pages
import DashboardPage from './pages/Dashboard';
import BillingPage from './pages/Billing';
import MenuManagementPage from './pages/Menu';
import EmployeesPage from './pages/Employees';
import AnalyticsPage from './pages/Analitics';
import BillsHistoryPage from './pages/Billhistory';
import LoginPage from './pages/LoginPage';
import Sidebar from './pages/SideBar';
import SettingsPage from './pages/Settings';

// API Configuration
const API_BASE_URL = 'http://localhost:4000/api';

// Enhanced API Helper with better error handling
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
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Global Context for State Management
const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// Enhanced Toast Notification Component
const Toast = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      case 'warning': return <AlertCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success': return 'bg-emerald-500 border-emerald-400';
      case 'error': return 'bg-red-500 border-red-400';
      case 'warning': return 'bg-amber-500 border-amber-400';
      default: return 'bg-blue-500 border-blue-400';
    }
  };

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl backdrop-blur-sm border z-50 ${getStyles()} text-white transform transition-all duration-300 animate-in slide-in-from-right-5`}>
      <div className="flex items-center space-x-3 max-w-sm">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button 
          onClick={onClose}
          className="flex-shrink-0 hover:bg-white/20 p-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Professional Loading Component
export const LoadingSpinner = ({ size = 'default', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}></div>
      {text && <p className="text-gray-600 font-medium">{text}</p>}
    </div>
  );
};

// Enhanced Loading Screen
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
    <div className="text-center">
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Receipt className="w-8 h-8 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">RestaurantPOS</h2>
      <p className="text-gray-600 mb-8">Professional Billing System</p>
      <LoadingSpinner size="large" text="Initializing..." />
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Route Component
const AdminRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Enhanced Layout Component
const AppLayout = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getCurrentPage = () => {
    const path = location.pathname.slice(1);
    return path || 'dashboard';
  };

  const handlePageChange = (page) => {
    navigate(`/${page}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        currentPage={getCurrentPage()}
        setCurrentPage={handlePageChange}
        user={user}
        onLogout={onLogout}
      />
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/menu" element={<MenuManagementPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/bills" element={<BillsHistoryPage />} />
            <Route 
              path="/settings" 
              element={
                <AdminRoute user={user}>
                  <SettingsPage />
                </AdminRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

// Main App Component with Enhanced Features
const App = () => {
  const [user, setUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = await apiCall('/auth/me');
        setUser(userData);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        showToast('Session expired. Please login again.', 'warning');
      }
    }
    setLoading(false);
  };

  const showToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    const toast = { id, message, type, duration };
    setToasts(prev => [...prev, toast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleLogin = (userData) => {
    setUser(userData);
    showToast(`Welcome back, ${userData.name}!`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  const contextValue = {
    user,
    showToast,
    apiCall,
    isOnline,
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AppContext.Provider value={contextValue}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Offline Indicator */}
          {!isOnline && (
            <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 z-50">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              You are currently offline. Some features may not work.
            </div>
          )}

          <Routes>
            <Route 
              path="/login" 
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              } 
            />
            
            <Route 
              path="/*" 
              element={
                <ProtectedRoute user={user}>
                  <AppLayout user={user} onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
          </Routes>
          
          {/* Toast Container */}
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
              <Toast
                key={toast.id}
                message={toast.message}
                type={toast.type}
                onClose={() => removeToast(toast.id)}
                duration={toast.duration}
              />
            ))}
          </div>
        </div>
      </Router>
    </AppContext.Provider>
  );
};

export default App;