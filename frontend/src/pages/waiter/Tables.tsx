import React, { useEffect, useState } from 'react';
import { tableApi, orderApi } from '../../utils/api';
import { Table, Order } from '../../types';
import { DollarSign } from 'lucide-react';

const WaiterTables: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await tableApi.getTables();
      setTables(response.data);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewTable = async (table: Table) => {
    setSelectedTable(table);
    try {
      const response = await orderApi.getOrdersByTable(table.id);
      setTableOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch table orders:', error);
    }
  };

  const requestBill = async (orderId: string) => {
    try {
      await orderApi.requestBill(orderId);
      alert('Bill requested');
    } catch (error) {
      console.error('Failed to request bill:', error);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tables</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => viewTable(table)}
            className={`p-4 rounded-lg border-2 text-left ${
              table.status === 'FREE'
                ? 'border-green-500 bg-green-50'
                : table.status === 'OCCUPIED'
                ? 'border-red-500 bg-red-50'
                : 'border-yellow-500 bg-yellow-50'
            }`}
          >
            <p className="font-bold text-lg">Table {table.number}</p>
            <p className="text-sm text-gray-600 capitalize">{table.status.toLowerCase()}</p>
            <p className="text-sm text-gray-500">Capacity: {table.capacity}</p>
          </button>
        ))}
      </div>

      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Table {selectedTable.number}</h2>
            
            {tableOrders.length > 0 ? (
              <div className="space-y-4">
                {tableOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Order #{order.id.slice(-6)}</p>
                        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'READY' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items?.map((item) => (
                        <p key={item.id} className="text-sm">
                          {item.quantity}x {item.menuItem?.name}
                        </p>
                      ))}
                    </div>
                    <div className="flex justify-between items-center border-t pt-3">
                      <p className="font-bold">Total: ${Number(order.totalAmount).toFixed(2)}</p>
                      {order.status !== 'PAID' && (
                        <button
                          onClick={() => requestBill(order.id)}
                          className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Request Bill
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No orders for this table</p>
            )}

            <button
              onClick={() => setSelectedTable(null)}
              className="mt-6 w-full py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterTables;
