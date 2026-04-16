import React, { useEffect, useState } from 'react';
import { publicApi } from '../../utils/api';
import { Category } from '../../types';

const PublicMenu: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await publicApi.getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900">Our Menu</h1>
          <p className="mt-4 text-lg text-gray-600">
            Discover our delicious selection of dishes
          </p>
        </div>

        <div className="space-y-12">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-900">
                <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                {category.description && (
                  <p className="mt-1 text-gray-300">{category.description}</p>
                )}
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items?.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        {item.description && (
                          <p className="mt-2 text-gray-600 text-sm">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No menu items available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicMenu;
