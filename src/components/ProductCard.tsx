import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Star, Zap } from 'lucide-react'
import { Product } from '../types'
import { useApp } from '../context/AppContext'

interface ProductCardProps {
  product: Product
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { cartItems, addToCart, updateCartQuantity } = useApp()

  const cartItem = cartItems.find(item => item.product_id === product.id)
  const quantity = cartItem?.quantity || 0

  const handleAdd = () => {
    addToCart(product.id, 1)
  }

  const handleIncrease = () => {
    updateCartQuantity(product.id, quantity + 1)
  }

  const handleDecrease = () => {
    if (quantity > 1) {
      updateCartQuantity(product.id, quantity - 1)
    } else {
      updateCartQuantity(product.id, 0)
    }
  }

  const isLowStock = product.stock_quantity <= 5
  const isOutOfStock = product.stock_quantity === 0

  return (
    <motion.div
      layout
      className="group relative"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="glass-effect rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-glow">
        {/* Image Container */}
        <div className="relative overflow-hidden">
          <motion.img
            src={product.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
            alt={product.name}
            className="w-full h-40 sm:h-44 md:h-48 object-cover transition-transform duration-500 group-hover:scale-110"
            whileHover={{ scale: 1.1 }}
          />
          
          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isOutOfStock && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"
              >
                Out of Stock
              </motion.span>
            )}
            {isLowStock && !isOutOfStock && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"
              >
                <Zap className="h-3 w-3" />
                Low Stock
              </motion.span>
            )}
          </div>

          {/* Quick Add Button */}
          <motion.button
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAdd}
            disabled={isOutOfStock}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-500 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
          </motion.button>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          {/* Product Name */}
          <motion.h3 
            className="text-base sm:text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:gradient-text transition-all duration-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {product.name}
          </motion.h3>
          
          {/* Description */}
          <motion.p 
            className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {product.description || 'Fresh and quality product'}
          </motion.p>

          {/* Rating */}
          <motion.div 
            className="flex items-center gap-1 mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-xs text-gray-500 ml-1">(4.8)</span>
          </motion.div>

          {/* Price and Unit */}
          <motion.div 
            className="flex items-center justify-between mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div>
              <span className="text-lg sm:text-xl font-bold gradient-text">
                ₹{product.price}
              </span>
              <span className="text-gray-500 text-xs sm:text-sm ml-1">
                /{product.unit}
              </span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Stock: {product.stock_quantity}</div>
            </div>
          </motion.div>

          {/* Add to Cart Controls */}
          <AnimatePresence mode="wait">
            {quantity === 0 ? (
              <motion.button
                key="add-button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={handleAdd}
                disabled={isOutOfStock}
                className="w-full btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none flex items-center justify-center gap-2 text-sm sm:text-base"
                whileHover={{ scale: isOutOfStock ? 1 : 1.02 }}
                whileTap={{ scale: isOutOfStock ? 1 : 0.98 }}
              >
                <Plus className="h-4 w-4" />
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </motion.button>
            ) : (
              <motion.div
                key="quantity-controls"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between bg-gray-50 rounded-xl p-2"
              >
                <motion.button
                  onClick={handleDecrease}
                  className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Minus className="h-4 w-4" />
                </motion.button>
                
                <motion.span 
                  key={quantity}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-base sm:text-lg font-bold text-gray-800 px-4"
                >
                  {quantity}
                </motion.span>
                
                <motion.button
                  onClick={handleIncrease}
                  disabled={quantity >= product.stock_quantity}
                  className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md"
                  whileHover={{ scale: quantity >= product.stock_quantity ? 1 : 1.1 }}
                  whileTap={{ scale: quantity >= product.stock_quantity ? 1 : 0.9 }}
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Gradient Border */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </div>
    </motion.div>
  )
}

export default ProductCard