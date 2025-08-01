import React, { useState, useEffect } from 'react';
import { 
  Home, Receipt, Menu, Users, BarChart3, 
  Eye, Settings, LogOut, Utensils, User, 
  X, Menu as MenuIcon, ChevronLeft
} from 'lucide-react';

const Sidebar = ({ 
  currentPage = 'dashboard', 
  setCurrentPage = () => {}, 
  user = { username: 'John Doe', role: 'admin' }, 
  onLogout = () => {} 
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle mobile menu and window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home, 
      color: 'text-slate-600'
    },
    { 
      id: 'billing', 
      label: 'Billing', 
      icon: Receipt, 
      color: 'text-slate-600'
    },
    { 
      id: 'menu', 
      label: 'Menu Management', 
      icon: Menu, 
      color: 'text-slate-600'
    },
    { 
      id: 'employees', 
      label: 'Employees', 
      icon: Users, 
      color: 'text-slate-600'
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3, 
      color: 'text-slate-600'
    },
    { 
      id: 'bills', 
      label: 'Bills History', 
      icon: Eye, 
      color: 'text-slate-600'
    },
    ...(user.role === 'admin' ? [{
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      color: 'text-slate-600'
    }] : []),
  ];

  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);
    setIsMobileOpen(false);
  };

  // Mobile Overlay
  const MobileOverlay = () => (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-200 ${
        isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setIsMobileOpen(false)}
    />
  );

  // Mobile Menu Button
  const MobileMenuButton = () => (
    <button
      onClick={() => setIsMobileOpen(true)}
      className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200"
    >
      <MenuIcon className="w-5 h-5 text-gray-700" />
    </button>
  );

  const SidebarContent = () => (
    <div className={`bg-white shadow-sm min-h-screen flex flex-col border-r border-gray-200 transition-all duration-200 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Restaurant POS</h2>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            )}
          </div>
          
          {/* Close/Collapse buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{user.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left rounded-lg transition-colors duration-150 ${
                  isActive 
                    ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`} />
                
                {!isCollapsed && (
                  <span className="font-medium text-sm truncate">{item.label}</span>
                )}
                
                {isActive && isCollapsed && (
                  <div className="absolute right-2 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-2 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>

      {/* Version Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-500">Version 1.0.0</p>
            <p className="text-xs text-gray-400">© 2025 Restaurant POS</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <MobileMenuButton />
      
      {/* Mobile Overlay */}
      <MobileOverlay />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block relative  ">
        <SidebarContent />
      </div>
      
      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-200 ease-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;