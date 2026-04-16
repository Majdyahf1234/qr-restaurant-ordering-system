import React, { useEffect, useState } from 'react';
import { kitchenApi } from '../../utils/api';
import { useSocket } from '../../contexts/SocketContext';
import { Order } from '../../types';
import { Clock, Check, ChefHat, AlertCircle } from 'lucide-react';

const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { socket, joinKitchen } = useSocket();

  useEffect(() => {
    fetchOrders();
    fetchStats();
    
    const interval = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    joinKitchen();

    if (socket) {
      socket.on('order:created', () => {
        fetchOrders();
      });

      socket.on('order:itemsAdded', () => {
        fetchOrders();
      });
    }

    return () => {
      socket?.off('order:created');
      socket?.off('order:itemsAdded');
    };
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const response = await kitchenApi.getOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await kitchenApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const markItemPreparing = async (itemId: string) => {
    try {
      await kitchenApi.markItemPreparing(itemId);
      fetchOrders();
    } catch (error) {
      console.error('Failed to mark item:', error);
    }
  };

  const markItemReady = async (itemId: string) => {
    try {
      await kitchenApi.markItemReady(itemId);
      fetchOrders();
    } catch (error) {
      console.error('Failed to mark item ready:', error);
    }
  };

  const markOrderReady = async (orderId: string) => {
    try {
      await kitchenApi.markOrderReady(orderId);
      fetchOrders();
    } catch (error) {
      console.error('Failed to mark order ready:', error);
    }
  };

  const getItemColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'border-yellow-500 bg-yellow-900/20';
      case 'PREPARING':
        return 'border-blue-500 bg-blue-900/20';
      case 'READY':
        return 'border-green-500 bg-green-900/20';
      default:
        return 'border-gray-500 bg-gray-900/20';
    }
  };

  const getTimeElapsed = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    return minutes;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Stats Bar */}
      {stats && (
        <div className="flex space-x-4 mb-4">
          <div className="bg-yellow-900/50 px-4 py-2 rounded-lg border border-yellow-500">
            <span className="text-yellow-400 font-bold">{stats.items.pending}</span>
            <span className="text-yellow-200 ml-2">Pending</span>
          </div>
          <div className="bg-blue-900/50 px-4 py-2 rounded-lg border border-blue-500">
            <span className="text-blue-400 font-bold">{stats.items.preparing}</span>
            <span className="text-blue-200 ml-2">Preparing</span>
          </div>
          <div className="bg-green-900/50 px-4 py-2 rounded-lg border border-green-500">
            <span className="text-green-400 font-bold">{stats.items.ready}</span>
            <span className="text-green-200 ml-2">Ready</span>
          </div>
        </div>
      )}

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className={`border-2 rounded-lg p-4 ${
              order.status === 'PENDING'
                ? 'border-yellow-500'
                : order.status === 'PREPARING'
                ? 'border-blue-500'
                : 'border-gray-600'
            } bg-gray-800`}
          >
            {/* Order Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Table {order.table?.number}
                </h3>
                <p className="text-sm text-gray-400">
                  Order #{order.id.slice(-6)}
                </p>
              </div>
              <div className="flex items-center text-orange-400">
                <Clock className="h-4 w-4 mr-1" />
                <span className="font-mono">{getTimeElapsed(order.createdAt)}m</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className={`p-2 rounded border ${getItemColor(item.status)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-white">
                        {item.quantity}x {item.menuItem?.name}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-gray-400 mt-1">{item.notes}</p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      {item.status === 'PENDING' && (
                        <button
                          onClick={() => markItemPreparing(item.id)}
                          className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          title="Mark Preparing"
                        >
                          <ChefHat className="h-4 w-4" />
                        </button>
                      )}
                      {item.status === 'PREPARING' && (
                        <button
                          onClick={() => markItemReady(item.id)}
                          className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                          title="Mark Ready"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => markOrderReady(order.id)}
                className="flex-1 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
              >
                All Ready
              </button>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <AlertCircle className="h-16 w-16 mb-4" />
          <p className="text-xl">No active orders</p>
          <p className="text-sm">New orders will appear here</p>
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
