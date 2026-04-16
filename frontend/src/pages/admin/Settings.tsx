import React, { useEffect, useState } from 'react';
import { adminApi } from '../../utils/api';
import { Save } from 'lucide-react';

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>({});
  const [restaurantInfo, setRestaurantInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, infoRes] = await Promise.all([
        adminApi.getSettings(),
        adminApi.getRestaurantInfo(),
      ]);
      
      // Convert settings array to object
      const settingsObj: any = {};
      settingsRes.data.forEach((s: any) => {
        settingsObj[s.key] = s.value;
      });
      setSettings(settingsObj);
      setRestaurantInfo(infoRes.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save settings
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      await adminApi.updateSettings(settingsArray);
      
      // Save restaurant info
      await adminApi.updateRestaurantInfo(restaurantInfo);
      
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Restaurant Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Restaurant Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={restaurantInfo.name || ''}
                onChange={(e) => setRestaurantInfo({ ...restaurantInfo, name: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={restaurantInfo.phone || ''}
                onChange={(e) => setRestaurantInfo({ ...restaurantInfo, phone: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={restaurantInfo.email || ''}
                onChange={(e) => setRestaurantInfo({ ...restaurantInfo, email: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="text"
                value={restaurantInfo.website || ''}
                onChange={(e) => setRestaurantInfo({ ...restaurantInfo, website: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={restaurantInfo.address || ''}
                onChange={(e) => setRestaurantInfo({ ...restaurantInfo, address: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">System Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                QR Code Expiry (hours)
              </label>
              <input
                type="number"
                value={settings.qr_expiry_hours || 2}
                onChange={(e) => setSettings({ ...settings, qr_expiry_hours: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (decimal)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.tax_rate || 0.1}
                onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={settings.currency || 'USD'}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Printer Enabled
              </label>
              <select
                value={settings.printer_enabled || 'false'}
                onChange={(e) => setSettings({ ...settings, printer_enabled: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
