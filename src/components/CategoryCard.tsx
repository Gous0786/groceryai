import React from 'react'
import { motion } from 'framer-motion'
import { Category } from '../types'

interface CategoryCardProps {
  category: Category
  onClick: () => void
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      className="group cursor-pointer"
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="glass-effect rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-glow">
        {/* Image Container */}
        <div className="relative overflow-hidden">
          <motion.img
            src={category.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
            alt={category.name}
            className="w-full h-32 sm:h-36 md:h-40 object-cover transition-transform duration-500 group-hover:scale-110"
            whileHover={{ scale: 1.1 }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Floating Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
          >
            <span className="text-lg">
              {category.name.toLowerCase().includes('fruit') ? '🍎' :
               category.name.toLowerCase().includes('vegetable') ? '🥕' :
               category.name.toLowerCase().includes('dairy') ? '🥛' :
               category.name.toLowerCase().includes('grain') ? '🌾' :
               category.name.toLowerCase().includes('snack') ? '🍪' :
               category.name.toLowerCase().includes('beverage') ? '🥤' : '🛒'}
            </span>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <motion.h3 
            className="text-base sm:text-lg font-bold text-gray-800 mb-2 line-clamp-1 group-hover:gradient-text transition-all duration-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {category.name}
          </motion.h3>
          
          <motion.p 
            className="text-gray-600 text-xs sm:text-sm line-clamp-2 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {category.description || 'Fresh and quality products'}
          </motion.p>

          {/* Hover Effect Arrow */}
          <motion.div
            className="flex items-center justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ x: -10 }}
            whileHover={{ x: 0 }}
          >
            <span className="text-emerald-500 text-sm font-medium">Explore →</span>
          </motion.div>
        </div>

        {/* Bottom Gradient Border */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </div>
    </motion.div>
  )
}

export default CategoryCard