import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Clock, CheckCircle, User, Phone, MapPin, ArrowLeft, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Define the Order type with nested product details
interface OrderWithItems {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      image_url?: string;
      unit: string;
    };
  }>;
}

interface OrderDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ isOpen, onClose, orderId }) => {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(false);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Disable body scroll
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = '0px'
    } else {
      // Re-enable body scroll
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = '0px'
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = '0px'
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    } else {
      setOrder(null);
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (
              name,
              image_url,
              unit
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusMap: { [key: string]: { icon: React.ReactNode; className: string; text: string } } = {
      pending: { 
        icon: <Clock className="h-4 w-4" />, 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        text: 'Order Pending' 
      },
      confirmed: { 
        icon: <CheckCircle className="h-4 w-4" />, 
        className: 'bg-blue-100 text-blue-800 border-blue-200', 
        text: 'Order Confirmed' 
      },
      preparing: { 
        icon: <Package className="h-4 w-4" />, 
        className: 'bg-orange-100 text-orange-800 border-orange-200', 
        text: 'Preparing Order' 
      },
      shipped: { 
        icon: <Truck className="h-4 w-4" />, 
        className: 'bg-purple-100 text-purple-800 border-purple-200', 
        text: 'Out for Delivery' 
      },
      delivered: { 
        icon: <CheckCircle className="h-4 w-4" />, 
        className: 'bg-green-100 text-green-800 border-green-200', 
        text: 'Delivered' 
      },
      cancelled: { 
        icon: <X className="h-4 w-4" />, 
        className: 'bg-red-100 text-red-800 border-red-200', 
        text: 'Cancelled' 
      },
      default: { 
        icon: <Clock className="h-4 w-4" />, 
        className: 'bg-gray-100 text-gray-800 border-gray-200', 
        text: status 
      },
    };
    
    const { icon, className, text } = statusMap[status.toLowerCase()] || statusMap.default;
    
    return (
      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border ${className}`}>
        {icon}
        <span className="capitalize">{text}</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEstimatedDelivery = (orderDate: string, status: string) => {
    if (status.toLowerCase() === 'delivered') return 'Delivered';
    if (status.toLowerCase() === 'cancelled') return 'Cancelled';
    
    const orderTime = new Date(orderDate);
    const estimatedTime = new Date(orderTime.getTime() + 45 * 60000); // Add 45 minutes
    
    return estimatedTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </motion.button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Order #{order?.id || orderId}
                  </h2>
                  {order && (
                    <p className="text-gray-600">{formatDate(order.created_at)}</p>
                  )}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                <span className="ml-4 text-gray-600">Loading order details...</span>
              </div>
            ) : order ? (
              <div className="space-y-8">
                {/* Order Status & Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Status Card */}
                  <div className="lg:col-span-2 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Order Status</h3>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Order Date:</span>
                        <p className="font-medium">{formatDate(order.created_at)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Estimated Delivery:</span>
                        <p className="font-medium">{getEstimatedDelivery(order.created_at, order.status)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Card */}
                  <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Order Total</h3>
                    <div className="text-3xl font-bold">₹{order.total_amount?.toFixed(2)}</div>
                    <p className="text-emerald-100 text-sm mt-1">
                      {order.order_items.length} items • Free delivery
                    </p>
                  </div>
                </div>

                {/* Customer & Delivery Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-emerald-600" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-3 text-gray-400" />
                        <span className="text-gray-800">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-3 text-gray-400" />
                        <span className="text-gray-800">{order.customer_phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-emerald-600" />
                      Delivery Address
                    </h3>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-3 text-gray-400 mt-1 flex-shrink-0" />
                      <p className="text-gray-800 leading-relaxed">{order.delivery_address}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <Package className="h-5 w-5 mr-2 text-emerald-600" />
                      Order Items ({order.order_items.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {order.order_items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={item.product.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg shadow-md"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 mb-1">
                              {item.product.name}
                            </h4>
                            <div className="flex items-center text-sm text-gray-600 space-x-4">
                              <span>Quantity: {item.quantity} {item.product.unit}</span>
                              <span>Price: ₹{item.price.toFixed(2)} per {item.product.unit}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-800">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.quantity} × ₹{item.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal ({order.order_items.length} items)</span>
                      <span className="font-medium">₹{order.total_amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium text-emerald-600">FREE</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Taxes & Fees</span>
                      <span className="font-medium">₹0.00</span>
                    </div>
                    <div className="border-t border-gray-300 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">Total Amount</span>
                        <span className="text-2xl font-bold text-emerald-600">₹{order.total_amount?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Order Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-4">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Order Placed</p>
                        <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    
                    {order.status.toLowerCase() !== 'pending' && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Order Confirmed</p>
                          <p className="text-sm text-gray-600">Your order has been confirmed</p>
                        </div>
                      </div>
                    )}

                    {['preparing', 'shipped', 'delivered'].includes(order.status.toLowerCase()) && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Preparing Order</p>
                          <p className="text-sm text-gray-600">Your items are being prepared</p>
                        </div>
                      </div>
                    )}

                    {['shipped', 'delivered'].includes(order.status.toLowerCase()) && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                          <Truck className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Out for Delivery</p>
                          <p className="text-sm text-gray-600">Your order is on the way</p>
                        </div>
                      </div>
                    )}

                    {order.status.toLowerCase() === 'delivered' && (
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-4">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Delivered</p>
                          <p className="text-sm text-gray-600">Order delivered successfully</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Order not found</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderDetails;