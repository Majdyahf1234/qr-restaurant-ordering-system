import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Monitor, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const KitchenLayout: React.FC = () => {
  //const location = useLocation();Link, useLocation,
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-4">
            <Monitor className="h-6 w-6 text-orange-500" />
            <span className="text-white font-bold text-lg">Kitchen Display</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">{user?.name}</span>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default KitchenLayout;
