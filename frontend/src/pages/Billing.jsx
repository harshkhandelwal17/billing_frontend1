import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Minus, ShoppingCart, Trash2, 
  User, Phone, CreditCard, Printer, Check,
  Coffee, Utensils, Cookie, Wine, Package,
  AlertCircle, Loader, X, Upload, Image,
  Receipt, Calculator, IndianRupee, Clock,
  CheckCircle, XCircle, Calendar, Hash,
  Menu, ArrowLeft, Filter, Grid, List, Star,
  MapPin, Mail, Globe, Award, TrendingUp,
  Eye, Edit, Settings, MoreVertical, Bell,
  Home, ShoppingBag, ChevronsRight, Zap,
  Timer, Users, TrendingDown, BarChart3,
  DollarSign, Activity, Target, Gift
} from 'lucide-react';

const RestaurantBillingSystem = () => {
  const [currentPage, setCurrentPage] = useState('menu'); // 'menu' or 'checkout'
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [tableNumber, setTableNumber] = useState('');
  const [viewMode, setViewMode] = useState('grid');

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
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/menu');
      const items = response.data || response;
      setMenuItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      showNotification('Failed to fetch menu items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'starter': case 'appetizer': return Coffee;
      case 'main course': case 'main': return Utensils;
      case 'dessert': case 'sweet': return Cookie;
      case 'beverage': case 'drink': return Wine;
      default: return Package;
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory && item.isAvailable;
  });

  const addToCart = (item) => {
    if (item.stock <= 0) {
      showNotification(`${item.name} is out of stock`, 'error');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem._id === item._id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          showNotification(`Cannot add more ${item.name}. Stock limit: ${item.stock}`, 'warning');
          return prev;
        }
        return prev.map(cartItem =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    
    showNotification(`${item.name} added to cart`, 'success');
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item._id !== itemId));
    } else {
      const item = menuItems.find(item => item._id === itemId);
      if (newQuantity > item.stock) {
        showNotification(`Cannot exceed stock limit of ${item.stock}`, 'warning');
        return;
      }
      
      setCart(prev => prev.map(item =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeFromCart = (itemId) => {
    const item = cart.find(i => i._id === itemId);
    setCart(prev => prev.filter(item => item._id !== itemId));
    if (item) {
      showNotification(`${item.name} removed from cart`, 'info');
    }
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gst = Math.round((subtotal * 0.18) * 100) / 100;
    const discountAmount = Math.min(discount, subtotal);
    const total = subtotal + gst - discountAmount;
    
    return { 
      subtotal: Math.round(subtotal * 100) / 100, 
      gst, 
      discount: discountAmount,
      total: Math.round(total * 100) / 100 
    };
  };

  const generateBill = async () => {
    if (cart.length === 0) {
      showNotification('Cart is empty. Add items to generate bill.', 'warning');
      return;
    }

    if (!customerName.trim()) {
      showNotification('Please enter customer name', 'warning');
      return;
    }

    setIsProcessing(true);

    try {
      const billData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        tableNumber: tableNumber.trim() || null,
        items: cart.map(item => ({
          menuItemId: item._id,
          quantity: item.quantity
        })),
        discount: discount,
        paymentMethod
      };

      const response = await apiCall('/bills', {
        method: 'POST',
        body: JSON.stringify(billData)
      });

      const bill = response.data || response.bill || response;
      setCurrentBill(bill);
      setShowBillModal(true);
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setTableNumber('');
      setDiscount(0);
      setCurrentPage('menu');
      
      showNotification(`Bill #${bill.billNumber} generated successfully! 🎉`, 'success');
      
    } catch (error) {
      console.error('Generate bill error:', error);
      showNotification(`Failed to generate bill: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const { subtotal, gst, discount: discountAmount, total } = calculateTotal();

  // Enhanced Toast Notifications Component
  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`
            px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-sm
            flex items-center space-x-3
            transform transition-all duration-500 ease-out
            border border-opacity-20
            ${notification.type === 'success' ? 'bg-emerald-500/95 text-white border-emerald-400' :
              notification.type === 'warning' ? 'bg-amber-500/95 text-white border-amber-400' :
              notification.type === 'error' ? 'bg-red-500/95 text-white border-red-400' :
              'bg-blue-500/95 text-white border-blue-400'
            }
          `}
        >
          <div className="flex-shrink-0">
            {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {notification.type === 'warning' && <AlertCircle className="w-5 h-5" />}
            {notification.type === 'error' && <XCircle className="w-5 h-5" />}
            {notification.type === 'info' && <Bell className="w-5 h-5" />}
          </div>
          <span className="flex-1 text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            className="flex-shrink-0 hover:bg-white/20 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );

  // Professional Header Component
  const Header = () => (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-2 lg:p-3 rounded-xl shadow-lg">
              <Utensils className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">RestaurantPOS</h1>
              <p className="text-sm text-gray-600 hidden lg:block">Professional Billing System</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-gray-100 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setCurrentPage('menu')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentPage === 'menu' 
                  ? 'bg-white shadow-sm text-blue-600 font-semibold' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Menu</span>
            </button>
            <button
              onClick={() => setCurrentPage('checkout')}
              disabled={cart.length === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all relative ${
                currentPage === 'checkout' 
                  ? 'bg-white shadow-sm text-blue-600 font-semibold' 
                  : cart.length > 0 
                    ? 'text-gray-600 hover:text-gray-800' 
                    : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Checkout</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart Summary - Desktop */}
            {cart.length > 0 && (
              <div className="hidden lg:flex items-center space-x-3 bg-gradient-to-r from-emerald-50 to-blue-50 px-4 py-2 rounded-xl border border-emerald-200 shadow-sm">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
                <div className="flex items-center space-x-1">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  <span className="text-lg font-bold text-emerald-600">{total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setCurrentPage(currentPage === 'menu' ? 'checkout' : 'menu')}
              className="md:hidden relative p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              {currentPage === 'menu' ? <Receipt className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              {cart.length > 0 && currentPage === 'menu' && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Time Display */}
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
              <Clock className="w-4 h-4" />
              <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  // Enhanced Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse overflow-hidden">
          <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300"></div>
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Menu Page Component
  const MenuPage = () => (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search delicious items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            />
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm min-w-40"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <div className="hidden sm:flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const IconComponent = category === 'all' ? Package : getCategoryIcon(category);
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Items */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          : "space-y-4"
        }>
          {filteredItems.map(item => (
            <div key={item._id} className={`
              bg-white rounded-2xl shadow-sm border border-gray-200 
              hover:shadow-lg hover:border-blue-200 
              transition-all duration-200 group overflow-hidden
              ${viewMode === 'list' ? 'flex' : ''}
            `}>
              {/* Image */}
              <div className={`relative bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden ${
                viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'aspect-[4/3]'
              }`}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-300 flex items-center justify-center">
                  <Image className={viewMode === 'list' ? 'w-8 h-8 text-gray-400' : 'w-12 h-12 text-gray-400'} />
                </div>
                
                {/* Stock Badges */}
                {item.stock <= 5 && item.stock > 0 && (
                  <div className={`absolute ${viewMode === 'list' ? 'top-1 right-1' : 'top-2 right-2'} px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full`}>
                    {item.stock}
                  </div>
                )}
                {item.stock === 0 && (
                  <div className={`absolute ${viewMode === 'list' ? 'top-1 right-1' : 'top-2 right-2'} px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full`}>
                    Out
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className={viewMode === 'list' ? 'flex-1 p-4 flex justify-between items-center' : 'p-4'}>
                <div className={viewMode === 'list' ? 'flex-1' : ''}>
                  <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 ${
                    viewMode === 'list' ? 'text-base' : 'text-lg'
                  }`}>
                    {item.name}
                  </h3>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                    <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full font-medium ${
                      item.stock > 10 ? 'bg-emerald-100 text-emerald-700' :
                      item.stock > 0 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      <Package className="w-3 h-3" />
                      <span>{item.stock}</span>
                    </div>
                  </div>
                  
                  {item.description && viewMode === 'grid' && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  )}
                  
                  <div className={`flex items-center ${viewMode === 'list' ? 'space-x-4' : 'justify-between mb-3'}`}>
                    <div className="flex items-center space-x-1">
                      <IndianRupee className="w-4 h-4 text-emerald-600" />
                      <span className={`font-bold text-emerald-600 ${viewMode === 'list' ? 'text-lg' : 'text-xl'}`}>
                        {item.price}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => addToCart(item)}
                  disabled={item.stock === 0}
                  className={`
                    font-semibold transition-all duration-200 
                    disabled:cursor-not-allowed disabled:opacity-50 
                    disabled:bg-gray-300 
                    bg-blue-600 hover:bg-blue-700 
                    text-white rounded-xl 
                    flex items-center justify-center space-x-2
                    shadow-sm hover:shadow-md
                    ${viewMode === 'list' ? 'px-4 py-2 ml-4' : 'w-full py-3'}
                  `}
                >
                  {viewMode === 'list' ? (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </>
                  ) : (
                    item.stock === 0 ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Out of Stock</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </>
                    )
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gray-100 p-8 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No items found</h3>
          <p className="text-gray-500">Try adjusting your search or browse different categories</p>
        </div>
      )}
    </div>
  );

  // Checkout Page Component
  const CheckoutPage = () => (
    <div className="max-w-4xl mx-auto p-4 lg:p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <span className="font-semibold">Review Order</span>
          </div>
          <ChevronsRight className="w-5 h-5 text-gray-400" />
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <span>Customer Details</span>
          </div>
          <ChevronsRight className="w-5 h-5 text-gray-400" />
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <span>Payment</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <ShoppingCart className="w-6 h-6 mr-3 text-blue-600" />
                Order Summary
              </h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <ShoppingCart className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-4">Add some delicious items from the menu</p>
                <button
                  onClick={() => setCurrentPage('menu')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-200 to-purple-300 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Image className="w-8 h-8 text-gray-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                      <div className="flex items-center space-x-1 text-sm text-emerald-600 font-semibold">
                        <IndianRupee className="w-3 h-3" />
                        <span>{item.price} each</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-gray-300 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-lg w-8 text-center text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-right min-w-0">
                      <div className="flex items-center space-x-1 font-bold text-lg text-emerald-600">
                        <IndianRupee className="w-4 h-4" />
                        <span>{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Continue Shopping */}
          {cart.length > 0 && (
            <button
              onClick={() => setCurrentPage('menu')}
              className="mt-6 flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </button>
          )}
        </div>

        {/* Customer Details & Payment */}
        <div className="space-y-6">
          {cart.length > 0 && (
            <>
              {/* Customer Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <User className="w-5 h-5 mr-3 text-blue-600" />
                  Customer Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Enter customer name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Table Number
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Table"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <CreditCard className="w-5 h-5 mr-3 text-blue-600" />
                  Payment Method
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'cash', label: 'Cash', icon: '💵' },
                    { value: 'card', label: 'Card', icon: '💳' },
                    { value: 'upi', label: 'UPI', icon: '📱' },
                    { value: 'online', label: 'Online', icon: '🌐' }
                  ].map(method => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === method.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="text-2xl mb-2">{method.icon}</div>
                      <div className="font-semibold">{method.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount */}
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
                <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center">
                  <Calculator className="w-5 h-5 mr-3" />
                  Apply Discount
                </h3>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
                  <input
                    type="number"
                    placeholder="Enter discount amount"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                    min="0"
                    max={subtotal}
                    step="0.01"
                  />
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Receipt className="w-5 h-5 mr-3 text-emerald-600" />
                  Bill Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <div className="flex items-center space-x-1 font-semibold">
                      <IndianRupee className="w-4 h-4" />
                      <span>{subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>GST (18%):</span>
                    <div className="flex items-center space-x-1 font-semibold">
                      <IndianRupee className="w-4 h-4" />
                      <span>{gst.toFixed(2)}</span>
                    </div>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <div className="flex items-center space-x-1 font-semibold">
                        <span>-</span>
                        <IndianRupee className="w-4 h-4" />
                        <span>{discountAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between text-2xl font-bold text-gray-900">
                      <span>Total Amount:</span>
                      <div className="flex items-center space-x-1 text-emerald-600">
                        <IndianRupee className="w-6 h-6" />
                        <span>{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generate Bill Button */}
                <button
                  onClick={generateBill}
                  disabled={isProcessing || cart.length === 0 || !customerName.trim()}
                  className="w-full mt-6 py-4 rounded-xl font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-400 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white flex items-center justify-center space-x-3 text-lg shadow-lg hover:shadow-xl"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Generate & Print Bill</span>
                    </>
                  )}
                </button>

                {!customerName.trim() && cart.length > 0 && (
                  <p className="text-sm text-red-600 text-center mt-3 font-semibold flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Customer name is required to proceed
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Enhanced Bill Modal
  const BillModal = () => {
    if (!showBillModal || !currentBill) return null;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-8 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold flex items-center">
                  <CheckCircle className="w-8 h-8 mr-3" />
                  Bill Generated Successfully!
                </h3>
                <p className="text-emerald-100 mt-2 text-lg">Ready for printing and customer delivery</p>
              </div>
              <button
                onClick={() => setShowBillModal(false)}
                className="text-white hover:bg-white/20 p-3 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Bill Preview */}
          <div className="p-8">
            {/* Restaurant Header */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">🍽️ RestaurantPOS</h2>
              <div className="text-gray-600 space-y-2">
                <p className="flex items-center justify-center space-x-2 text-lg">
                  <MapPin className="w-5 h-5" />
                  <span>123 Main Street, Business District, City</span>
                </p>
                <p className="flex items-center justify-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>+91-9876543210</span>
                  <span>•</span>
                  <Mail className="w-4 h-4" />
                  <span>contact@restaurantpos.com</span>
                </p>
                <p className="flex items-center justify-center space-x-2 font-mono">
                  <Globe className="w-4 h-4" />
                  <span>GSTIN: 123456789012345</span>
                </p>
              </div>
            </div>

            {/* Bill Details */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl mb-8 border border-blue-100">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="font-semibold text-gray-700 block mb-2">Bill Number:</span>
                  <p className="font-mono font-bold text-blue-600 text-2xl">{currentBill.billNumber}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 block mb-2">Date & Time:</span>
                  <p className="font-semibold text-lg">{new Date(currentBill.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 block mb-2">Customer Name:</span>
                  <p className="font-bold text-xl text-gray-900">{currentBill.customerName}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 block mb-2">Payment Method:</span>
                  <p className="font-semibold text-lg capitalize bg-gray-100 px-3 py-1 rounded-lg inline-block">
                    {currentBill.paymentMethod}
                  </p>
                </div>
                {currentBill.customerPhone && (
                  <div>
                    <span className="font-semibold text-gray-700 block mb-2">Phone Number:</span>
                    <p className="font-semibold text-lg">{currentBill.customerPhone}</p>
                  </div>
                )}
                {currentBill.tableNumber && (
                  <div>
                    <span className="font-semibold text-gray-700 block mb-2">Table Number:</span>
                    <p className="font-bold text-xl text-blue-600">#{currentBill.tableNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="mb-8">
              <h4 className="font-bold text-gray-800 mb-6 flex items-center text-2xl">
                <Package className="w-6 h-6 mr-3 text-blue-600" />
                Order Items ({currentBill.items?.length || 0})
              </h4>
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="space-y-4">
                  {currentBill.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-4 px-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg">{item.name}</p>
                        <p className="text-gray-600">₹{item.price} × {item.quantity} items</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 font-bold text-2xl text-emerald-600">
                          <IndianRupee className="w-5 h-5" />
                          <span>{item.total?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-8 rounded-2xl mb-8 border-2 border-gray-200">
              <div className="space-y-4">
                <div className="flex justify-between text-gray-700 text-xl">
                  <span className="font-semibold">Subtotal:</span>
                  <div className="flex items-center space-x-1 font-bold">
                    <IndianRupee className="w-5 h-5" />
                    <span>{currentBill.subtotal?.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-gray-700 text-xl">
                  <span className="font-semibold">GST (18%):</span>
                  <div className="flex items-center space-x-1 font-bold">
                    <IndianRupee className="w-5 h-5" />
                    <span>{currentBill.gst?.toFixed(2)}</span>
                  </div>
                </div>
                {currentBill.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 text-xl">
                    <span className="font-semibold">Discount Applied:</span>
                    <div className="flex items-center space-x-1 font-bold">
                      <span>-</span>
                      <IndianRupee className="w-5 h-5" />
                      <span>{currentBill.discount?.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <div className="border-t-4 border-gray-400 pt-4">
                  <div className="flex justify-between text-3xl font-bold text-gray-900">
                    <span>TOTAL AMOUNT:</span>
                    <div className="flex items-center space-x-2 text-emerald-600">
                      <IndianRupee className="w-8 h-8" />
                      <span>{currentBill.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Messages */}
            <div className="text-center text-gray-600 border-t-2 border-gray-200 pt-8">
              <div className="space-y-3 mb-6">
                <p className="font-bold text-2xl text-gray-800 flex items-center justify-center">
                  <Star className="w-6 h-6 mr-3 text-yellow-500" />
                  Thank You for Choosing Us!
                </p>
                <p className="text-lg flex items-center justify-center">
                  <Award className="w-5 h-5 mr-2 text-blue-500" />
                  We hope you enjoyed your dining experience
                </p>
                <p className="text-base flex items-center justify-center bg-yellow-50 p-3 rounded-xl">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  <span className="font-semibold">Special Offer:</span>
                  <span className="ml-1">Rate us 5 stars & get 10% off on your next visit!</span>
                </p>
              </div>
              <div className="text-sm text-gray-500 space-y-2 bg-gray-50 p-4 rounded-xl">
                <p className="font-mono">Bill ID: {currentBill._id?.slice(-12) || 'N/A'}</p>
                <p>Generated on: {new Date().toLocaleString('en-IN')}</p>
                <p className="font-semibold">Powered by RestaurantPOS Professional System</p>
              </div>
            </div>
          </div>
          
          {/* Modal Actions */}
          <div className="p-8 border-t-2 border-gray-200 bg-gray-50 rounded-b-3xl">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowBillModal(false)}
                className="flex-1 bg-gray-600 text-white py-4 rounded-2xl hover:bg-gray-700 transition-colors font-bold text-lg flex items-center justify-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>Close</span>
              </button>
              <button
                onClick={() => {
                  // Enhanced print functionality with professional thermal receipt format
                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Receipt - ${currentBill.billNumber}</title>
                        <style>
                          @page { size: 80mm auto; margin: 2mm; }
                          * { box-sizing: border-box; }
                          body { 
                            font-family: 'Courier New', monospace; 
                            margin: 0; 
                            padding: 8px;
                            font-size: 12px; 
                            line-height: 1.3;
                            color: #000;
                          }
                          .center { text-align: center; }
                          .bold { font-weight: bold; }
                          .large { font-size: 14px; }
                          .xlarge { font-size: 16px; }
                          .header { 
                            text-align: center; 
                            border-bottom: 2px solid #000; 
                            padding-bottom: 8px; 
                            margin-bottom: 12px; 
                          }
                          .header h2 { margin: 3px 0; font-size: 18px; font-weight: bold; }
                          .header p { margin: 1px 0; font-size: 10px; }
                          .section { margin-bottom: 12px; }
                          .details-table { width: 100%; font-size: 10px; }
                          .details-table td { padding: 1px 0; }
                          .details-table .label { font-weight: bold; }
                          .items-table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin: 8px 0;
                            font-size: 10px;
                          }
                          .items-table th { 
                            border-bottom: 1px solid #000;
                            padding: 4px 2px; 
                            text-align: left; 
                            font-weight: bold;
                          }
                          .items-table td { 
                            padding: 3px 2px; 
                            border-bottom: 1px dotted #ccc;
                          }
                          .items-table .item-name { width: 50%; }
                          .items-table .qty { width: 15%; text-align: center; }
                          .items-table .price { width: 17.5%; text-align: right; }
                          .items-table .total { width: 17.5%; text-align: right; font-weight: bold; }
                          .summary-table { width: 100%; margin-top: 8px; }
                          .summary-table td { padding: 2px 0; }
                          .summary-table .label { text-align: left; }
                          .summary-table .amount { text-align: right; font-weight: bold; }
                          .total-row { 
                            font-weight: bold; 
                            font-size: 13px; 
                            border-top: 2px solid #000; 
                            padding-top: 4px;
                          }
                          .separator { 
                            border-top: 1px dashed #000; 
                            margin: 8px 0; 
                          }
                          .footer { 
                            text-align: center; 
                            font-size: 9px; 
                            margin-top: 12px;
                            padding-top: 8px;
                            border-top: 1px dashed #000;
                          }
                          .footer p { margin: 2px 0; }
                          .thank-you { 
                            font-size: 11px; 
                            font-weight: bold; 
                            margin: 8px 0; 
                          }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h2>🍽️ RESTAURANTPOS</h2>
                          <p>123 Main Street, Business District</p>
                          <p>📞 +91-9876543210</p>
                          <p>✉️ contact@restaurantpos.com</p>
                          <p>🏢 GSTIN: 123456789012345</p>
                        </div>
                        
                        <div class="section">
                          <table class="details-table">
                            <tr><td class="label">Bill No:</td><td class="bold">${currentBill.billNumber}</td></tr>
                            <tr><td class="label">Date:</td><td>${new Date(currentBill.createdAt).toLocaleDateString('en-IN')}</td></tr>
                            <tr><td class="label">Time:</td><td>${new Date(currentBill.createdAt).toLocaleTimeString('en-IN')}</td></tr>
                            <tr><td class="label">Customer:</td><td class="bold">${currentBill.customerName}</td></tr>
                            <tr><td class="label">Payment:</td><td class="bold">${currentBill.paymentMethod.toUpperCase()}</td></tr>
                            ${currentBill.customerPhone ? `<tr><td class="label">Phone:</td><td>${currentBill.customerPhone}</td></tr>` : ''}
                            ${currentBill.tableNumber ? `<tr><td class="label">Table:</td><td class="bold">#${currentBill.tableNumber}</td></tr>` : ''}
                          </table>
                        </div>
                        
                        <div class="separator"></div>
                        
                        <table class="items-table">
                          <thead>
                            <tr>
                              <th class="item-name">Item</th>
                              <th class="qty">Qty</th>
                              <th class="price">Rate</th>
                              <th class="total">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${currentBill.items?.map(item => `
                              <tr>
                                <td class="item-name">${item.name}</td>
                                <td class="qty">${item.quantity}</td>
                                <td class="price">₹${item.price}</td>
                                <td class="total">₹${item.total?.toFixed(2)}</td>
                              </tr>
                            `).join('') || ''}
                          </tbody>
                        </table>
                        
                        <div class="separator"></div>
                        
                        <table class="summary-table">
                          <tr><td class="label">Subtotal:</td><td class="amount">₹${currentBill.subtotal?.toFixed(2)}</td></tr>
                          <tr><td class="label">GST (18%):</td><td class="amount">₹${currentBill.gst?.toFixed(2)}</td></tr>
                          ${currentBill.discount > 0 ? `<tr><td class="label">Discount:</td><td class="amount" style="color: #006600;">-₹${currentBill.discount?.toFixed(2)}</td></tr>` : ''}
                          <tr class="total-row"><td class="label">TOTAL AMOUNT:</td><td class="amount">₹${currentBill.total?.toFixed(2)}</td></tr>
                        </table>
                        
                        <div class="separator"></div>
                        
                        <div class="center thank-you">
                          <p>🙏 THANK YOU FOR DINING WITH US! 🙏</p>
                          <p>😊 Please visit us again! 😊</p>
                        </div>
                        
                        <div class="center" style="font-size: 10px; margin: 8px 0;">
                          <p>⭐ Rate us 5 stars & get 10% off next visit ⭐</p>
                          <p>📱 Follow us on social media for offers</p>
                        </div>
                        
                        <div class="footer">
                          <p>Bill ID: ${currentBill._id?.slice(-12) || 'N/A'}</p>
                          <p>Printed: ${new Date().toLocaleString('en-IN')}</p>
                          <p>Software: RestaurantPOS Professional v2.0</p>
                          <p>This is a computer generated receipt</p>
                        </div>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
                  printWindow.onafterprint = () => {
                    printWindow.close();
                  };
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-bold flex items-center justify-center space-x-3 text-lg shadow-lg hover:shadow-xl"
              >
                <Printer className="w-5 h-5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-20">
            <div className="inline-flex items-center space-x-3 text-blue-600 mb-6">
              <Loader className="w-8 h-8 animate-spin" />
              <span className="text-2xl font-bold">Loading Restaurant Menu...</span>
            </div>
            <p className="text-gray-600 text-lg mb-8">Please wait while we prepare your dining experience</p>
            <LoadingSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationContainer />
      <Header />
      <BillModal />
      
      <main className="pb-4">
        {currentPage === 'menu' ? <MenuPage /> : <CheckoutPage />}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-30">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setCurrentPage('menu')}
            className={`flex flex-col items-center justify-center py-4 space-y-1 transition-all ${
              currentPage === 'menu' 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="text-xs font-semibold">Menu</span>
            {filteredItems.length > 0 && (
              <span className="text-xs text-gray-500">{filteredItems.length} items</span>
            )}
          </button>
          <button
            onClick={() => setCurrentPage('checkout')}
            disabled={cart.length === 0}
            className={`flex flex-col items-center justify-center py-4 space-y-1 transition-all relative ${
              currentPage === 'checkout' 
                ? 'text-blue-600 bg-blue-50' 
                : cart.length > 0 
                  ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-50' 
                  : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <Receipt className="w-6 h-6" />
            <span className="text-xs font-semibold">Checkout</span>
            {cart.length > 0 ? (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-emerald-600 font-bold">₹{total.toFixed(2)}</span>
                <span className="absolute -top-1 -right-4 bg-red-500 text-xs text-white rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Empty</span>
            )}
          </button>
        </div>
      </div>

      {/* Floating Action Button for Quick Add (Mobile) */}
      {currentPage === 'menu' && cart.length > 0 && (
        <button
          onClick={() => setCurrentPage('checkout')}
          className="md:hidden fixed bottom-20 right-4 w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:shadow-3xl transition-all duration-300 animate-pulse"
        >
          <div className="text-center">
            <div className="text-xs font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</div>
            <div className="text-xs">₹{total.toFixed(0)}</div>
          </div>
        </button>
      )}
    </div>
  );
};

export default RestaurantBillingSystem;