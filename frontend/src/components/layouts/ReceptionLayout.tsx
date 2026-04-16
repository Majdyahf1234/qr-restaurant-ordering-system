import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Table, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ReceptionLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/reception/dashboard', icon: LayoutDashboard },
    { name: 'Tables', href: '/reception/tables', icon: Table },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-indigo-900">
            <div className="flex items-center justify-between h-16 px-4 bg-indigo-800">
              <span className="text-white font-bold text-lg">Reception</span>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-300 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    location.pathname === item.href
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col lg:w-64 bg-indigo-900">
        <div className="flex items-center h-16 px-4 bg-indigo-800">
          <span className="text-white font-bold text-lg">Reception</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                location.pathname === item.href
                  ? 'bg-indigo-800 text-white'
                  : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-500"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-gray-500">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ReceptionLayout;
