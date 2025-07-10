
import React, { useState } from 'react'
import AIBlobButton from './components/AIBlobButton'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { AppProvider } from './context/AppContext'
import Header from './components/Header'
import CategoryCard from './components/CategoryCard'
import ProductCard from './components/ProductCard'
import Cart from './components/Cart'
import AuthModal from './components/AuthModal'
import OrderHistory from './components/OrderHistory'
import Profile from './components/Profile'
import VoiceAssistant from './components/VoiceAssistant'
// import VoiceVisualizer from './components/VoiceVisualizer'
import LoadingSpinner from './components/LoadingSpinner'
import { useApp } from './context/AppContext'

const AppContent: React.FC = () => {
  const { categories, products, loading } = useApp()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const filteredProducts = selectedCategory
    ? products.filter(product => product.category_id === selectedCategory)
    : products

  const handleVoiceToggle = () => {
    setIsVoiceActive(!isVoiceActive)
  }

  const handleVoiceStatusChange = (active: boolean, speaking: boolean) => {
    // CRITICAL: Update both voice active state and speaking state
    setIsVoiceActive(active)
    setIsSpeaking(speaking)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* AI Assistant Blob Button at bottom-right */}
      <div
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 50,
        }}
      >
        <AIBlobButton active={isVoiceActive} onClick={handleVoiceToggle} />
      </div>

      <Header
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onVoiceClick={handleVoiceToggle}
        onOrderHistoryClick={() => setIsOrderHistoryOpen(true)}
        isVoiceActive={isVoiceActive}
        isSpeaking={isSpeaking}
      />

      <main className="relative">
        {/* Hero Section with Enhanced Design */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden py-12 sm:py-16 lg:py-20"
        >
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl floating-animation"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl floating-animation" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="gradient-text">Fresh Groceries,</span>
                <br />
                <span className="text-gray-800">Delivered Fast</span>
              </h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
              >
                Experience the future of grocery shopping with our AI-powered voice assistant. 
                Shop hands-free and get fresh groceries delivered to your doorstep.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <button
                  onClick={handleVoiceToggle}
                  className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                    isVoiceActive
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-glow pulse-glow'
                      : 'glass-effect text-gray-700 hover:shadow-xl hover:scale-105'
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {isVoiceActive ? (
                      <>
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        Voice Assistant Active
                      </>
                    ) : (
                      <>
                        🎤 Start Voice Shopping
                      </>
                    )}
                  </span>
                  {!isVoiceActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  )}
                </button>

              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* Categories Section */}
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-12 lg:mb-16"
          >
            <div className="flex items-center justify-between mb-8">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800"
              >
                Shop by Category
              </motion.h2>
              {selectedCategory && (
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  onClick={() => setSelectedCategory(null)}
                  className="btn-secondary text-sm sm:text-base"
                >
                  View All
                </motion.button>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              <AnimatePresence>
                {categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CategoryCard
                      category={category}
                      onClick={() => setSelectedCategory(category.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* Products Section */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                {selectedCategory
                  ? categories.find(c => c.id === selectedCategory)?.name
                  : 'Fresh Products'}
              </h2>
              <p className="text-gray-600 text-lg">
                {filteredProducts.length} products available
              </p>
            </motion.div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              <AnimatePresence>
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    layout
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredProducts.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No products found</h3>
                <p className="text-gray-500">Try selecting a different category</p>
              </motion.div>
            )}
          </motion.section>
        </div>
      </main>

      {/* Modals with Animation */}
      <AnimatePresence>
        {isCartOpen && (
          <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        )}
        {isAuthModalOpen && (
          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)}
            onProfileClick={() => setIsProfileOpen(true)}
          />
        )}
        {isOrderHistoryOpen && (
          <OrderHistory isOpen={isOrderHistoryOpen} onClose={() => setIsOrderHistoryOpen(false)} />
        )}
        {isProfileOpen && (
          <Profile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        )}
      </AnimatePresence>

      {/* Voice Assistant (Hidden) */}
      <VoiceAssistant
        isActive={isVoiceActive}
        onStatusChange={handleVoiceStatusChange}
      />

      {/* Voice Visualizer Overlay removed as requested */}

      {/* Enhanced Toast Notifications */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
