import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Lock, Bell, Database, Printer, 
  Save, RefreshCw, Download, Upload, Eye, EyeOff,
  Wifi, Shield, CreditCard, Globe, Smartphone,
  Check, X, AlertCircle, Info
} from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    restaurant: {
      name: 'My Restaurant',
      address: '123 Main Street, City',
      phone: '+91 9876543210',
      email: 'restaurant@example.com',
      gstin: 'GSTIN123456789',
      currency: 'INR',
      timezone: 'Asia/Kolkata'
    },
    user: {
      username: 'admin',
      email: 'admin@restaurant.com',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    printer: {
      model: 'TVS RP3160',
      connection: 'USB',
      ipAddress: '192.168.1.100',
      port: '9100',
      paperSize: '80mm',
      autoConnect: true
    },
    notifications: {
      lowStock: true,
      dailyReport: true,
      employeeCheckIn: false,
      systemAlerts: true,
      emailNotifications: true,
      smsNotifications: false
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: '30',
      loginAttempts: '5',
      passwordExpiry: '90'
    },
    system: {
      theme: 'light',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12',
      autoBackup: true,
      backupFrequency: 'daily'
    }
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [testResults, setTestResults] = useState({
    printer: null,
    database: null,
    backup: null
  });

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

  const handleSave = async (section) => {
    setLoading(true);
    try {
      // This would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      alert(`${section} settings saved successfully!`);
    } catch (error) {
      alert('Failed to save settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testPrinter = async () => {
    setLoading(true);
    try {
      const result = await apiCall('/printer/test', { method: 'POST' });
      setTestResults(prev => ({ ...prev, printer: result.success }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, printer: false }));
    } finally {
      setLoading(false);
    }
  };

  const testDatabase = async () => {
    setLoading(true);
    try {
      // Test database connection
      await apiCall('/analytics/dashboard');
      setTestResults(prev => ({ ...prev, database: true }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, database: false }));
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      // This would create a backup
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResults(prev => ({ ...prev, backup: true }));
      alert('Backup created successfully!');
    } catch (error) {
      setTestResults(prev => ({ ...prev, backup: false }));
      alert('Backup failed!');
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-3 w-full px-4 py-3 text-left rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  const SettingCard = ({ title, description, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );

  const TestStatus = ({ status, label }) => (
    <div className="flex items-center space-x-2">
      {status === null ? (
        <AlertCircle className="w-4 h-4 text-gray-400" />
      ) : status ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <X className="w-4 h-4 text-red-600" />
      )}
      <span className={`text-sm ${
        status === null ? 'text-gray-600' : 
        status ? 'text-green-600' : 'text-red-600'
      }`}>
        {status === null ? 'Not tested' : status ? 'Connected' : 'Failed'}
      </span>
    </div>
  );

  const GeneralSettings = () => (
    <div className="space-y-6">
      <SettingCard 
        title="Restaurant Information" 
        description="Basic information about your restaurant"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Name
            </label>
            <input
              type="text"
              value={settings.restaurant.name}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                restaurant: { ...prev.restaurant, name: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={settings.restaurant.phone}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                restaurant: { ...prev.restaurant, phone: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={settings.restaurant.email}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                restaurant: { ...prev.restaurant, email: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GSTIN Number
            </label>
            <input
              type="text"
              value={settings.restaurant.gstin}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                restaurant: { ...prev.restaurant, gstin: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            value={settings.restaurant.address}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              restaurant: { ...prev.restaurant, address: e.target.value }
            }))}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={() => handleSave('Restaurant Information')}
          disabled={loading}
          className="mt-4 flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </SettingCard>

      <SettingCard 
        title="System Preferences" 
        description="Configure system-wide settings"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={settings.system.theme}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                system: { ...prev.system, theme: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={settings.system.language}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                system: { ...prev.system, language: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <select
              value={settings.system.dateFormat}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                system: { ...prev.system, dateFormat: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Format
            </label>
            <select
              value={settings.system.timeFormat}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                system: { ...prev.system, timeFormat: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="12">12-hour</option>
              <option value="24">24-hour</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => handleSave('System Preferences')}
          disabled={loading}
          className="mt-4 flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </SettingCard>
    </div>
  );

  const AccountSettings = () => (
    <div className="space-y-6">
      <SettingCard 
        title="Account Information" 
        description="Manage your account details"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={settings.user.username}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                user: { ...prev.user, username: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={settings.user.email}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                user: { ...prev.user, email: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={() => handleSave('Account Information')}
          disabled={loading}
          className="mt-4 flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </SettingCard>

      <SettingCard 
        title="Change Password" 
        description="Update your account password"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword.current ? 'text' : 'password'}
                value={settings.user.currentPassword}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  user: { ...prev.user, currentPassword: e.target.value }
                }))}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                value={settings.user.confirmPassword}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  user: { ...prev.user, confirmPassword: e.target.value }
                }))}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleSave('Password')}
          disabled={loading || settings.user.newPassword !== settings.user.confirmPassword}
          className="mt-4 flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Lock className="w-4 h-4" />
          <span>Update Password</span>
        </button>
      </SettingCard>
    </div>
  );

  const PrinterSettings = () => (
    <div className="space-y-6">
      <SettingCard 
        title="Printer Configuration" 
        description="Configure your TVS RP3160 thermal printer"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Printer Model
            </label>
            <select
              value={settings.printer.model}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                printer: { ...prev.printer, model: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="TVS RP3160">TVS RP3160</option>
              <option value="TVS RP3150">TVS RP3150</option>
              <option value="Epson TM-T82">Epson TM-T82</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection Type
            </label>
            <select
              value={settings.printer.connection}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                printer: { ...prev.printer, connection: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="USB">USB</option>
              <option value="Network">Network (LAN)</option>
              <option value="Bluetooth">Bluetooth</option>
            </select>
          </div>
          
          {settings.printer.connection === 'Network' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IP Address
                </label>
                <input
                  type="text"
                  value={settings.printer.ipAddress}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    printer: { ...prev.printer, ipAddress: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="192.168.1.100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port
                </label>
                <input
                  type="text"
                  value={settings.printer.port}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    printer: { ...prev.printer, port: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="9100"
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paper Size
            </label>
            <select
              value={settings.printer.paperSize}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                printer: { ...prev.printer, paperSize: e.target.value }
              }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="80mm">80mm</option>
              <option value="58mm">58mm</option>
            <option value="10mm">10mm</option>

            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.printer.autoConnect}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                printer: { ...prev.printer, autoConnect: e.target.checked }
              }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Auto-connect on startup
            </span>
          </label>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={() => handleSave('Printer Configuration')}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
          
          <button
            onClick={testPrinter}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Test Printer</span>
          </button>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Printer Status:</span>
            <TestStatus status={testResults.printer} label="Printer" />
          </div>
        </div>
      </SettingCard>
    </div>
  );

  const NotificationSettings = () => (
    <div className="space-y-6">
      <SettingCard 
        title="Notification Preferences" 
        description="Configure when and how you receive notifications"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h4 className="text-sm font-medium text-gray-800">Low Stock Alerts</h4>
              <p className="text-sm text-gray-600">Get notified when items are running low</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.lowStock}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, lowStock: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h4 className="text-sm font-medium text-gray-800">Daily Reports</h4>
              <p className="text-sm text-gray-600">Receive daily sales and performance reports</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.dailyReport}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, dailyReport: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h4 className="text-sm font-medium text-gray-800">Employee Check-ins</h4>
              <p className="text-sm text-gray-600">Get notified when employees check in/out</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.employeeCheckIn}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, employeeCheckIn: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <h4 className="text-sm font-medium text-gray-800">System Alerts</h4>
              <p className="text-sm text-gray-600">Important system and security notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.systemAlerts}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, systemAlerts: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <button
          onClick={() => handleSave('Notification Preferences')}
          disabled={loading}
          className="mt-6 flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </SettingCard>
    </div>
  );

  const SystemSettings = () => (
    <div className="space-y-6">
      <SettingCard 
        title="System Status" 
        description="Monitor system health and connectivity"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Database</span>
              <TestStatus status={testResults.database} />
            </div>
            <button
              onClick={testDatabase}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              <Database className="w-4 h-4" />
              <span>Test Connection</span>
            </button>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Printer</span>
              <TestStatus status={testResults.printer} />
            </div>
            <button
              onClick={testPrinter}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Test Printer</span>
            </button>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Backup</span>
              <TestStatus status={testResults.backup} />
            </div>
            <button
              onClick={createBackup}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Create Backup</span>
            </button>
          </div>
        </div>
      </SettingCard>

      <SettingCard 
        title="Data Management" 
        description="Backup and restore your restaurant data"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-800">Automatic Backup</h4>
              <p className="text-sm text-gray-600">Automatically backup data daily</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.system.autoBackup}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  system: { ...prev.system, autoBackup: e.target.checked }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup Frequency
            </label>
            <select
              value={settings.system.backupFrequency}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                system: { ...prev.system, backupFrequency: e.target.value }
              }))}
              disabled={!settings.system.autoBackup}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={createBackup}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Create Backup Now</span>
            </button>
            
            <button
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Restore Backup</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => handleSave('Data Management')}
          disabled={loading}
          className="mt-4 flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </SettingCard>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'account', label: 'Account', icon: User },
    { id: 'printer', label: 'Printer', icon: Printer },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Database },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'account':
        return <AccountSettings />;
      case 'printer':
        return <PrinterSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'system':
        return <SystemSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your restaurant management system</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 bg-white p-6 rounded-xl shadow-sm border">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                id={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={activeTab === tab.id}
                onClick={setActiveTab}
              />
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
               