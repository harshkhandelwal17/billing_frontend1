import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, Upload, Search, 
  Filter, Package, Eye, EyeOff, AlertCircle, RefreshCw,
  ChefHat, Star, Clock, TrendingUp, TrendingDown, 
  DollarSign, ShoppingBag, Grid, List, Settings,
  FileText, Download, BarChart3, Users, Award,
  CheckCircle, XCircle, Camera, Image as ImageIcon,
  Zap, Target, Activity, Percent, Tag, Hash,
  Globe, Wifi, WifiOff, Cloud, CloudOff, Heart,
  Flame, Leaf, Wheat, Milk, Fish, Egg, Gauge,
  MoreVertical, Shield, Database, Layers,
  Calendar, User, Phone, Mail, MapPin, Building2
} from 'lucide-react';

const EnhancedMenuManagement = () => {
  // ============= STATE MANAGEMENT =============
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [stats, setStats] = useState({});
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    category: 'starter',
    stock: '',
    isAvailable: true,
    isPopular: false,
    preparationTime: '',
    allergens: [],
    isVegan: false,
    isVegetarian: false,
    isGlutenFree: false,
    isDairyFree: false,
    spiceLevel: 'mild',
    portionSize: 'medium',
    tags: [],
    image: null
  });

  // Refs
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);
const stockRef = useRef(null);
const sellingPriceRef = useRef(null);
const costPriceRef = useRef(null);
  // ============= CONFIGURATION =============
  const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:4000/api';

  const availableCategories = [
    { value: 'starter', label: 'Starters', icon: '🥗', color: 'bg-green-100 text-green-700' },
    { value: 'main-course', label: 'Main Course', icon: '🍽️', color: 'bg-blue-100 text-blue-700' },
    { value: 'dessert', label: 'Desserts', icon: '🍰', color: 'bg-pink-100 text-pink-700' },
    { value: 'beverage', label: 'Beverages', icon: '🥤', color: 'bg-cyan-100 text-cyan-700' },
    { value: 'bread', label: 'Breads', icon: '🍞', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'breakfast', label: 'Breakfast', icon: '�', color: 'bg-yellow-100 text-yellow-700' },

    { value: 'rice', label: 'Rice', icon: '🍚', color: 'bg-orange-100 text-orange-700' },
    { value: 'curry', label: 'Curries', icon: '🍛', color: 'bg-red-100 text-red-700' },
    { value: 'other', label: 'Other', icon: '📦', color: 'bg-gray-100 text-gray-700' }
  ];

  const allergenOptions = [
    { value: 'Dairy', icon: '🥛', color: 'bg-blue-100 text-blue-700' },
    { value: 'Nuts', icon: '🥜', color: 'bg-amber-100 text-amber-700' },
    { value: 'Gluten', icon: '🌾', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'Soy', icon: '🫘', color: 'bg-green-100 text-green-700' },
    { value: 'Eggs', icon: '🥚', color: 'bg-orange-100 text-orange-700' },
    { value: 'Seafood', icon: '🐟', color: 'bg-cyan-100 text-cyan-700' },
    { value: 'Shellfish', icon: '🦐', color: 'bg-red-100 text-red-700' },
    { value: 'Sesame', icon: '🌰', color: 'bg-purple-100 text-purple-700' }
  ];

  const spiceLevels = [
    { value: 'mild', label: 'Mild', icon: '🟢', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', icon: '🟡', color: 'text-yellow-600' },
    { value: 'hot', label: 'Hot', icon: '🟠', color: 'text-orange-600' },
    { value: 'extra-hot', label: 'Extra Hot', icon: '🔴', color: 'text-red-600' }
  ];

  const portionSizes = [
    { value: 'small', label: 'Small', icon: '🥄' },
    { value: 'medium', label: 'Medium', icon: '🍽️' },
    { value: 'large', label: 'Large', icon: '🍲' }
  ];

  // ============= UTILITY FUNCTIONS =============
  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove notification
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);

    // Play sound notification (optional)
    if (type === 'error') {
      // Error sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBwAA');
        audio.volume = 0.1;
        audio.play().catch(() => {});
      } catch (e) {}
    }
  }, []);

  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    const config = {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Don't set Content-Type for FormData (browser sets it automatically with boundary)
    if (!(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

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

  // ============= DATA FETCHING =============
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchMenuItems(),
          fetchCategories(),
          fetchStats()
        ]);
      } catch (error) {
        console.error('Initialization failed:', error);
        showNotification('Failed to initialize data', 'error');
      }
    };

    initializeData();
  }, []);

  // Refetch data when filters change
  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      fetchMenuItems();
    }, 300); // Debounce search

    return () => clearTimeout(delayedFetch);
  }, [searchTerm, selectedCategory, sortBy, sortOrder, currentPage]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotification('✅ Connection restored', 'success');
      fetchMenuItems(); // Refresh data when back online
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      showNotification('⚠️ Working offline', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await apiCall(`/menu?${params}`);
      console.log('Fetched menu items:', response);
      setMenuItems(response.data || []);
      setStats(response.stats || {});
      
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages);
      }

      if (currentPage === 1) {
        // showNotification(`Loaded ${response.data?.length || 0} menu items`, 'success');
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      showNotification('Failed to load menu items', 'error');
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiCall('/menu/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiCall('/menu/stats');
      setStats(response.data || {});
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // ============= FORM HANDLERS =============
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('Image size must be less than 10MB', 'error');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('Only JPEG, PNG, and WebP images are allowed', 'error');
      return;
    }

    setFormData({ ...formData, image: file });
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, image: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.name.trim()) {
        showNotification('Item name is required', 'error');
        return;
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        showNotification('Valid price is required', 'error');
        return;
      }
      if (!formData.stock || parseInt(formData.stock) < 0) {
        showNotification('Valid stock quantity is required', 'error');
        return;
      }

      setUploadingImage(true);

      const submitFormData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'allergens' || key === 'tags') {
          // Handle arrays
          if (Array.isArray(formData[key])) {
            formData[key].forEach(item => submitFormData.append(key, item));
          }
        } else if (key === 'image') {
          // Handle file upload
          if (formData[key]) {
            submitFormData.append('image', formData[key]);
          }
        } else {
          submitFormData.append(key, formData[key].toString());
        }
      });

      let response;
      if (editingItem) {
        response = await apiCall(`/menu/${editingItem._id || editingItem.id}`, {
          method: 'PUT',
          body: submitFormData
        });
        
        setMenuItems(prev => prev.map(item => 
          (item._id || item.id) === (editingItem._id || editingItem.id) ? 
          response.data : item
        ));
        
        showNotification(`${formData.name} updated successfully!`, 'success');
        setEditingItem(null);
      } else {
        response = await apiCall('/menu', {
          method: 'POST',
          body: submitFormData
        });
        
        setMenuItems(prev => [response.data, ...prev]);
        showNotification(`${formData.name} added successfully!`, 'success');
        setShowAddModal(false);
      }
      
      resetForm();
      await fetchStats(); // Refresh stats
      
    } catch (error) {
      showNotification(`Failed to save item: ${error.message}`, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      cost: '',
      category: 'starter',
      stock: '',
      isAvailable: true,
      isPopular: false,
      preparationTime: '',
      allergens: [],
      isVegan: false,
      isVegetarian: false,
      isGlutenFree: false,
      isDairyFree: false,
      spiceLevel: 'mild',
      portionSize: 'medium',
      tags: [],
      image: null
    });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price?.toString() || '',
      cost: item.cost?.toString() || '',
      category: item.category || 'starter',
      stock: item.stock?.toString() || '',
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
      isPopular: item.isPopular || false,
      preparationTime: item.preparationTime?.toString() || '',
      allergens: item.allergens || [],
      isVegan: item.isVegan || false,
      isVegetarian: item.isVegetarian || false,
      isGlutenFree: item.isGlutenFree || false,
      isDairyFree: item.isDairyFree || false,
      spiceLevel: item.spiceLevel || 'mild',
      portionSize: item.portionSize || 'medium',
      tags: item.tags || [],
      image: null
    });
    
    // Set preview to existing image
    if (item.image?.url) {
      setImagePreview(item.image.url);
    } else {
      setImagePreview(null);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      await apiCall(`/menu/${item._id || item.id}`, { method: 'DELETE' });
      setMenuItems(prev => prev.filter(menuItem => 
        (menuItem._id || menuItem.id) !== (item._id || item.id)
      ));
      showNotification(`${item.name} deleted successfully`, 'success');
      await fetchStats(); // Refresh stats
    } catch (error) {
      showNotification(`Failed to delete item: ${error.message}`, 'error');
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const response = await apiCall(`/menu/${item._id || item.id}/availability`, {
        method: 'PATCH'
      });
      
      setMenuItems(prev => prev.map(menuItem => 
        (menuItem._id || menuItem.id) === (item._id || item.id) ? 
        response.data : menuItem
      ));
      
      showNotification(response.message, 'success');
    } catch (error) {
      showNotification(`Failed to update availability: ${error.message}`, 'error');
    }
  };

  const togglePopular = async (item) => {
    try {
      const response = await apiCall(`/menu/${item._id || item.id}/popular`, {
        method: 'PATCH'
      });
      
      setMenuItems(prev => prev.map(menuItem => 
        (menuItem._id || menuItem.id) === (item._id || item.id) ? 
        response.data : menuItem
      ));
      
      showNotification(response.message, 'success');
    } catch (error) {
      showNotification(`Failed to update popular status: ${error.message}`, 'error');
    }
  };

  const handleBulkAction = async (action, additionalData = {}) => {
    if (selectedItems.length === 0) {
      showNotification('Please select items first', 'warning');
      return;
    }

    try {
      const response = await apiCall('/menu/bulk/update', {
        method: 'POST',
        body: JSON.stringify({
          ids: selectedItems,
          action,
          data: additionalData
        })
      });

      showNotification(response.message, 'success');
      setSelectedItems([]);
      setShowBulkActions(false);
      await fetchMenuItems(); // Refresh the list
      await fetchStats(); // Refresh stats
    } catch (error) {
      showNotification(`Bulk action failed: ${error.message}`, 'error');
    }
  };

  const exportData = async (format = 'csv') => {
    try {
      showNotification('Preparing export...', 'info');
      window.open(`${API_BASE_URL}/menu/export/${format}`, '_blank');
      showNotification('Export started successfully', 'success');
    } catch (error) {
      showNotification(`Export failed: ${error.message}`, 'error');
    }
  };

  // ============= FILTER FUNCTIONS =============
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = !searchTerm || (
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectAllItems = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item._id || item.id));
    }
  };

  // ============= COMPONENTS =============

  // Enhanced Notification Component
  const NotificationToast = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`
            px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border
            flex items-center space-x-3
            transform transition-all duration-300 ease-out animate-slideIn
            ${notification.type === 'success' ? 'bg-emerald-500/95 text-white border-emerald-400' :
              notification.type === 'warning' ? 'bg-amber-500/95 text-white border-amber-400' :
              notification.type === 'error' ? 'bg-red-500/95 text-white border-red-400' :
              'bg-blue-500/95 text-white border-blue-400'
            }
          `}
        >
          <div className="flex-shrink-0">
            {notification.type === 'success' && <CheckCircle className="w-4 h-4" />}
            {notification.type === 'warning' && <AlertCircle className="w-4 h-4" />}
            {notification.type === 'error' && <XCircle className="w-4 h-4" />}
            {notification.type === 'info' && <Settings className="w-4 h-4" />}
          </div>
          <span className="flex-1 text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            className="flex-shrink-0 hover:bg-white/20 p-1 rounded transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );

  // Enhanced Statistics Cards
  const StatsCard = ({ title, value, subtitle, icon: Icon, color, trend, onClick }) => (
    <div 
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className={`flex items-center text-sm font-medium ${
                trend > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Enhanced Item Card Component
  const ItemCard = ({ item }) => {
    const isSelected = selectedItems.includes(item._id || item.id);
    
    return (
      <div className={`
        bg-white rounded-2xl shadow-sm border-2 
        hover:shadow-lg transition-all duration-300 overflow-hidden group
        ${!item.isAvailable ? 'opacity-75' : ''}
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-200'}
      `}>
        {/* Selection Checkbox */}
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedItems(prev => [...prev, item._id || item.id]);
              } else {
                setSelectedItems(prev => prev.filter(id => id !== (item._id || item.id)));
              }
            }}
            className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>

        {/* Image Section */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {item.image?.url ? (
            <img 
              src={item.optimizedImage?.medium || item.image.url}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {/* Status Badges */}
          <div className="absolute top-3 right-3 flex flex-col space-y-2">
            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
              item.isAvailable 
                ? 'bg-emerald-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {item.isAvailable ? '✓ Available' : '✗ Hidden'}
            </span>
            
            {item.isPopular && (
              <span className="px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded-full flex items-center">
                <Star className="w-3 h-3 mr-1" />
                Popular
              </span>
            )}

            {/* Stock Badge */}
            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
              item.stock > 10 ? 'bg-emerald-500 text-white' :
              item.stock > 0 ? 'bg-amber-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {item.stock === 0 ? 'Out of Stock' : `${item.stock} left`}
            </span>
          </div>

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3">
            <button
              onClick={() => handleEdit(item)}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              title="Edit Item"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => togglePopular(item)}
              className={`p-2 rounded-full transition-colors ${
                item.isPopular 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
              title={item.isPopular ? 'Remove from Popular' : 'Mark as Popular'}
            >
              <Star className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleAvailability(item)}
              className={`p-2 rounded-full transition-colors ${
                item.isAvailable 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
              title={item.isAvailable ? 'Hide Item' : 'Show Item'}
            >
              {item.isAvailable ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-5">
          <div className="mb-3">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 flex-1 mr-2">
                {item.name}
              </h3>
              {item.preparationTime && (
                <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                  <Clock className="w-3 h-3 mr-1" />
                  {item.preparationTime}m
                </div>
              )}
            </div>
            
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${
                availableCategories.find(cat => cat.value === item.category)?.color || 'bg-gray-100 text-gray-700'
              }`}>
                {availableCategories.find(cat => cat.value === item.category)?.icon} {item.category.replace('-', ' ')}
              </span>
              
              {/* Dietary Icons */}
              {item.isVegan && (
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center" title="Vegan">
                  <Leaf className="w-3 h-3" />
                </span>
              )}
              {item.isVegetarian && (
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center" title="Vegetarian">
                  <Heart className="w-3 h-3" />
                </span>
              )}
              {item.isGlutenFree && (
                <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center" title="Gluten Free">
                  <Wheat className="w-3 h-3" />
                </span>
              )}
              {item.isDairyFree && (
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center" title="Dairy Free">
                  <Milk className="w-3 h-3" />
                </span>
              )}

              {/* Spice Level */}
              {item.spiceLevel && item.spiceLevel !== 'mild' && (
                <div className="flex items-center" title={`Spice Level: ${item.spiceLevel}`}>
                  <span className={`text-xs ${spiceLevels.find(level => level.value === item.spiceLevel)?.color || 'text-gray-500'}`}>
                    <Flame className="w-3 h-3" />
                  </span>
                </div>
              )}
            </div>
            
            {item.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>
            )}
            
            {/* Allergens */}
            {item.allergens && item.allergens.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {item.allergens.slice(0, 3).map(allergen => {
                  const allergenInfo = allergenOptions.find(a => a.value === allergen);
                  return (
                    <span key={allergen} className={`text-xs px-2 py-1 rounded-full ${allergenInfo?.color || 'bg-gray-100 text-gray-700'}`}>
                      {allergenInfo?.icon} {allergen}
                    </span>
                  );
                })}
                {item.allergens.length > 3 && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    +{item.allergens.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Rating */}
            {item.averageRating > 0 && (
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-semibold text-gray-700 ml-1">
                    {item.averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  ({item.totalReviews} reviews)
                </span>
              </div>
            )}
          </div>
          
          {/* Price and Profit */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-xl font-bold text-emerald-600">₹{item.price}</span>
              </div>
              {item.cost && (
                <div className="text-xs text-gray-500">
                  Cost: ₹{item.cost} • Profit: ₹{(item.price - item.cost).toFixed(2)} ({(((item.price - item.cost) / item.price) * 100).toFixed(1)}%)
                </div>
              )}
            </div>
            
            {item.stock <= 5 && item.stock > 0 && (
              <div className="flex items-center text-orange-600 text-sm bg-orange-50 px-2 py-1 rounded-full">
                <AlertCircle className="w-3 h-3 mr-1" />
                <span className="font-medium">Low Stock</span>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => toggleAvailability(item)}
              className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                item.isAvailable
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {item.isAvailable ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {item.isAvailable ? 'Hide' : 'Show'}
            </button>
            
            <button
              onClick={() => handleEdit(item)}
              className="flex items-center justify-center py-2 px-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium"
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </button>
            
            <button
              onClick={() => handleDelete(item)}
              className="flex items-center justify-center py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Form Component with Cloudinary Image Upload
  const ItemForm = ({ isModal = false }) => (
    <div className="space-y-6">
      {/* Image Upload Section */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <Camera className="w-5 h-5 mr-2" />
          Item Image (Upload to Cloudinary)
        </h4>
        
        <div className="flex items-start space-x-6">
          {/* Image Preview */}
          <div className="relative">
            <div className="w-40 h-40 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No image</p>
                </div>
              )}
            </div>
            {imagePreview && (
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Upload Section */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer transition-colors bg-white"
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2 font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mb-2">
                PNG, JPG, WebP up to 10MB
              </p>
              <p className="text-xs text-blue-600">
                Images will be optimized and stored on Cloudinary
              </p>
            </div>

            {uploadingImage && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
                <Cloud className="w-4 h-4 animate-spin" />
                <span className="text-sm">Uploading to Cloudinary...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Basic Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter item name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            >
              {availableCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
            placeholder="Enter item description"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 characters</p>
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Pricing & Inventory
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price (₹) *
            </label>
            <input
              ref={sellingPriceRef}
              type="number"
              value={formData.price}
              onChange={(e) => {setFormData({ ...formData, price: e.target.value });
               setTimeout(() => {
          sellingPriceRef.current.focus();
        }, 0);
      }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Price (₹)
            </label>
            <input
              ref={costPriceRef}
              type="number"
              value={formData.cost}
              onChange={(e) => {setFormData({ ...formData, cost: e.target.value });
               setTimeout(() => {
          costPriceRef.current.focus();
        }, 0);
      }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Quantity *
            </label>
            <input
            ref={stockRef}
              type="number"
              value={formData.stock}
              onChange={(e) => {setFormData({ ...formData, stock: e.target.value });
               setTimeout(() => {
          stockRef.current.focus();
        }, 0);
      }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="0"
              min="0"
              required
            />
          </div>
        </div>
        
        {/* Profit Calculation Display */}
        {formData.price && formData.cost && parseFloat(formData.price) > 0 && parseFloat(formData.cost) >= 0 && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-700 font-medium">Profit Analysis:</span>
              <div className="text-right">
                <div className="text-emerald-600 font-bold">
                  ₹{(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)} 
                  ({(((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price)) * 100).toFixed(1)}%)
                </div>
                <div className="text-xs text-emerald-600">
                  Margin per item
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Details */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Additional Details
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preparation Time (minutes)
            </label>
            <input
              type="number"
              value={formData.preparationTime}
              onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="15"
              min="0"
              max="180"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spice Level
            </label>
            <select
              value={formData.spiceLevel}
              onChange={(e) => setFormData({ ...formData, spiceLevel: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {spiceLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.icon} {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Portion Size
            </label>
            <select
              value={formData.portionSize}
              onChange={(e) => setFormData({ ...formData, portionSize: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {portionSizes.map(size => (
                <option key={size.value} value={size.value}>
                  {size.icon} {size.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Allergens */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Allergens (Select all that apply)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {allergenOptions.map(allergen => (
              <label key={allergen.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.allergens.includes(allergen.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        allergens: [...formData.allergens, allergen.value]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        allergens: formData.allergens.filter(a => a !== allergen.value)
                      });
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{allergen.icon} {allergen.value}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Dietary Restrictions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { key: 'isVegan', label: 'Vegan', icon: Leaf, description: 'No animal products' },
            { key: 'isVegetarian', label: 'Vegetarian', icon: Heart, description: 'No meat or fish' },
            { key: 'isGlutenFree', label: 'Gluten Free', icon: Wheat, description: 'No gluten ingredients' },
            { key: 'isDairyFree', label: 'Dairy Free', icon: Milk, description: 'No dairy products' }
          ].map(({ key, label, icon: Icon, description }) => (
            <div key={key} className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          ))}
        </div>
        
        {/* Status Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-gray-800">Available for Customers</p>
                  <p className="text-sm text-gray-600">Show this item in the menu</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
          
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium text-gray-800">Mark as Popular</p>
                  <p className="text-sm text-gray-600">Highlight this item</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => {
            if (isModal) {
              setShowAddModal(false);
            } else {
              setEditingItem(null);
            }
            resetForm();
          }}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!formData.name.trim() || !formData.price || !formData.stock || uploadingImage}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
        >
          {uploadingImage ? (
            <>
              <Cloud className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{editingItem ? 'Update Item' : 'Add Item'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Pagination Component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-2 border rounded-lg transition-colors ${
              currentPage === page
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => setCurrentPage(totalPages)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Next
        </button>
      </div>
    );
  };

  // ============= LOADING SKELETON =============
  if (loading && currentPage === 1) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mb-6"></div>
            
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Items Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border overflow-hidden">
                <div className="aspect-[4/3] bg-gray-200"></div>
                <div className="p-5">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-20 mb-4"></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============= MAIN RENDER =============
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <NotificationToast />
      
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
              <ChefHat className="w-8 h-8 mr-3 text-blue-600" />
              Menu Management
              {!isOnline && (
                <span className="ml-3 px-2 py-1 bg-amber-100 text-amber-800 text-sm rounded-full flex items-center">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </span>
              )}
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your restaurant's menu items with Cloudinary integration
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => exportData('csv')}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
              disabled={!isOnline}
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            
            <button
              onClick={() => {
                fetchMenuItems();
                fetchStats();
                fetchCategories();
              }}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Item</span>
            </button>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            title="Total Items"
            value={stats.total || 0}
            subtitle="All menu items"
            icon={Package}
            color="bg-blue-600"
          />
          <StatsCard
            title="Available"
            value={stats.available || 0}
            subtitle="Currently active"
            icon={CheckCircle}
            color="bg-emerald-600"
            onClick={() => setSelectedCategory('all')}
          />
          <StatsCard
            title="Out of Stock"
            value={stats.outOfStock || 0}
            subtitle="Need restocking"
            icon={XCircle}
            color="bg-red-600"
          />
          <StatsCard
            title="Low Stock"
            value={stats.lowStock || 0}
            subtitle="≤ 5 items left"
            icon={AlertCircle}
            color="bg-amber-600"
          />
          <StatsCard
            title="Popular Items"
            value={stats.popular || 0}
            subtitle="Marked as popular"
            icon={Star}
            color="bg-orange-600"
          />
          <StatsCard
            title="Avg. Price"
            value={`₹${(stats.avgPrice || 0).toFixed(0)}`}
            subtitle="Per item"
            icon={DollarSign}
            color="bg-purple-600"
          />
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search menu items, descriptions, categories, tags..."
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value);
                   setTimeout(() => {
          searchTerm.current.focus();
        }, 0);
                }}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-48"
            >
              <option value="all">All Categories</option>
              {availableCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
            
            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-48"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="stock-desc">Stock: High to Low</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="averageRating-desc">Top Rated</option>
              <option value="totalOrders-desc">Most Ordered</option>
            </select>
            
            {/* View Mode */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Results Summary and Bulk Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 text-sm text-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span>
                Showing {filteredItems.length} of {menuItems.length} items
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedCategory !== 'all' && ` in ${selectedCategory.replace('-', ' ')}`}
              </span>
              
              {menuItems.length > 0 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onChange={selectAllItems}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    Select All ({selectedItems.length} selected)
                  </span>
                </div>
              )}
              
              {selectedItems.length > 0 && (
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Bulk Actions ({selectedItems.length})
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-xs">
              <span>Page {currentPage} of {totalPages}</span>
              <span>Last updated: {new Date().toLocaleTimeString('en-IN')}</span>
            </div>
          </div>

          {/* Bulk Actions Panel */}
          {showBulkActions && selectedItems.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkAction('enable')}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
                >
                  <Eye className="w-3 h-3 inline mr-1" />
                  Enable All
                </button>
                <button
                  onClick={() => handleBulkAction('disable')}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                >
                  <EyeOff className="w-3 h-3 inline mr-1" />
                  Disable All
                </button>
                <button
                  onClick={() => handleBulkAction('mark-popular')}
                  className="px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors"
                >
                  <Star className="w-3 h-3 inline mr-1" />
                  Mark Popular
                </button>
                <button
                  onClick={() => handleBulkAction('unmark-popular')}
                  className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
                >
                  <Star className="w-3 h-3 inline mr-1" />
                  Remove Popular
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} selected items? This action cannot be undone.`)) {
                      handleBulkAction('soft-delete');
                    }
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-3 h-3 inline mr-1" />
                  Delete Selected
                </button>
                <button
                  onClick={() => {
                    setSelectedItems([]);
                    setShowBulkActions(false);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
                >
                  <X className="w-3 h-3 inline mr-1" />
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {editingItem && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Edit className="w-6 h-6 mr-3 text-blue-600" />
              Edit Menu Item
            </h2>
            <button
              onClick={() => {
                setEditingItem(null);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <ItemForm />
        </div>
      )}

      {/* Menu Items Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredItems.map(item => (
            <ItemCard key={item._id || item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {filteredItems.map(item => (
            <div key={item._id || item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 p-4">
              <div className="flex items-center space-x-4">
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item._id || item.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems(prev => [...prev, item._id || item.id]);
                    } else {
                      setSelectedItems(prev => prev.filter(id => id !== (item._id || item.id)));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />

                {/* Image */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image?.url ? (
                    <img 
                      src={item.optimizedImage?.thumbnail || item.image.url} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    {item.isPopular && <Star className="w-4 h-4 text-orange-500 fill-current" />}
                    {item.isVegan && <Leaf className="w-4 h-4 text-green-500" title="Vegan" />}
                    {item.isVegetarian && <Heart className="w-4 h-4 text-green-500" title="Vegetarian" />}
                    {item.isGlutenFree && <Wheat className="w-4 h-4 text-amber-500" title="Gluten Free" />}
                    {item.isDairyFree && <Milk className="w-4 h-4 text-blue-500" title="Dairy Free" />}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{item.category.replace('-', ' ')}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                  )}
                </div>
                
                {/* Stock */}
                <div className="text-center">
                  <div className={`text-sm font-medium ${
                    item.stock > 10 ? 'text-emerald-600' :
                    item.stock > 0 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {item.stock}
                  </div>
                  <div className="text-xs text-gray-500">Stock</div>
                </div>
                
                {/* Price */}
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">₹{item.price}</div>
                  {item.cost && (
                    <div className="text-xs text-gray-500">
                      Profit: ₹{(item.price - item.cost).toFixed(2)}
                    </div>
                  )}
                </div>
                
                {/* Rating */}
                {item.averageRating > 0 && (
                  <div className="text-center">
                    <div className="flex items-center text-sm">
                      <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                      <span>{item.averageRating.toFixed(1)}</span>
                    </div>
                    <div className="text-xs text-gray-500">({item.totalReviews})</div>
                  </div>
                )}
                
                {/* Status */}
                <div className="text-center">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.isAvailable 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {item.isAvailable ? 'Available' : 'Hidden'}
                  </span>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.isAvailable 
                        ? 'text-red-600 hover:bg-red-100' 
                        : 'text-emerald-600 hover:bg-emerald-100'
                    }`}
                    title={item.isAvailable ? 'Hide' : 'Show'}
                  >
                    {item.isAvailable ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination />

      {/* Empty State */}
      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="bg-gray-100 p-8 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">No menu items found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search criteria or filters' 
              : 'Start by adding your first menu item with high-quality images from Cloudinary'
            }
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Item</span>
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Plus className="w-6 h-6 mr-3 text-blue-600" />
                  Add New Menu Item
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <ItemForm isModal={true} />
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for actions */}
      {loading && currentPage > 1 && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 shadow-2xl flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-700 font-medium">Loading more items...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMenuManagement;