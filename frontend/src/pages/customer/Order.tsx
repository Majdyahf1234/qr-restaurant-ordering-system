import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Minus, ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { menuApi, orderApi, qrApi } from '../../utils/api';
import { Category, MenuItem, CartItem, Order } from '../../types';

const CustomerOrder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    

const handleRequestBill = async () => {
  if (!activeOrder || !token) return;

  try {
    const response = await orderApi.requestCustomerBill(activeOrder.id, {
      qrSessionToken: token,
    });
    setActiveOrder(response.data);
    alert('Bill requested successfully');
  } catch (error) {
    console.error('Failed to request bill:', error);
    alert('Failed to request bill');
  }
};
  useEffect(() => {
    if (!token) {
      setSessionValid(false);
      setLoading(false);
      return;
    }


    const validateAndLoad = async () => {
      try {
        // Validate QR session
        const sessionResponse = await qrApi.validate(token);
        setSessionValid(true);
        setTableInfo(sessionResponse.data.session);

        // Load menu with prices
        const menuResponse = await menuApi.getItems({ includeUnavailable: false, includePrivate: false });
        
        // Group items by category
        const items = menuResponse.data;
        const catsResponse = await menuApi.getCategories();
        const cats = catsResponse.data;
        
        const currentOrderResponse = await orderApi.getCustomerCurrentOrder(token);
setActiveOrder(currentOrderResponse.data.order);

        // Merge items into categories
        const catsWithItems = cats.map((cat: Category) => ({
          ...cat,
          items: items.filter((item: MenuItem) => item.categoryId === cat.id)
        })).filter((cat: Category) => cat.items && cat.items.length > 0);
        
        setCategories(catsWithItems);
      } catch (error) {
        console.error('Failed to validate session or load menu:', error);
        setSessionValid(false);
      } finally {
        setLoading(false);
      }
    };

    validateAndLoad();
  }, [token]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
          imageUrl: item.imageUrl,
        },
      ];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.menuItemId === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.menuItemId !== itemId);
    });
  };

  const getCartItemQuantity = (itemId: string) => {
    return cart.find((i) => i.menuItemId === itemId)?.quantity || 0;
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const submitOrder = async () => {
  if (cart.length === 0 || !tableInfo || !token) return;

  setSubmitting(true);
  try {
    const payloadItems = cart.map((item) => ({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      notes: item.notes,
    }));

    let response;

    if (activeOrder) {
      response = await orderApi.addCustomerItems(activeOrder.id, {
        qrSessionToken: token,
        items: payloadItems,
      });
    } else {
      response = await orderApi.createOrder({
        tableId: tableInfo.tableId,
        qrSessionToken: token,
        items: payloadItems,
        notes,
      });
    }

    setActiveOrder(response.data);
    setCart([]);
    setNotes('');
    setShowCart(false);
    alert('Order sent successfully');
  } catch (error) {
    console.error('Failed to submit order:', error);
    alert('Failed to submit order. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (sessionValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid QR Code</h1>
          <p className="text-gray-600 mb-6">
            This QR code is invalid, expired, or has been deactivated. Please ask staff for a new QR code.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  const allItems = categories.flatMap((cat) => cat.items || []);
  const filteredItems = selectedCategory === 'all' 
    ? allItems 
    : categories.find(c => c.id === selectedCategory)?.items || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order Menu</h1>
              <p className="text-sm text-gray-500">Table {tableInfo?.tableNumber}</p>
            </div>
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative p-2 text-gray-600 hover:text-gray-900"
            >
              <ShoppingCart className="h-6 w-6" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Menu */}
          <div className="flex-1">
            {/* Category filter */}
            <div className="mb-6 overflow-x-auto">
              <div className="flex space-x-2 pb-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden flex"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-24 h-24 object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                  )}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-blue-600">
                        ${Number(item.price).toFixed(2)}
                      </span>
                      <div className="flex items-center space-x-2">
                        {getCartItemQuantity(item.id) > 0 && (
                          <>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-medium w-4 text-center">
                              {getCartItemQuantity(item.id)}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => addToCart(item)}
                          className="p-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart sidebar */}
          <div className={`lg:w-80 ${showCart ? 'block' : 'hidden lg:block'}`}>

  <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
    <h2 className="text-lg font-bold text-gray-900 mb-4">Your Table Order</h2>

    {activeOrder && (
      <div className="mb-6 border-b pb-4">
        <h3 className="text-md font-bold text-gray-900 mb-3">Current Bill</h3>

        <div className="space-y-2 mb-3 max-h-52 overflow-y-auto">
          {activeOrder.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <p className="font-medium">{item.menuItem?.name}</p>
                <p className="text-gray-500">
                  ${Number(item.unitPrice).toFixed(2)} x {item.quantity}
                </p>
              </div>
              <p className="font-medium">
                ${Number(item.totalPrice).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold">Bill Total</span>
          <span className="font-bold text-lg text-green-600">
            ${Number(activeOrder.totalAmount).toFixed(2)}
          </span>
        </div>

        {activeOrder.status !== 'PAID' && (
          <button
            onClick={handleRequestBill}
            className="w-full py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
          >
            Request Bill
          </button>
        )}
      </div>
    )}

    {cart.length === 0 ? (
      <p className="text-gray-500 text-center py-8">No new items selected</p>
    ) : (
      <>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-gray-900">New Items Total</span>
            <span className="font-bold text-xl text-blue-600">
              ${getTotalPrice().toFixed(2)}
            </span>
          </div>

          <textarea
            placeholder="Special instructions (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border rounded-md text-sm mb-4"
            rows={2}
          />

          <button
            onClick={submitOrder}
            disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {submitting ? (
              'Submitting...'
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                {activeOrder ? 'Add to Current Order' : 'Place Order'}
              </>
            )}
          </button>
        </div>
      </>
    )}
  </div>
</div>
                <>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.menuItemId} className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            ${Number(item.price).toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          ${(Number(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-xl text-blue-600">
                        ${Number(getTotalPrice()).toFixed(2)}
                      </span>
                    </div>

                    <textarea
                      placeholder="Special instructions (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2 border rounded-md text-sm mb-4"
                      rows={2}
                    />

                    <button
                      onClick={submitOrder}
                      disabled={submitting}
                      className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      {submitting ? (
                        'Submitting...'
                      ) : (
                        <>
                          <Check className="h-5 w-5 mr-2" />
                          Place Order
                        </>
                      )}
                    </button>
                  </div>
                </>
              
            </div>
          </div>
        </div>
    
  );
};

export default CustomerOrder;
