import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Users, 
  Trophy, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Star,
  Calendar,
  Briefcase,
  Users2,
  UserCog
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SaveStatus from './SaveStatus';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, userRole, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Dream Book', href: '/dream-book', icon: BookOpen },
    { name: 'Week Ahead', href: '/dreams-week-ahead', icon: Calendar },
    { name: 'Dream Connect', href: '/dream-connect', icon: Users },
    { name: 'Career Book', href: '/career-book', icon: Briefcase },
    { name: 'Scorecard', href: '/scorecard', icon: Trophy },
  ];

  // TEMPORARILY DISABLED: Add role-specific navigation (RBAC will be re-enabled later)
  // All users can now see coaching and admin pages for development/testing
  navigation.push({ name: 'Dream Coach', href: '/dream-coach', icon: Users2 });
  navigation.push({ name: 'People Hub', href: '/people', icon: UserCog });
  // ADMIN PAGE TEMPORARILY HIDDEN
  // navigation.push({ name: 'Admin', href: '/admin', icon: Settings });
  
  // Original RBAC logic (commented out for now):
  // if (userRole === 'coach' || userRole === 'manager' || userRole === 'admin') {
  //   navigation.push({ name: 'Dream Coach', href: '/dream-coach', icon: Users2 });
  // }
  // 
  // if (userRole === 'manager' || userRole === 'admin') {
  //   navigation.push({ name: 'People Hub', href: '/people', icon: UserCog });
  // }
  // 
  // if (userRole === 'admin') {
  //   navigation.push({ name: 'Admin', href: '/admin', icon: Settings });
  // }

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full overflow-y-auto overscroll-contain scrollbar-clean">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="DreamSpace Logo" 
                className="w-8 h-8 rounded-lg object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-8 h-8 bg-gradient-to-br from-netsurit-red to-netsurit-orange rounded-lg items-center justify-center hidden">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">DreamSpace</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=EC4B5C&color=fff&size=100`;
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.office} • {userRole}
                </p>
              </div>
            </div>
            <button 
              onClick={() => logout()}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top bar for mobile */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-br from-netsurit-red to-netsurit-orange rounded flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">DreamSpace</h1>
            </div>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 overflow-y-auto overscroll-contain scrollbar-clean">
          {children}
        </main>
      </div>
      
      {/* Save Status Indicator */}
      <SaveStatus />
    </div>
  );
};

export default Layout;