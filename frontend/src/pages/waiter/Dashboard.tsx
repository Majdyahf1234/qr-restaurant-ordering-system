import React, { useEffect, useState } from 'react';
import { orderApi, tableApi } from '../../utils/api';
import { Order, Table } from '../../types';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';

const WaiterDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        orderApi.getActiveOrders(),
        tableApi.getTables(),
      ]);
      setOrders(ordersRes.data);
      setTables(tablesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const readyOrders = orders.filter(o => o.status === 'READY').length;
  const occupiedTables = tables.filter(t => t.status === 'OCCUPIED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Waiter Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ready Orders</p>
              <p className="text-2xl font-bold text-gray-900">{readyOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Tables</p>
              <p className="text-2xl font-bold text-gray-900">{occupiedTables}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold p-4 border-b">Recent Orders</h2>
        <div className="divide-y">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">Table {order.table?.number}</p>
                <p className="text-sm text-gray-500">
                  {order.items?.length} items · ${Number(order.totalAmount).toFixed(2)}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'READY' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {order.status}
              </span>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="p-4 text-gray-500 text-center">No active orders</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiterDashboard;
