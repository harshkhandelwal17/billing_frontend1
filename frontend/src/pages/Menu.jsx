import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, Upload, Search, 
  Filter, Package, Eye, EyeOff, AlertCircle
} from 'lucide-react';

const MenuManagementPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Starter',
    stock: '',
    isAvailable: true
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

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const data = await apiCall('/menu');
      setMenuItems(data);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  const availableCategories = ['Starter', 'Main Course', 'Dessert', 'Beverage', 'Bread', 'Other'];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        // Update existing item
        const response = await apiCall(`/menu/${editingItem._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        
        setMenuItems(prev => prev.map(item => 
          item._id === editingItem._id ? response.menuItem : item
        ));
        
        setEditingItem(null);
      } else {
        // Create new item
        const response = await apiCall('/menu', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        
        setMenuItems(prev => [response.menuItem, ...prev]);
        setShowAddModal(false);
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Starter',
        stock: '',
        isAvailable: true
      });
      
    } catch (error) {
      alert('Failed to save item: ' + error.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      stock: item.stock.toString(),
      isAvailable: item.isAvailable
    });
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await apiCall(`/menu/${itemId}`, { method: 'DELETE' });
      setMenuItems(prev => prev.filter(item => item._id !== itemId));
    } catch (error) {
      alert('Failed to delete item: ' + error.message);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const response = await apiCall(`/menu/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...item, isAvailable: !item.isAvailable })
      });
      
      setMenuItems(prev => prev.map(menuItem => 
        menuItem._id === item._id ? response.menuItem : menuItem
      ));
    } catch (error) {
      alert('Failed to update availability: ' + error.message);
    }
  };

  const ItemCard = ({ item }) => (
    <div className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 ${
      !item.isAvailable ? 'opacity-75' : ''
    }`}>
      <div className="aspect-square bg-gray-100 rounded-t-xl overflow-hidden relative">
        <img 
          src={item.image || '/api/placeholder/200/200'} 
          alt={item.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            item.isAvailable 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            item.stock > 10 ? 'bg-green-100 text-green-800' :
            item.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            Stock: {item.stock}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
            <p className="text-sm text-gray-600">{item.category}</p>
            {item.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-bold text-green-600">₹{item.price}</span>
          {item.stock <= 5 && item.stock > 0 && (
            <div className="flex items-center text-orange-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span>Low Stock</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => toggleAvailability(item)}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              item.isAvailable
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {item.isAvailable ? (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Show
              </>
            )}
          </button>
          
          <button
            onClick={() => handleEdit(item)}
            className="flex-1 flex items-center justify-center py-2 px-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
          
          <button
            onClick={() => handleDelete(item._id)}
            className="flex-1 flex items-center justify-center py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  const ItemForm = ({ isModal = false }) => (
    <div className={isModal ? 'space-y-4' : 'space-y-6'}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {availableCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter item description"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (₹) *
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Quantity *
          </label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
            min="0"
            required
          />
        </div>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isAvailable"
          checked={formData.isAvailable}
          onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isAvailable" className="ml-2 text-sm text-gray-700">
          Available for customers
        </label>
      </div>
      
      <div className="flex space-x-4 pt-4">
        <button
          onClick={() => {
            if (isModal) {
              setShowAddModal(false);
            } else {
              setEditingItem(null);
            }
            setFormData({
              name: '',
              description: '',
              price: '',
              category: 'Starter',
              stock: '',
              isAvailable: true
            });
          }}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{editingItem ? 'Update Item' : 'Add Item'}</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border">
                <div className="aspect-square bg-gray-200 rounded-t-xl"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Menu Management</h1>
            <p className="text-gray-600">Manage your restaurant's menu items</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Item</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-48"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Edit Form */}
      {editingItem && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Edit Menu Item</h2>
          <ItemForm />
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <ItemCard key={item._id} item={item} />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No menu items found</p>
          <p className="text-gray-400">Try adjusting your search or add new items</p>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Add New Menu Item</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <ItemForm isModal={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagementPage;