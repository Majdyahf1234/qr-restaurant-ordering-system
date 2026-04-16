import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Users,
  ShoppingBag,
  Table,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { adminApi } from '../../utils/api';
import { DashboardStats } from '../../types';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const formatMoney = (value: unknown) => Number(value || 0).toFixed(2);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminApi.getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: { value: number; isPositive: boolean };
  }> = ({ title, value, icon: Icon, trend }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {trend.value}%
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Revenue"
          value={`$${formatMoney(stats?.revenue?.today)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Today's Orders"
          value={stats?.orders?.today || 0}
          icon={ShoppingBag}
        />
        <StatCard
          title="Active Tables"
          value={`${stats?.tables?.occupied || 0} / ${stats?.tables?.total || 0}`}
          icon={Table}
        />
        <StatCard
          title="Active Staff"
          value={stats?.counts?.staff || 0}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Comparison</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Today</span>
              <span className="font-bold">${formatMoney(stats?.revenue?.today)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Yesterday</span>
              <span className="font-bold">${formatMoney(stats?.revenue?.yesterday)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Week</span>
              <span className="font-bold">${formatMoney(stats?.revenue?.thisWeek)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Month</span>
              <span className="font-bold">${formatMoney(stats?.revenue?.thisMonth)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h2>
          {stats?.topItems && stats.topItems.length > 0 ? (
            <div className="space-y-3">
              {stats.topItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="text-sm text-gray-500">{item.quantity} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No sales data available</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{stats?.orders?.pending || 0}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">-</p>
            <p className="text-sm text-gray-600">Preparing</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">-</p>
            <p className="text-sm text-gray-600">Ready</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats?.orders?.active || 0}</p>
            <p className="text-sm text-gray-600">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;