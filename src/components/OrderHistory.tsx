import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Clock, CheckCircle, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order, OrderItem } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import OrderDetails from './OrderDetails';

// Define the Order type with nested product details
interface OrderWithItems extends Order {
  order_items: (OrderItem & { product: { name: string; image_url?: string } })[];
}

interface OrderHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ isOpen, onClose }) => {
  const { user } = useApp();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

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
    if (isOpen && user) {
      fetchOrders();
    } else {
      // Reset state when closing
      setSelectedOrderId(null);
      setIsOrderDetailsOpen(false);
    }
  }, [isOpen, user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items ( *, product:products ( name, image_url ) )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch order history.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsOrderDetailsOpen(true);
  };

  const handleCloseOrderDetails = () => {
    setIsOrderDetailsOpen(false);
    setSelectedOrderId(null);
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusMap: { [key: string]: { icon: React.ReactNode; className: string } } = {
      pending: { icon: <Clock className="h-4 w-4" />, className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { icon: <CheckCircle className="h-4 w-4" />, className: 'bg-blue-100 text-blue-800' },
      delivered: { icon: <CheckCircle className="h-4 w-4" />, className: 'bg-green-100 text-green-800' },
      default: { icon: <Clock className="h-4 w-4" />, className: 'bg-gray-100 text-gray-800' },
    };
    const { icon, className } = statusMap[status.toLowerCase()] || statusMap.default;
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
        {icon}
        <span className="capitalize">{status}</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).replace(',', '');
  };

  const OrderCard = ({ order }: { order: OrderWithItems }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50/70 hover:shadow-sm transition-all"
    >
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-bold text-gray-900">Order #{order.id}</h3>
          <p className="text-sm text-gray-500 mt-1">{formatDate(order.created_at)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-green-600">₹{order.total_amount?.toFixed(2)}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleViewDetails(order.id)}
            className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors px-3 py-1 rounded-md hover:bg-green-50"
          >
            View Details →
          </motion.button>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5"><User className="h-4 w-4" /><span>{order.customer_name}</span></div>
          <div className="flex items-center gap-1.5"><Package className="h-4 w-4" /><span>{order.order_items.length} items</span></div>
        </div>
        <StatusBadge status={order.status} />
      </div>
      
      {order.order_items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex -space-x-2">
                {order.order_items.slice(0, 5).map(item => (
                    <img
                        key={item.id}
                        src={item.product?.image_url || 'https://via.placeholder.com/40'}
                        alt={item.product.name}
                        className="h-8 w-8 rounded-full border-2 border-white object-cover bg-gray-100"
                    />
                ))}
                {order.order_items.length > 5 && (
                    <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                        +{order.order_items.length - 5}
                    </div>
                )}
            </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
              className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">Order History</h2>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full"><X /></motion.button>
                </div>
              </div>

              {/* Main Content (Scrollable) */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {loading ? (
                    <div className="text-center py-10">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-10">
                      <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="font-semibold text-gray-600">No Orders Yet</p>
                      <p className="text-gray-400 text-sm mt-1">Your past orders will appear here.</p>
                    </div>
                  ) : (
                    orders.map(order => <OrderCard key={order.id} order={order} />)
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Order Details Modal */}
          <OrderDetails
            isOpen={isOrderDetailsOpen}
            onClose={handleCloseOrderDetails}
            orderId={selectedOrderId}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default OrderHistory;