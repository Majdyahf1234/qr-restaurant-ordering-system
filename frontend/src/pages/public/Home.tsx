import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star, Users, Award } from 'lucide-react';
import { publicApi } from '../../utils/api';
import { RestaurantInfo } from '../../types';

const PublicHome: React.FC = () => {
  const [info, setInfo] = useState<RestaurantInfo | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await publicApi.getRestaurantInfo();
        setInfo(response.data);
      } catch (error) {
        console.error('Failed to fetch restaurant info:', error);
      }
    };
    fetchInfo();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gray-900">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {info?.name || 'Your Restaurant'}
          </h1>
          <p className="mt-6 text-xl text-gray-300 max-w-3xl">
            Experience the finest dining with our carefully crafted menu. 
            Fresh ingredients, expert chefs, and an unforgettable atmosphere.
          </p>
          <div className="mt-10 flex space-x-4">
            <Link
              to="/menu"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-100"
            >
              View Our Menu
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Why Choose Us
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Quality Food</h3>
              <p className="mt-2 text-gray-500">
                We use only the freshest ingredients sourced from local suppliers.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Expert Chefs</h3>
              <p className="mt-2 text-gray-500">
                Our team of experienced chefs creates culinary masterpieces.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mx-auto">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Award Winning</h3>
              <p className="mt-2 text-gray-500">
                Recognized for excellence in dining experience and service.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to dine with us?</span>
            <span className="block text-blue-200">Scan the QR code at your table to order.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/menu"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                Browse Menu
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicHome;
