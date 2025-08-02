import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  DollarSign, Activity, Target, Gift,
  Wifi, WifiOff, Save, Download, RefreshCw,
  Camera, Scan, QrCode, Volume2, VolumeX,
  Percent, Tag, CreditCard as CardIcon,
  Smartphone, Banknote, Building2, UserCheck,
  ClipboardList, History, FileText, Send
} from 'lucide-react';

const RestaurantBillingSystem = () => {
  // State Management
  const [currentPage, setCurrentPage] = useState('menu');
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
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
  const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percentage'
  const [tableNumber, setTableNumber] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [printerStatus, setPrinterStatus] = useState('checking');
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [quickAccess, setQuickAccess] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [billHistory, setBillHistory] = useState([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuStats, setMenuStats] = useState({});

  // Refs
  const searchInputRef = useRef(null);
  const audioRef = useRef(null);
  const customerNameRef = useRef(null);
  const customerPhoneRef = useRef(null);
  const discountRef = useRef(null);
  // API Configuration
  const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:4000/api';

  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

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
  }, [API_BASE_URL]);

  // Notification System
  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    const notification = { id, message, type, duration };
    setNotifications(prev => [...prev, notification]);
    
    // Play sound
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      } catch (e) {
        console.log('Audio error:', e);
      }
    }
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, [soundEnabled]);

  // Network Status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotification('Connection restored! 🌐', 'success');
      syncOfflineData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      showNotification('Working offline 📱', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save cart
  useEffect(() => {
    if (autoSave && cart.length > 0) {
      localStorage.setItem('billing_cart', JSON.stringify(cart));
      localStorage.setItem('billing_customer', JSON.stringify({
        customerName,
        customerPhone,
        tableNumber,
        discount,
        discountType,
        paymentMethod
      }));
    }
  }, [cart, customerName, customerPhone, tableNumber, discount, discountType, paymentMethod, autoSave]);

  // Load saved data on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('billing_cart');
    const savedCustomer = localStorage.getItem('billing_customer');
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart.length > 0) {
          setCart(parsedCart);
          showNotification('Previous cart restored 📋', 'info');
        }
      } catch (e) {
        console.error('Error loading saved cart:', e);
      }
    }
    
    if (savedCustomer) {
      try {
        const parsedCustomer = JSON.parse(savedCustomer);
        setCustomerName(parsedCustomer.customerName || '');
        setCustomerPhone(parsedCustomer.customerPhone || '');
        setTableNumber(parsedCustomer.tableNumber || '');
        setDiscount(parsedCustomer.discount || 0);
        setDiscountType(parsedCustomer.discountType || 'amount');
        setPaymentMethod(parsedCustomer.paymentMethod || 'cash');
      } catch (e) {
        console.error('Error loading saved customer:', e);
      }
    }
  }, []);

  // Initialize
  useEffect(() => {
    Promise.all([
      fetchMenuItems(),
      fetchCategories(),
      fetchMenuStats(),
      fetchBillHistory(),
      checkPrinterStatus(),
      fetchCustomerSuggestions()
    ]);
  }, []);

  const fetchMenuItems = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      
      // Build query parameters based on backend API
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        available: 'true', // Only fetch available items for billing
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...filters
      });

      if (searchTerm) queryParams.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'all') queryParams.append('category', selectedCategory);

      const response = await apiCall(`/menu?${queryParams.toString()}`);
      
      // Handle paginated response structure from backend
      const items = response.data || [];
      setMenuItems(items);
      
      // Update stats if available
      if (response.stats) {
        setMenuStats(response.stats);
      }

    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      showNotification('Failed to fetch menu items', 'error');
      
      // Enhanced fallback data matching backend schema
      setMenuItems([
        {
          _id: '1',
          name: 'Butter Chicken',
          category: 'main-course', // Updated to match backend enum
          price: 280,
          cost: 150,
          stock: 50,
          isAvailable: true,
          isPopular: true,
          description: 'Creamy tomato-based chicken curry',
          preparationTime: 25,
          spiceLevel: 'medium',
          portionSize: 'medium',
          isVegetarian: false,
          isVegan: false,
          allergens: ['Dairy'],
          averageRating: 4.5,
          totalReviews: 128,
          image: null,
          optimizedImage: null
        },
        {
          _id: '2',
          name: 'Vegetable Biryani',
          category: 'rice',
          price: 220,
          cost: 120,
          stock: 30,
          isAvailable: true,
          isPopular: true,
          description: 'Aromatic basmati rice with mixed vegetables and spices',
          preparationTime: 35,
          spiceLevel: 'mild',
          portionSize: 'large',
          isVegetarian: true,
          isVegan: true,
          allergens: [],
          averageRating: 4.3,
          totalReviews: 95,
          image: null
        },
        {
          _id: '3',
          name: 'Garlic Naan',
          category: 'bread',
          price: 65,
          cost: 25,
          stock: 100,
          isAvailable: true,
          isPopular: false,
          description: 'Fresh baked Indian bread with garlic and herbs',
          preparationTime: 15,
          spiceLevel: 'mild',
          portionSize: 'medium',
          isVegetarian: true,
          isVegan: false,
          allergens: ['Gluten', 'Dairy'],
          averageRating: 4.2,
          totalReviews: 67,
          image: null
        },
        {
          _id: '4',
          name: 'Dal Makhani',
          category: 'curry',
          price: 180,
          cost: 80,
          stock: 25,
          isAvailable: true,
          isPopular: false,
          description: 'Rich and creamy black lentil curry',
          preparationTime: 20,
          spiceLevel: 'medium',
          portionSize: 'medium',
          isVegetarian: true,
          isVegan: false,
          allergens: ['Dairy'],
          averageRating: 4.4,
          totalReviews: 89,
          image: null
        },
        {
          _id: '5',
          name: 'Fresh Lime Soda',
          category: 'beverage',
          price: 80,
          cost: 30,
          stock: 40,
          isAvailable: true,
          isPopular: false,
          description: 'Refreshing lime soda with mint',
          preparationTime: 5,
          spiceLevel: 'mild',
          portionSize: 'medium',
          isVegetarian: true,
          isVegan: true,
          allergens: [],
          averageRating: 4.0,
          totalReviews: 45,
          image: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiCall('/menu/categories');
      console.log('Fetched categories:', response);
      if (response.success && response.data) {
        const categoryList = ['all', ...response.data.map(cat => cat.value)];
        setCategories(categoryList);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Fallback categories from backend enum
      setCategories(['all', 'starter', 'main-course', 'dessert', 'beverage', 'bread', 'rice', 'curry', 'other']);
    }
  };

  const fetchMenuStats = async () => {
    try {
      const response = await apiCall('/menu/stats');
      if (response.success) {
        setMenuStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch menu stats:', error);
    }
  };

  const fetchBillHistory = async () => {
    try {
      const response = await apiCall('/bills?limit=10');
      setBillHistory(response.data || []);
    } catch (error) {
      console.error('Failed to fetch bill history:', error);
    }
  };

  const checkPrinterStatus = async () => {
    try {
      setPrinterStatus('checking');
      const response = await apiCall('/printer/status');
      setPrinterStatus(response.status || 'offline');
      
      const printersResponse = await apiCall('/printer/printers');
      setAvailablePrinters(printersResponse.printers || []);
      
      if (printersResponse.printers?.length > 0) {
        const tvsPrinter = printersResponse.printers.find(p => 
          p.name.toLowerCase().includes('tvs') && 
          (p.name.toLowerCase().includes('rp3160') || p.name.toLowerCase().includes('gold'))
        );
        
        const thermalPrinter = tvsPrinter || printersResponse.printers.find(p => 
          p.name.toLowerCase().includes('thermal') ||
          p.name.toLowerCase().includes('pos') ||
          p.name.toLowerCase().includes('star') ||
          p.name.toLowerCase().includes('receipt')
        );
        
        const defaultPrinter = thermalPrinter || 
                              printersResponse.printers.find(p => p.isDefault) || 
                              printersResponse.printers[0];
        
        setSelectedPrinter(defaultPrinter.name);
        
        if (tvsPrinter) {
          showNotification('✅ TVS RP3160 Gold detected and ready!', 'success');
          setPrinterStatus('online');
        } else if (thermalPrinter) {
          showNotification('⚠️ Thermal printer detected. For best results, use TVS RP3160 Gold.', 'warning');
        } else {
          showNotification('❌ No thermal printer found. Install TVS RP3160 Gold drivers.', 'error');
        }
      } else {
        setPrinterStatus('offline');
        showNotification('❌ No printers found. Please install TVS RP3160 Gold drivers.', 'error');
      }
    } catch (error) {
      // console.error('Printer status check failed:', error);
      setPrinterStatus('offline');
      // showNotification('❌ Printer check failed. Will use browser print as fallback.', 'warning');
    }
  };

  const fetchCustomerSuggestions = async () => {
    try {
      const response = await apiCall('/bills?limit=50');
      const customers = [...new Set((response.data || []).map(bill => bill.customerName))];
      setCustomerSuggestions(customers.filter(name => name && name.trim()));
    } catch (error) {
      console.error('Failed to fetch customer suggestions:', error);
    }
  };

  const syncOfflineData = async () => {
    console.log('Syncing offline data...');
  };

  // Helper Functions
  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'starter': return Coffee;
      case 'main-course': case 'main': return Utensils;
      case 'dessert': case 'sweet': return Cookie;
      case 'beverage': case 'drink': return Wine;
      case 'rice': return Package;
      case 'bread': return Package;
      case 'curry': return Utensils;
      default: return Package;
    }
  };

  const getCategoryDisplayName = (category) => {
    const names = {
      'main-course': 'Main Course',
      'starter': 'Starter',
      'dessert': 'Dessert',
      'beverage': 'Beverage',
      'bread': 'Bread',
      'rice': 'Rice',
      'curry': 'Curry',
      'other': 'Other'
    };
    return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory && item.isAvailable;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  // Search with backend integration
  const handleSearch = useCallback(async (term) => {
    setSearchTerm(term);
    if (term.length >= 2) {
      try {
        // Use backend search suggestions
        const response = await apiCall(`/menu/search/suggestions?q=${encodeURIComponent(term)}`);
        if (response.success) {
          // Update menu items with search results
          setMenuItems(response.data);
        }
      } catch (error) {
        console.error('Search error:', error);
        // Fallback to local filtering
        fetchMenuItems(1, { search: term });
      }
    } else if (term.length === 0) {
      // Reset to full menu
      fetchMenuItems();
    }
  }, []);

  // Enhanced cart operations with stock validation
  const addToCart = useCallback((item) => {
    if (item.stock <= 0) {
      showNotification(`${item.name} is out of stock! 📦`, 'error');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem._id === item._id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          showNotification(`Cannot add more ${item.name}. Stock limit: ${item.stock} 🚫`, 'warning');
          return prev;
        }
        const updated = prev.map(cartItem =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
        showNotification(`${item.name} quantity updated! ➕`, 'success');
        return updated;
      }
      
      showNotification(`${item.name} added to cart! 🛒`, 'success');
      return [...prev, { ...item, quantity: 1 }];
    });
  }, [showNotification]);

  const updateQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity <= 0) {
      const item = cart.find(i => i._id === itemId);
      setCart(prev => prev.filter(item => item._id !== itemId));
      if (item) {
        showNotification(`${item.name} removed from cart! 🗑️`, 'info');
      }
    } else {
      const item = menuItems.find(item => item._id === itemId);
      if (newQuantity > item.stock) {
        showNotification(`Cannot exceed stock limit of ${item.stock} ⚠️`, 'warning');
        return;
      }
      
      setCart(prev => prev.map(item =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  }, [cart, menuItems, showNotification]);

  const removeFromCart = useCallback((itemId) => {
    const item = cart.find(i => i._id === itemId);
    setCart(prev => prev.filter(item => item._id !== itemId));
    if (item) {
      showNotification(`${item.name} removed from cart! 🗑️`, 'info');
    }
  }, [cart, showNotification]);

  const clearCart = useCallback(() => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setTableNumber('');
    setDiscount(0);
    setDiscountType('amount');
    localStorage.removeItem('billing_cart');
    localStorage.removeItem('billing_customer');
    showNotification('Cart cleared! 🧹', 'info');
  }, [showNotification]);

  // Enhanced calculations
  const calculateTotal = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gst = Math.round((subtotal * 0.18) * 100) / 100;
    
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = Math.round((subtotal * (discount / 100)) * 100) / 100;
    } else {
      discountAmount = Math.min(discount, subtotal);
    }
    
    const total = subtotal + gst - discountAmount;
    
    return { 
      subtotal: Math.round(subtotal * 100) / 100, 
      gst, 
      discount: discountAmount,
      total: Math.round(total * 100) / 100 
    };
  }, [cart, discount, discountType]);

  // Enhanced bill generation with backend integration
  const generateBill = async () => {
    if (cart.length === 0) {
      showNotification('Cart is empty! Add items to generate bill. 🛒', 'warning');
      return;
    }

    // if (!customerName.trim()) {
    //   showNotification('Please enter customer name 👤', 'warning');
    //   return;
    // }

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
        discount: calculateTotal.discount,
        paymentMethod
      };

      const response = await apiCall('/bills', {
        method: 'POST',
        body: JSON.stringify(billData)
      });

      const bill = response.data || response.bill || response;
      setCurrentBill(bill);
      setShowBillModal(true);
      
      setOrders(prev => [bill, ...prev]);
      clearCart();
      setCurrentPage('menu');
      
      showNotification(`Bill #${bill.billNumber} generated successfully! 🎉`, 'success');
      fetchBillHistory();
      
    } catch (error) {
      console.error('Generate bill error:', error);
      showNotification(`Failed to generate bill: ${error.message} ❌`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced Print Functions
  const printBill = async (bill) => {
    try {
      showNotification('Preparing bill for printing... 🖨️', 'info');
      
      await checkPrinterStatus();
      
      if (printerStatus === 'offline') {
        showNotification('Printer offline, using browser print... 🖨️', 'warning');
        printBillToBrowser(bill);
        return;
      }
      
      const response = await apiCall(`/printer/print/${bill._id}`, {
        method: 'POST',
        body: JSON.stringify({
          printerConfig: {
            connection: 'auto',
            printerName: selectedPrinter,
            retries: 3,
            fallbackToBrowser: true
          }
        })
      });

      if (response.success) {
        showNotification('✅ Bill printed successfully!', 'success');
        setBillHistory(prev => prev.map(b => 
          b._id === bill._id ? { ...b, isPrinted: true, printedAt: new Date() } : b
        ));
      } else {
        throw new Error(response.message || 'Print failed');
      }
    } catch (error) {
      console.error('Print error:', error);
      showNotification(`Print failed: ${error.message} 🖨️❌`, 'error');
      
      if (window.confirm('Printer not available. Would you like to print using browser?')) {
        printBillToBrowser(bill);
      }
    }
  };

  const printBillToBrowser = (bill) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill ${bill.billNumber}</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 5mm; }
              body { -webkit-print-color-adjust: exact; color-adjust: exact; }
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              line-height: 1.4;
              color: #000;
              background: white;
              padding: 8px;
              width: 72mm;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #000; 
              padding-bottom: 8px; 
              margin-bottom: 12px; 
            }
            .header h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
            .header p { font-size: 10px; margin: 1px 0; }
            .section { margin-bottom: 12px; }
            .bill-info { font-size: 11px; }
            .bill-info div { 
              display: flex; 
              justify-content: space-between; 
              margin: 2px 0; 
            }
            .bill-info .label { font-weight: bold; }
            .items-header { 
              border-bottom: 1px solid #000; 
              font-weight: bold; 
              padding: 4px 0; 
              font-size: 11px;
              display: flex;
              justify-content: space-between;
            }
            .item { 
              padding: 3px 0; 
              border-bottom: 1px dotted #ccc;
              font-size: 10px;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .item-name { font-weight: bold; flex: 1; }
            .item-qty { margin: 0 8px; text-align: center; min-width: 20px; }
            .item-price { text-align: right; font-weight: bold; min-width: 50px; }
            .separator { border-top: 1px dashed #000; margin: 8px 0; }
            .summary { font-size: 11px; }
            .summary-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 3px 0; 
            }
            .total-row { 
              font-weight: bold; 
              font-size: 13px; 
              border-top: 2px solid #000; 
              padding-top: 4px;
              margin-top: 8px;
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
              text-align: center;
            }
            .print-button {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              margin: 10px;
              display: block;
            }
            @media print {
              .print-button { display: none; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: center; margin-bottom: 10px;">
            <button class="print-button" onclick="window.print()">🖨️ Print Bill</button>
            <button class="print-button" style="background: #6c757d;" onclick="window.close()">❌ Close</button>
          </div>
          
          <div class="header">
            <h1>🍽️ usalwala</h1>
            <p>123 Main Street, Business District</p>
            <p>📞 +91-9876543210</p>
            <p>✉️ contact@usalwala.com</p>
            <p>🏢 GSTIN: 123456789012345</p>
          </div>
          
          <div class="section bill-info">
            <div><span class="label">Bill No:</span><span>${bill.billNumber || 'N/A'}</span></div>
            <div><span class="label">Date:</span><span>${new Date(bill.createdAt || new Date()).toLocaleDateString('en-IN')}</span></div>
            <div><span class="label">Time:</span><span>${new Date(bill.createdAt || new Date()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div><span class="label">Customer:</span><span>${bill.customerName || 'Walk-in'}</span></div>
            <div><span class="label">Payment:</span><span>${(bill.paymentMethod || 'cash').toUpperCase()}</span></div>
            ${bill.customerPhone ? `<div><span class="label">Phone:</span><span>${bill.customerPhone}</span></div>` : ''}
            ${bill.tableNumber ? `<div><span class="label">Table:</span><span>#${bill.tableNumber}</span></div>` : ''}
          </div>
          
          <div class="separator"></div>
          
          <div class="items-header">
            <span>Item</span>
            <span>Qty</span>
            <span>Amount</span>
          </div>
          
          <div class="section">
            ${(bill.items || []).map(item => `
              <div class="item">
                <div class="item-row">
                  <span class="item-name">${item.name || 'Unknown Item'}</span>
                  <span class="item-qty">${item.quantity || 1}</span>
                  <span class="item-price">₹${(item.total || 0).toFixed(2)}</span>
                </div>
                ${item.quantity > 1 ? `<div style="font-size: 9px; color: #666; margin-left: 8px;">@ ₹${item.price} each</div>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="separator"></div>
          
          <div class="section summary">
            <div class="summary-row"><span>Subtotal:</span><span>₹${(bill.subtotal || 0).toFixed(2)}</span></div>
            <div class="summary-row"><span>GST (18%):</span><span>₹${(bill.gst || 0).toFixed(2)}</span></div>
            ${(bill.discount || 0) > 0 ? `<div class="summary-row" style="color: #28a745;"><span>Discount:</span><span>-₹${bill.discount.toFixed(2)}</span></div>` : ''}
            <div class="summary-row total-row"><span>TOTAL:</span><span>₹${(bill.total || 0).toFixed(2)}</span></div>
          </div>
          
          <div class="separator"></div>
          
          <div class="thank-you">
            <p>🙏 THANK YOU FOR DINING WITH US! 🙏</p>
            <p>😊 Please visit us again! 😊</p>
          </div>
          
          <div style="text-align: center; font-size: 10px; margin: 8px 0;">
            <p>⭐ Rate us 5 stars & get 10% off next visit ⭐</p>
            <p>📱 Follow us on social media for offers</p>
          </div>
          
          <div class="footer">
            <p>Bill ID: ${bill._id?.slice(-12) || 'N/A'}</p>
            <p>Printed: ${new Date().toLocaleString('en-IN')}</p>
            <p>Software: usalwala Professional v2.0</p>
            <p>This is a computer generated receipt</p>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
            
            window.onafterprint = function() {
              setTimeout(function() {
                window.close();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    showNotification('✅ Bill opened in new window for printing!', 'success');
  };

  const testPrinter = async () => {
    try {
      showNotification('Testing printer connection... 🖨️', 'info');
      setPrinterStatus('checking');
      
      const response = await apiCall('/printer/test', {
        method: 'POST',
        body: JSON.stringify({
          connection: 'auto',
          printerName: selectedPrinter,
          retries: 2
        })
      });

      if (response.success) {
        setPrinterStatus('online');
        showNotification('✅ Printer test successful!', 'success');
      } else {
        throw new Error(response.message || 'Test failed');
      }
    } catch (error) {
      console.error('Printer test error:', error);
      setPrinterStatus('offline');
      showNotification(`❌ Printer test failed: ${error.message}`, 'error');
      
      if (window.confirm('Printer not responding. Would you like to see troubleshooting tips?')) {
        showPrinterTroubleshooting();
      }
    }
  };

  const showPrinterTroubleshooting = () => {
    const troubleshootingHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: white;">
        <h2 style="color: #333; margin-bottom: 20px;">🖨️ TVS RP3160 Gold Printer Setup</h2>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196f3;">
          <h3 style="color: #1976d2; margin-top: 0;">✨ For TVS RP3160 Gold Thermal Printer:</h3>
          <p style="margin: 0; color: #1565c0;">This is the recommended printer for restaurant POS systems</p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #4caf50; margin-bottom: 15px;">🚀 Quick Setup Steps:</h3>
          <ol style="line-height: 1.8; font-size: 15px;">
            <li><strong>Power Connection:</strong> Connect power adapter and turn ON the printer</li>
            <li><strong>USB Connection:</strong> Use original USB cable, connect to PC</li>
            <li><strong>Driver Installation:</strong> 
              <ul style="margin: 10px 0;">
                <li>Download TVS RP3160 Gold drivers from <a href="https://www.tvs-e.in" target="_blank" style="color: #2196f3;">tvs-e.in</a></li>
                <li>Run installer as Administrator</li>
                <li>Restart computer after installation</li>
              </ul>
            </li>
            <li><strong>Windows Setup:</strong> Go to Settings → Printers & Scanners → Add TVS RP3160</li>
            <li><strong>Set as Default:</strong> Right-click printer → "Set as default printer"</li>
            <li><strong>Test Print:</strong> Print test page from printer properties</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <button onclick="window.close()" style="background: #2196f3; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-right: 10px;">
            ✅ Close Guide
          </button>
          <button onclick="window.open('https://www.tvs-e.in/support', '_blank')" style="background: #4caf50; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
            📞 TVS Support
          </button>
        </div>
      </div>
    `;
    
    const troubleshootWindow = window.open('', '_blank', 'width=800,height=700,scrollbars=yes');
    troubleshootWindow.document.write(`
      <html>
        <head>
          <title>TVS RP3160 Gold - Printer Setup Guide</title>
          <style>
            body { margin: 0; background: #f5f5f5; font-family: Arial, sans-serif; }
            a { color: #2196f3; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          ${troubleshootingHTML}
        </body>
      </html>
    `);
    troubleshootWindow.document.close();
  };

  // Enhanced Toast Notifications
  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`
            px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-sm
            flex items-center space-x-3
            transform transition-all duration-500 ease-out
            border border-opacity-20 animate-slideIn
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

  // Professional Header
  const Header = () => (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-2 lg:p-3 rounded-xl shadow-lg">
              <Utensils className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">usalwala</h1>
              <p className="text-sm text-gray-600 hidden lg:block">Professional Billing System</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
              isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
              printerStatus === 'online' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
              printerStatus === 'checking' ? 'bg-amber-100 text-amber-700 animate-pulse' :
              'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
            onClick={() => {
              if (printerStatus === 'offline') {
                showPrinterTroubleshooting();
              } else {
                checkPrinterStatus();
              }
            }}
            title={
              printerStatus === 'online' ? `TVS RP3160 Gold Ready: ${selectedPrinter}` :
              printerStatus === 'checking' ? 'Detecting TVS RP3160 Gold...' :
              'TVS RP3160 Gold - Click for setup guide'
            }
            >
              <Printer className="w-3 h-3" />
              <span className="hidden sm:inline">
                {printerStatus === 'online' ? 'TVS Ready' :
                 printerStatus === 'checking' ? 'Checking...' : 'TVS Setup'}
              </span>
              <span className="sm:hidden capitalize">{printerStatus}</span>
              {printerStatus === 'offline' && <AlertCircle className="w-3 h-3" />}
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
              <Clock className="w-4 h-4" />
              <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden lg:flex items-center space-x-2">
              <button
                onClick={() => setQuickAccess(!quickAccess)}
                className={`p-2 rounded-lg transition-colors ${
                  quickAccess ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Quick Access"
              >
                <Zap className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  soundEnabled ? 'text-gray-600 hover:bg-gray-100' : 'bg-red-100 text-red-600'
                }`}
                title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              
              <button
                onClick={checkPrinterStatus}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh Printer Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setCurrentPage('menu')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                  currentPage === 'menu' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:block">Menu</span>
              </button>
              <button
                onClick={() => setCurrentPage('checkout')}
                disabled={cart.length === 0}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all text-sm font-medium relative ${
                  currentPage === 'checkout' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : cart.length > 0 
                      ? 'text-gray-600 hover:text-gray-800' 
                      : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span className="hidden sm:block">Checkout</span>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowOrderHistory(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:block">Orders</span>
              </button>
            </nav>

            {cart.length > 0 && (
              <div className="md:hidden flex items-center space-x-2 bg-gradient-to-r from-emerald-50 to-blue-50 px-3 py-2 rounded-xl border border-emerald-200">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-600">
                  ₹{calculateTotal.total}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  // Enhanced Menu Page with backend integration
  const MenuPage = () => (
    <div className="max-w-7xl mx-auto p-4 lg:p-6">
      {/* Quick Access Bar */}
      {quickAccess && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-2xl border border-blue-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Quick Actions:</span>
            </div>
            <button
              onClick={() => clearCart()}
              className="px-3 py-1 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Clear Cart
            </button>
            <button
              onClick={() => testPrinter()}
              className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 hover:bg-emerald-200 text-sm font-medium transition-colors flex items-center space-x-2"
              title="Test TVS RP3160 Gold printer"
            >
              <Printer className="w-3 h-3" />
              <span>Test TVS</span>
            </button>
            <button
              onClick={() => {
                const testBill = {
                  billNumber: `TVS-TEST-${Date.now()}`,
                  customerName: 'TVS RP3160 Gold Test',
                  items: [
                    { name: 'Test Item 1', quantity: 2, price: 150, total: 300 },
                    { name: 'Sample Food Item', quantity: 1, price: 85, total: 85 }
                  ],
                  subtotal: 385,
                  gst: 69.3,
                  total: 454.3,
                  paymentMethod: 'cash',
                  createdAt: new Date(),
                  customerPhone: '+91-9876543210',
                  tableNumber: '5'
                };
                printBillToBrowser(testBill);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center space-x-2"
              title="Test receipt format in browser"
            >
              <FileText className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setCurrentPage('checkout')}
              disabled={cart.length === 0}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Quick Checkout
            </button>
            
            {/* Menu Stats Display */}
            {menuStats.totalItems && (
              <div className="flex items-center space-x-4 ml-auto text-xs">
                <div className="bg-white px-2 py-1 rounded border">
                  <span className="text-gray-600">Total: </span>
                  <span className="font-semibold">{menuStats.totalItems}</span>
                </div>
                <div className="bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  <span className="text-emerald-600">Available: </span>
                  <span className="font-semibold text-emerald-700">{menuStats.availableItems}</span>
                </div>
                {menuStats.lowStockItems > 0 && (
                  <div className="bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    <span className="text-amber-600">Low Stock: </span>
                    <span className="font-semibold text-amber-700">{menuStats.lowStockItems}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search items, categories, or ingredients..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                // Debounced search
                setTimeout(() => {
          searchInputRef.current.focus();
          // searchInputRef.current.setSelectionRange(cursorPos, cursorPos);
        }, 0);
              }}
              className="w-full pl-12 pr-6 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  handleSearch('');
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                fetchMenuItems(1, { category: e.target.value !== 'all' ? e.target.value : undefined });
              }}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm min-w-40"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : getCategoryDisplayName(category)}
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
            
            <button
              onClick={() => fetchMenuItems()}
              className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
              title="Refresh Menu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Enhanced Category Pills with backend data */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => {
            const IconComponent = category === 'all' ? Package : getCategoryIcon(category);
            const itemCount = category === 'all' 
              ? menuItems.filter(item => item.isAvailable).length
              : menuItems.filter(item => item.category === category && item.isAvailable).length;
            
            return (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  fetchMenuItems(1, { category: category !== 'all' ? category : undefined });
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{category === 'all' ? 'All' : getCategoryDisplayName(category)}</span>
                {itemCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    selectedCategory === category 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {itemCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <span>
            Showing {filteredItems.length} of {menuItems.filter(item => item.isAvailable).length} items
            {searchTerm && ` for "${searchTerm}"`}
          </span>
          <div className="flex items-center space-x-2">
            <span>Sort by:</span>
            <select 
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm"
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                fetchMenuItems(1, { sortBy, sortOrder });
              }}
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
              <option value="averageRating-desc">Rating High-Low</option>
              <option value="stock-desc">Stock High-Low</option>
              <option value="createdAt-desc">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Menu Items with backend data integration */}
      {loading ? (
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
              {/* Enhanced Image with optimized loading */}
              <div className={`relative bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden ${
                viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'aspect-[4/3]'
              }`}>
                {item.image?.url || item.optimizedImage?.medium ? (
                  <img 
                    src={item.optimizedImage?.medium || item.image.url} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-300 flex items-center justify-center">
                    <Image className={viewMode === 'list' ? 'w-8 h-8 text-gray-400' : 'w-12 h-12 text-gray-400'} />
                  </div>
                )}
                
                {/* Enhanced Stock and Status Badges */}
                <div className="absolute top-2 right-2 flex flex-col space-y-1">
                  {item.stock <= 5 && item.stock > 0 && (
                    <div className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                      {item.stock} left
                    </div>
                  )}
                  {item.stock === 0 && (
                    <div className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      Out of Stock
                    </div>
                  )}
                  {item.isPopular && (
                    <div className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>Popular</span>
                    </div>
                  )}
                  {item.isVegan && (
                    <div className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      Vegan
                    </div>
                  )}
                  {item.isVegetarian && !item.isVegan && (
                    <div className="px-2 py-1 bg-green-400 text-white text-xs font-bold rounded-full">
                      Veg
                    </div>
                  )}
                </div>

                {/* Spice Level Indicator */}
                {item.spiceLevel && item.spiceLevel !== 'mild' && (
                  <div className="absolute bottom-2 left-2">
                    <div className={`px-2 py-1 text-xs font-bold rounded-full ${
                      item.spiceLevel === 'hot' ? 'bg-red-500 text-white' :
                      item.spiceLevel === 'extra-hot' ? 'bg-red-600 text-white' :
                      item.spiceLevel === 'medium' ? 'bg-orange-500 text-white' :
                      'bg-yellow-500 text-black'
                    }`}>
                      🌶️ {item.spiceLevel}
                    </div>
                  </div>
                )}

                {/* Quick Add Button - Grid View */}
                {viewMode === 'grid' && (
                  <button
                    onClick={() => addToCart(item)}
                    disabled={item.stock === 0}
                    className="absolute bottom-2 right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Enhanced Content */}
              <div className={viewMode === 'list' ? 'flex-1 p-4 flex justify-between items-center' : 'p-4'}>
                <div className={viewMode === 'list' ? 'flex-1' : ''}>
                  <h3 className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 ${
                    viewMode === 'list' ? 'text-base' : 'text-lg'
                  }`}>
                    {item.name}
                  </h3>
                  
                  {/* Enhanced Info Row */}
                  <div className="flex items-center space-x-2 mb-2 flex-wrap gap-1">
                    <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">
                      {getCategoryDisplayName(item.category)}
                    </span>
                    
                    {/* Stock Status */}
                    <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full font-medium ${
                      item.stock > 10 ? 'bg-emerald-100 text-emerald-700' :
                      item.stock > 0 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      <Package className="w-3 h-3" />
                      <span>{item.stock}</span>
                    </div>

                    {/* Rating */}
                    {item.averageRating > 0 && (
                      <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        <Star className="w-3 h-3" />
                        <span>{item.averageRating.toFixed(1)}</span>
                        {item.totalReviews && (
                          <span className="text-gray-500">({item.totalReviews})</span>
                        )}
                      </div>
                    )}

                    {/* Preparation Time */}
                    {item.preparationTime > 0 && (
                      <div className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        <Timer className="w-3 h-3" />
                        <span>{item.preparationTime}m</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Description */}
                  {item.description && viewMode === 'grid' && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  )}

                  {/* Allergens Warning */}
                  {item.allergens && item.allergens.length > 0 && (
                    <div className="text-xs text-red-600 mb-2 bg-red-50 px-2 py-1 rounded border border-red-200">
                      ⚠️ Contains: {item.allergens.join(', ')}
                    </div>
                  )}
                  
                  {/* Price and Add Button */}
                  <div className={`flex items-center ${viewMode === 'list' ? 'space-x-4' : 'justify-between'}`}>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1">
                        <IndianRupee className="w-4 h-4 text-emerald-600" />
                        <span className={`font-bold text-emerald-600 ${viewMode === 'list' ? 'text-lg' : 'text-xl'}`}>
                          {item.price}
                        </span>
                      </div>
                      {/* Cost and Profit Info for Admin */}
                      {item.cost && (
                        <div className="text-xs text-gray-500">
                          Cost: ₹{item.cost} | Profit: ₹{(item.price - item.cost).toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    {/* Cart Quantity Controls */}
                    {(() => {
                      const cartItem = cart.find(cartItem => cartItem._id === item._id);
                      return cartItem ? (
                        <div className="flex items-center space-x-2 bg-blue-50 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item._id, cartItem.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-blue-200 hover:border-blue-300 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4 text-blue-600" />
                          </button>
                          <span className="font-bold text-blue-700 w-8 text-center">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, cartItem.quantity + 1)}
                            disabled={cartItem.quantity >= item.stock}
                            className="w-8 h-8 rounded-lg bg-white border border-blue-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      ) : (
                        viewMode === 'list' && (
                          <button
                            onClick={() => addToCart(item)}
                            disabled={item.stock === 0}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add</span>
                          </button>
                        )
                      );
                    })()}
                  </div>
                </div>
                
                {/* Add Button - Grid View */}
                {viewMode === 'grid' && !cart.find(cartItem => cartItem._id === item._id) && (
                  <button
                    onClick={() => addToCart(item)}
                    disabled={item.stock === 0}
                    className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {item.stock === 0 ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Out of Stock</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gray-100 p-8 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No items found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? `No items match "${searchTerm}" in ${selectedCategory === 'all' ? 'any category' : getCategoryDisplayName(selectedCategory)}`
              : `No items available in ${getCategoryDisplayName(selectedCategory)}`
            }
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              handleSearch('');
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );

  // Enhanced Checkout Page
  const CheckoutPage = () => (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <span className="font-semibold">Review Order</span>
          </div>
          <ChevronsRight className="w-5 h-5 text-gray-400" />
          <div className={`flex items-center space-x-2 ${customerName ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              customerName ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>2</div>
            <span>Customer Details</span>
          </div>
          <ChevronsRight className="w-5 h-5 text-gray-400" />
          <div className={`flex items-center space-x-2 ${paymentMethod ? 'text-emerald-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              paymentMethod ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>3</div>
            <span>Payment</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <ShoppingCart className="w-6 h-6 mr-3 text-blue-600" />
                Order Summary
              </h2>
              <div className="flex items-center space-x-3">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
                  <div key={item._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-200 to-purple-300 rounded-xl flex items-center justify-center flex-shrink-0">
                      {item.image?.url || item.optimizedImage?.thumbnail ? (
                        <img 
                          src={item.optimizedImage?.thumbnail || item.image.url} 
                          alt={item.name} 
                          className="w-full h-full object-cover rounded-xl" 
                        />
                      ) : (
                        <Image className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{getCategoryDisplayName(item.category)}</p>
                      <div className="flex items-center space-x-1 text-sm text-emerald-600 font-semibold">
                        <IndianRupee className="w-3 h-3" />
                        <span>{item.price} each</span>
                      </div>
                      
                      {/* Additional item info */}
                      <div className="flex items-center space-x-2 mt-1">
                        {item.preparationTime && (
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            🕒 {item.preparationTime}m
                          </span>
                        )}
                        {item.spiceLevel && item.spiceLevel !== 'mild' && (
                          <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                            🌶️ {item.spiceLevel}
                          </span>
                        )}
                        {item.isVegan && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                            🌱 Vegan
                          </span>
                        )}
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
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-500">{item.quantity} × ₹{item.price}</p>
                      )}
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
              {/* Enhanced Customer Information */}
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
                        ref={customerNameRef}
                        type="text"
                        placeholder="Enter customer name"
                        value={customerName}
                        list="customer-suggestions"
                        onChange={(e) => {
                          const cursorPos = e.target.selectionStart;
                          setCustomerName(e.target.value);
                          setTimeout(() => {
                            if (customerNameRef.current) {
                              customerNameRef.current.focus();
                              customerNameRef.current.setSelectionRange(cursorPos, cursorPos);
                            }
                          }, 0);
                        }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                        required
                        autoFocus
                      />
                      <datalist id="customer-suggestions">
                        {customerSuggestions.map((name, index) => (
                          <option key={index} value={name} />
                        ))}
                      </datalist>
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
                          ref={customerPhoneRef}
                          type="tel"
                          placeholder="Phone"
                          value={customerPhone}
                          onChange={(e) => {setCustomerPhone(e.target.value)
                             setTimeout(() => {
          customerPhoneRef.current.focus();
        }, 0);
                          }}
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

              {/* Enhanced Payment Method */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <CreditCard className="w-5 h-5 mr-3 text-blue-600" />
                  Payment Method
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'cash', label: 'Cash', icon: Banknote, color: 'from-emerald-500 to-green-500' },
                    { value: 'card', label: 'Card', icon: CardIcon, color: 'from-blue-500 to-indigo-500' },
                    { value: 'upi', label: 'UPI', icon: Smartphone, color: 'from-purple-500 to-pink-500' },
                    { value: 'online', label: 'Online', icon: Globe, color: 'from-orange-500 to-red-500' }
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
                      <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-r ${method.color} flex items-center justify-center`}>
                        <method.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="font-semibold">{method.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Discount Section */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
                <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-3" />
                  Apply Discount
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="discountType"
                        value="amount"
                        checked={discountType === 'amount'}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="text-amber-600"
                      />
                      <span className="text-sm font-medium">Amount (₹)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="discountType"
                        value="percentage"
                        checked={discountType === 'percentage'}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="text-amber-600"
                      />
                      <span className="text-sm font-medium">Percentage (%)</span>
                    </label>
                  </div>
                  
                  <div className="relative">
                    {discountType === 'amount' ? (
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
                    ) : (
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
                    )}
                    <input
                      ref={discountRef}
                      type="number"
                      placeholder={`Enter discount ${discountType === 'amount' ? 'amount' : 'percentage'}`}
                      value={discount}
                      onChange={(e) => {setDiscount(Math.max(0, parseFloat(e.target.value) || 0));
                      setTimeout(() => {
                        discountRef.current.focus();
                      }, 0);
                    }}
                      className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                      min="0"
                      max={discountType === 'percentage' ? 100 : calculateTotal.subtotal}
                      step={discountType === 'percentage' ? 1 : 0.01}
                    />
                  </div>
                  
                  {/* Quick Discount Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {discountType === 'percentage' ? (
                      [5, 10, 15, 20].map(percent => (
                        <button
                          key={percent}
                          onClick={() => setDiscount(percent)}
                          className="px-3 py-1 bg-white text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-50 text-sm font-medium transition-colors"
                        >
                          {percent}%
                        </button>
                      ))
                    ) : (
                      [50, 100, 200, 500].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setDiscount(amount)}
                          className="px-3 py-1 bg-white text-amber-700 rounded-lg border border-amber-200 hover:bg-amber-50 text-sm font-medium transition-colors"
                        >
                          ₹{amount}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Bill Summary */}
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border border-emerald-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Receipt className="w-5 h-5 mr-3 text-emerald-600" />
                  Bill Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
                    <div className="flex items-center space-x-1 font-semibold">
                      <IndianRupee className="w-4 h-4" />
                      <span>{calculateTotal.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>GST (18%):</span>
                    <div className="flex items-center space-x-1 font-semibold">
                      <IndianRupee className="w-4 h-4" />
                      <span>{calculateTotal.gst.toFixed(2)}</span>
                    </div>
                  </div>
                  {calculateTotal.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({discountType === 'percentage' ? `${discount}%` : 'Amount'}):</span>
                      <div className="flex items-center space-x-1 font-semibold">
                        <span>-</span>
                        <IndianRupee className="w-4 h-4" />
                        <span>{calculateTotal.discount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between text-2xl font-bold text-gray-900">
                      <span>Total Amount:</span>
                      <div className="flex items-center space-x-1 text-emerald-600">
                        <IndianRupee className="w-6 h-6" />
                        <span>{calculateTotal.total.toFixed(2)}</span>
                      </div>
                    </div>
                    {paymentMethod && (
                      <div className="mt-2 text-sm text-gray-600 text-right">
                        Payment via {paymentMethod.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Order Button */}
                {autoSave && (
                  <button
                    onClick={() => {
                      localStorage.setItem('saved_order', JSON.stringify({
                        cart,
                        customerName,
                        customerPhone,
                        tableNumber,
                        discount,
                        discountType,
                        paymentMethod,
                        timestamp: new Date().toISOString()
                      }));
                      showNotification('Order saved locally! 💾', 'success');
                    }}
                    className="w-full mt-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Order</span>
                  </button>
                )}

                {/* Generate Bill Button */}
                <button
                  onClick={generateBill}
                  disabled={isProcessing || cart.length === 0}
                  className="w-full mt-4 py-4 rounded-xl font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-400 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white flex items-center justify-center space-x-3 text-lg shadow-lg hover:shadow-xl"
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
              <h2 className="text-4xl font-bold text-gray-800 mb-4">🍽️ usalwala</h2>
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
                  <span>contact@usalwala.com</span>
                </p>
                <p className="flex items-center justify-center space-x-2 font-mono">
                  <Globe className="w-4 h-4" />
                  <span>GSTIN: 123456789012345</span>
                </p>
              </div>
            </div>

            {/* Enhanced Bill Details */}
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

            {/* Enhanced Bill Summary */}
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
                <p className="font-semibold">Powered by usalwala Professional System</p>
              </div>
            </div>
          </div>
          
          {/* Enhanced Modal Actions */}
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
                onClick={() => printBill(currentBill)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-bold flex items-center justify-center space-x-3 text-lg shadow-lg hover:shadow-xl"
              >
                <Printer className="w-5 h-5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Bill ${currentBill.billNumber}`,
                      text: `Bill for ${currentBill.customerName} - Total: ₹${currentBill.total}`,
                    });
                  } else {
                    showNotification('Share not supported on this device', 'warning');
                  }
                }}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-lg flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Order History Modal
  const OrderHistoryModal = () => {
    if (!showOrderHistory) return null;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold flex items-center">
                <History className="w-6 h-6 mr-3" />
                Order History
              </h3>
              <button
                onClick={() => setShowOrderHistory(false)}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {billHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No order history</h3>
                <p className="text-gray-500">Your recent orders will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {billHistory.map((bill) => (
                  <div key={bill._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900">#{bill.billNumber}</h4>
                        <p className="text-sm text-gray-600">{bill.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">₹{bill.total}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        bill.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        bill.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {bill.status}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setCurrentBill(bill);
                            setShowBillModal(true);
                            setShowOrderHistory(false);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => printBill(bill)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Print
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 rounded-3xl shadow-2xl mb-8">
            <Utensils className="w-16 h-16 text-white mx-auto animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">usalwala</h2>
          <div className="flex items-center justify-center space-x-3 text-blue-600 mb-6">
            <Loader className="w-6 h-6 animate-spin" />
            <span className="text-xl font-semibold">Loading Restaurant System...</span>
          </div>
          <p className="text-gray-600 text-lg mb-8">Please wait while we prepare your experience</p>
          <div className="w-64 h-2 bg-gray-200 rounded-full mx-auto">
            <div className="h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse" style={{width: '70%'}}></div>
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
      <OrderHistoryModal />
      
      {/* Audio element for notifications */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBwAA" type="audio/wav" />
      </audio>
      
      <main className="pb-20 md:pb-4">
        {currentPage === 'menu' ? <MenuPage /> : <CheckoutPage />}
      </main>

      {/* Enhanced Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-30">
        <div className="grid grid-cols-3">
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
                <span className="text-xs text-emerald-600 font-bold">₹{calculateTotal.total.toFixed(0)}</span>
                <span className="absolute -top-1 -right-4 bg-red-500 text-xs text-white rounded-full w-6 h-6 flex items-center justify-center font-bold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Empty</span>
            )}
          </button>
          
          <button
            onClick={() => setShowOrderHistory(true)}
            className="flex flex-col items-center justify-center py-4 space-y-1 transition-all text-gray-600 hover:text-gray-800 hover:bg-gray-50"
          >
            <History className="w-6 h-6" />
            <span className="text-xs font-semibold">History</span>
            {billHistory.length > 0 && (
              <span className="text-xs text-gray-500">{billHistory.length} bills</span>
            )}
          </button>
        </div>
      </div>

      {/* Floating Action Button - Quick Checkout */}
      {currentPage === 'menu' && cart.length > 0 && (
        <button
          onClick={() => setCurrentPage('checkout')}
          className="md:hidden fixed bottom-24 right-4 w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:shadow-3xl transition-all duration-300 animate-bounce"
        >
          <div className="text-center">
            <div className="text-xs font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</div>
            <div className="text-xs">₹{calculateTotal.total.toFixed(0)}</div>
          </div>
        </button>
      )}

      {/* Settings FAB */}
      <button
        onClick={() => {
          showNotification('Settings panel coming soon! ⚙️', 'info');
        }}
        className="hidden md:flex fixed bottom-6 right-6 w-14 h-14 bg-gray-700 text-white rounded-full shadow-xl items-center justify-center z-40 hover:bg-gray-800 transition-colors"
      >
        <Settings className="w-6 h-6" />
      </button>
    </div>
  );
};

export default RestaurantBillingSystem;