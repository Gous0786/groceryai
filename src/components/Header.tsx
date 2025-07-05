import React from 'react'
import { motion } from 'framer-motion'
import { ShoppingCart, User, Mic, MicOff, History, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'

interface HeaderProps {
  onCartClick: () => void
  onAuthClick: () => void
  onVoiceClick: () => void
  onOrderHistoryClick: () => void
  isVoiceActive: boolean
  isSpeaking: boolean
}

const Header: React.FC<HeaderProps> = ({
  onCartClick,
  onAuthClick,
  onVoiceClick,
  onOrderHistoryClick,
  isVoiceActive,
  isSpeaking
}) => {
  const { user, getCartItemCount } = useApp()

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="glass-effect sticky top-0 z-50 border-b border-white/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* Logo */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold gradient-text">
              FreshMart
            </h1>
          </motion.div>

          {/* Navigation Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            

            {/* Order History Button - Only show when user is signed in */}
            {user && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onOrderHistoryClick}
                className="glass-effect p-2.5 sm:p-3 text-gray-600 hover:text-emerald-600 transition-all duration-300 rounded-xl hover:shadow-lg"
                title="Order History"
              >
                <History className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.button>
            )}

            {/* Cart Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCartClick}
              className="relative glass-effect p-2.5 sm:p-3 text-gray-600 hover:text-emerald-600 transition-all duration-300 rounded-xl hover:shadow-lg"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              {getCartItemCount() > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center shadow-lg"
                >
                  {getCartItemCount()}
                </motion.span>
              )}
            </motion.button>

            {/* User Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onAuthClick}
              className="flex items-center space-x-2 glass-effect p-2.5 sm:p-3 text-gray-600 hover:text-emerald-600 transition-all duration-300 rounded-xl hover:shadow-lg"
            >
              {user ? (
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline text-sm font-medium truncate max-w-24">
                    {user.email.split('@')[0]}
                  </span>
                </div>
              ) : (
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

export default Header