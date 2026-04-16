import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Utensils, Phone, Clock, MapPin } from 'lucide-react';

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Utensils className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Your Restaurant</span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link to="/menu" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Menu
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <div className="space-y-2">
                <p className="flex items-center text-gray-400">
                  <MapPin className="h-5 w-5 mr-2" />
                  123 Main Street, City
                </p>
                <p className="flex items-center text-gray-400">
                  <Phone className="h-5 w-5 mr-2" />
                  +1 234 567 8900
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Opening Hours</h3>
              <div className="space-y-2 text-gray-400">
                <p className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Mon - Thu: 9:00 AM - 10:00 PM
                </p>
                <p className="ml-7">Fri - Sat: 9:00 AM - 11:00 PM</p>
                <p className="ml-7">Sun: 10:00 AM - 9:00 PM</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Staff Login</h3>
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-100"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Your Restaurant. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
