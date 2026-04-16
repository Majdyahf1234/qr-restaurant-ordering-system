import React, { useEffect, useState } from 'react';
import { orderApi } from '../../utils/api';
import { Order } from '../../types';
import { Eye, Check } from 'lucide-react';

const WaiterOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderApi.getActiveOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await orderApi.updateStatus(orderId, status);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PREPARING': return 'bg-orange-100 text-orange-800';
      case 'READY': return 'bg-green-100 text-green-800';
      case 'SERVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Active Orders</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{order.id.slice(-6)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Table {order.table?.number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.items?.length} items
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${Number(order.totalAmount).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  {order.status === 'READY' && (
                    <button
                      onClick={() => updateStatus(order.id, 'SERVED')}
                      className="text-green-600 hover:text-green-900"
                      title="Mark as Served"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <p className="p-4 text-gray-500 text-center">No active orders</p>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Order Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Table:</span>
                <span className="font-medium">Table {selectedOrder.table?.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Items:</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.quantity}x {item.menuItem?.name}</span>
                      <span>${Number(item.totalPrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${Number(selectedOrder.totalAmount).toFixed(2)}</span>
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="border-t pt-4">
                  <span className="text-gray-600">Notes:</span>
                  <p className="mt-1">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex space-x-3">
              {selectedOrder.status === 'READY' && (
                <button
                  onClick={() => {
                    updateStatus(selectedOrder.id, 'SERVED');
                    setSelectedOrder(null);
                  }}
                  className="flex-1 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Mark as Served
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterOrders;
