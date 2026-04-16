import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, ChefHat } from 'lucide-react';

const OrderSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-600 mb-6">
          Your order has been sent to the kitchen. We'll prepare it right away!
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2 text-gray-700 mb-2">
            <ChefHat className="h-5 w-5" />
            <span className="font-medium">Preparing your order</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
            <Clock className="h-4 w-4" />
            <span>Estimated time: 15-25 minutes</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          You can track your order status on this page. We'll notify you when it's ready!
        </p>

        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
