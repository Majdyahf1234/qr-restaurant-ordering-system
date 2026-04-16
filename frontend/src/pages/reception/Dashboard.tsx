import React, { useEffect, useState } from 'react';
import { tableApi } from '../../utils/api';
import { Table } from '../../types';
import { Users, CheckCircle, XCircle } from 'lucide-react';

const ReceptionDashboard: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 30000);
    return () => clearInterval(interval);
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

  const freeTables = tables.filter(t => t.status === 'FREE').length;
  const occupiedTables = tables.filter(t => t.status === 'OCCUPIED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reception Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Free Tables</p>
              <p className="text-2xl font-bold text-gray-900">{freeTables}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <XCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Occupied Tables</p>
              <p className="text-2xl font-bold text-gray-900">{occupiedTables}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tables</p>
              <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">Table Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`p-4 rounded-lg border-2 text-center ${
                table.status === 'FREE'
                  ? 'border-green-500 bg-green-50'
                  : table.status === 'OCCUPIED'
                  ? 'border-red-500 bg-red-50'
                  : 'border-yellow-500 bg-yellow-50'
              }`}
            >
              <p className="font-bold text-lg">{table.number}</p>
              <p className="text-xs text-gray-600 capitalize">{table.status.toLowerCase()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReceptionDashboard;
