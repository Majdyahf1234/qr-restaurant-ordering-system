import React, { useEffect, useState } from 'react';
import { menuApi } from '../../utils/api';
import { MenuItem, Category } from '../../types';
import { Plus, Edit, Trash, Check, X } from 'lucide-react';

const AdminMenu: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        menuApi.getItems({ includeUnavailable: true, includePrivate: true }),
        menuApi.getCategories(),
      ]);
      setItems(itemsRes.data);
      setCategories(catsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await menuApi.updateItem(editingItem.id, formData);
      } else {
        await menuApi.createItem(formData);
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await menuApi.deleteItem(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await menuApi.updateAvailability(item.id, !item.isAvailable);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menu Items</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setFormData({});
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Item
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-full object-cover mr-3" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500">{item.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {categories.find(c => c.id === item.categoryId)?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${Number(item.price).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`p-1 rounded ${item.isAvailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                  >
                    {item.isAvailable ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setFormData(item);
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'Edit Item' : 'Add Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  required
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable ?? true}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="mr-2"
                  />
                  Available
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPublic ?? true}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="mr-2"
                  />
                  Public
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMenu;
