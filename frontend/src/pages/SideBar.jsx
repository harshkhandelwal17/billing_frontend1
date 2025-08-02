import React, { useState, useEffect } from 'react';
import { 
  Home, Receipt, Menu, Users, BarChart3, 
  Eye, Settings, LogOut, Utensils, User, 
  X, ChevronLeft, ChevronRight
} from 'lucide-react';

const Sidebar = ({ 
  currentPage = 'dashboard', 
  setCurrentPage = () => {}, 
  user = { username: 'John Doe', role: 'admin' }, 
  onLogout = () => {} 
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
      if (window.innerWidth < 1024) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'menu', label: 'Menu Management', icon: Menu },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'bills', label: 'Bills History', icon: Eye },
    ...(user.role === 'admin' ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
  ];

  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);
    setIsMobileOpen(false);
  };

  // Mobile Overlay
  const MobileOverlay = () => (
    <div 
      className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
        isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setIsMobileOpen(false)}
    />
  );

  // Mobile Menu Button
  const MobileMenuButton = () => (
    <button
      onClick={() => setIsMobileOpen(true)}
      className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white shadow-md rounded-lg border border-gray-300 hover:shadow-lg transition-all duration-200"
    >
      <Menu className="w-5 h-5 text-gray-600" />
    </button>
  );

  const SidebarContent = () => (
    <div className={`bg-white shadow-lg h-screen flex flex-col border-r border-gray-300 transition-all duration-500 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-56 sm:w-64'
    }`}>
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-300 bg-blue-600 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            {!isCollapsed && (
              <div className="transition-opacity duration-300 ease-in-out">
                <h2 className="font-semibold text-white text-sm sm:text-base">Restaurant POS</h2>
                <p className="text-xs text-blue-100">Management System</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 text-blue-100 hover:text-white hover:bg-blue-500 rounded-md transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1.5 text-blue-100 hover:text-white hover:bg-blue-500 rounded-md transition-all duration-200"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-3 sm:p-4 border-b border-gray-300 bg-gray-50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 transition-opacity duration-300 ease-in-out">
              <p className="font-medium text-gray-800 text-sm truncate">{user.username}</p>
              <p className="text-xs text-gray-600 capitalize">{user.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 sm:p-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button
                  onClick={() => handlePageChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 sm:py-3 text-left rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  
                  {!isCollapsed && (
                    <span className="font-medium text-sm truncate transition-opacity duration-300 ease-in-out">{item.label}</span>
                  )}
                  
                  {isActive && isCollapsed && (
                    <div className="absolute right-2 w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </button>

                {/* Tooltip for collapsed state */}
                {isCollapsed && hoveredItem === item.id && (
                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50 px-3 py-2 bg-gray-800 text-white text-sm rounded-md shadow-lg whitespace-nowrap pointer-events-none">
                    {item.label}
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-800"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-2 sm:p-3 border-t border-gray-300 flex-shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 sm:py-3 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200"
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm transition-opacity duration-300 ease-in-out">Logout</span>}
        </button>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-gray-300 bg-gray-50 flex-shrink-0 transition-opacity duration-300 ease-in-out">
          <div className="text-center">
            <p className="text-xs text-gray-500">Version 2.1.0</p>
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
      
      {/* Desktop Sidebar - Fixed Position */}
      <div className={`hidden lg:block fixed left-0 top-0 h-screen z-30 transition-all duration-500 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        <SidebarContent />
      </div>
      
      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ease-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent />
      </div>

      {/* Spacer for main content on desktop */}
      <div className={`hidden lg:block transition-all duration-500 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}></div>
    </>
  );
};

export default Sidebar;