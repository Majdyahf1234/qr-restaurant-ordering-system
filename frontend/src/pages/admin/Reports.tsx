import React, { useState } from 'react';
import { reportApi } from '../../utils/api';
import { Download, BarChart3 } from 'lucide-react';

const AdminReports: React.FC = () => {
  const [reportType, setReportType] = useState('sales');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!fromDate || !toDate) return;
    
    setLoading(true);
    try {
      let response;
      switch (reportType) {
        case 'sales':
          response = await reportApi.getSales({ from: fromDate, to: toDate });
          break;
        case 'items':
          response = await reportApi.getItems({ from: fromDate, to: toDate });
          break;
        case 'tables':
          response = await reportApi.getTables({ from: fromDate, to: toDate });
          break;
        case 'waiters':
          response = await reportApi.getWaiters({ from: fromDate, to: toDate });
          break;
      }
      setReportData(response?.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;
    reportApi.exportCSV(reportType, { from: fromDate, to: toDate });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="sales">Sales Report</option>
              <option value="items">Item Sales</option>
              <option value="tables">Table Usage</option>
              <option value="waiters">Waiter Performance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={generateReport}
              disabled={loading || !fromDate || !toDate}
              className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Generate
            </button>
            {reportData && (
              <button
                onClick={exportCSV}
                className="py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <Download className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {reportData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Report Results</h2>
          
          {reportData.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(reportData.summary).map(([key, value]: [string, any]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-xl font-bold">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {reportData.data && reportData.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(reportData.data[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.data.map((row: any, index: number) => (
                    <tr key={index}>
                      {Object.values(row).map((value: any, i: number) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeof value === 'number' ? value.toFixed(2) : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
