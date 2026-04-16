import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { tableApi, qrApi } from '../../utils/api';
import { Table } from '../../types';
import { Printer, Users } from 'lucide-react';

const ReceptionTables: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [qrData, setQrData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 30000); // Refresh every 30s
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

  const generateQR = async (table: Table) => {
    setGenerating(true);
    setSelectedTable(table);
    try {
      const response = await qrApi.generate(table.id);
      setQrData(response.data);
    } catch (error) {
      console.error('Failed to generate QR:', error);
    } finally {
      setGenerating(false);
    }
  };

  const printQR = async (table: Table) => {
    try {
      const response = await qrApi.print(table.id);
      const printData = response.data.printData;
      
      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - Table ${printData.tableNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                .qr-code { margin: 20px 0; }
                .table-number { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                .note { font-size: 14px; color: #666; margin-top: 10px; }
              </style>
            </head>
            <body>
              <div class="table-number">Table ${printData.tableNumber}</div>
              <div class="qr-code">
                <img src="${printData.qrCode}" width="200" height="200" />
              </div>
              <div class="note">${printData.note}</div>
              <div class="note">Scan to order</div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Failed to print QR:', error);
    }
  };

  const closeTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to close this table? This will deactivate the QR code.')) {
      return;
    }
    try {
      await tableApi.closeTable(tableId);
      fetchTables();
    } catch (error) {
      console.error('Failed to close table:', error);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Table Management</h1>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`p-4 rounded-lg border-2 ${
              table.status === 'OCCUPIED'
                ? 'border-red-500 bg-red-50'
                : table.status === 'RESERVED'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-green-500 bg-green-50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">Table {table.number}</h3>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                {table.capacity}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              Status: <span className="font-medium capitalize">{table.status.toLowerCase()}</span>
            </p>

            <div className="space-y-2">
              {table.status === 'FREE' ? (
                <button
                  onClick={() => generateQR(table)}
                  disabled={generating}
                  className="w-full py-2 px-3 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {generating && selectedTable?.id === table.id ? 'Generating...' : 'Generate QR'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => printQR(table)}
                    className="w-full py-2 px-3 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 flex items-center justify-center"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print QR
                  </button>
                  <button
                    onClick={() => closeTable(table.id)}
                    className="w-full py-2 px-3 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                  >
                    Close Table
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {qrData && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Table {selectedTable.number}
              </h2>
              <p className="text-gray-600 mb-6">Scan to place an order</p>
              
              <div className="flex justify-center mb-6">
                <QRCodeSVG
                  value={qrData.orderUrl}
                  size={250}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>QR Code - Table ${selectedTable.number}</title>
                            <style>
                              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                              .qr-code { margin: 20px 0; }
                              .table-number { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                              .note { font-size: 14px; color: #666; margin-top: 10px; }
                            </style>
                          </head>
                          <body>
                            <div class="table-number">Table ${selectedTable.number}</div>
                            <div class="qr-code">
                              <img src="${qrData.qrCode}" width="200" height="200" />
                            </div>
                            <div class="note">Scan to order</div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 flex items-center justify-center"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Print
                </button>
                <button
                  onClick={() => {
                    setQrData(null);
                    setSelectedTable(null);
                    fetchTables();
                  }}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionTables;
