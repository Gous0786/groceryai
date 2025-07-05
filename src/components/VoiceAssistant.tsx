import React, { useEffect, useState, useMemo } from 'react'
import { useConversation } from '@elevenlabs/react'
import { useApp } from '../context/AppContext'
import { ProductFuzzySearch } from '../lib/fuzzySearch'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface VoiceAssistantProps {
  isActive: boolean
  onStatusChange: (isActive: boolean, isSpeaking: boolean) => void
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  isActive,
  onStatusChange
}) => {
  const {
    user,
    products,
    cartItems,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    getCartTotal,
    getCartItemCount,
    placeOrder,
    refreshCart
  } = useApp()

  const [conversationId, setConversationId] = useState<string | null>(null)

  // Initialize fuzzy search with products
  const fuzzySearch = useMemo(() => {
    return new ProductFuzzySearch(products)
  }, [products])

  // Update fuzzy search when products change
  useEffect(() => {
    if (products.length > 0) {
      fuzzySearch.updateProducts(products)
    }
  }, [products, fuzzySearch])

  const conversation = useConversation({
    onConnect: () => {
      console.log('🎤 Voice assistant connected')
      toast.success('Voice assistant connected')
    },
    onDisconnect: () => {
      console.log('🎤 Voice assistant disconnected')
      toast.success('Voice assistant disconnected')
      setConversationId(null)
      // CRITICAL: Update parent component about disconnection
      onStatusChange(false, false)
    },
    onMessage: (message) => {
      console.log('💬 Voice message:', message)
    },
    onError: (error) => {
      console.error('❌ Voice assistant error:', error)
      toast.error('Voice assistant error')
      // CRITICAL: Update parent component about error/disconnection
      onStatusChange(false, false)
    }
  })

  useEffect(() => {
    onStatusChange(conversation.status === 'connected', conversation.isSpeaking)
  }, [conversation.status, conversation.isSpeaking, onStatusChange])

  useEffect(() => {
    if (isActive && conversation.status === 'disconnected') {
      startConversation()
    } else if (!isActive && conversation.status === 'connected') {
      stopConversation()
    }
  }, [isActive])

  // Enhanced product matching function using Fuse.js
  const findProductByName = (searchName: string) => {
    if (!searchName) return null

    console.log(`🔍 [FUZZY SEARCH] Searching for: "${searchName}"`)
    
    const result = fuzzySearch.findProduct(searchName)
    
    console.log(`🎯 [FUZZY SEARCH] Result:`, {
      found: !!result.product,
      productName: result.product?.name,
      confidence: result.confidence,
      matchType: result.matchType,
      alternativesCount: result.alternatives.length,
      alternatives: result.alternatives.map(p => p.name)
    })

    return result
  }

  // Get user profile information
  const getUserProfile = async () => {
    if (!user) return null

    try {
      const { data: authUser, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return {
        full_name: authUser.user?.user_metadata?.full_name || '',
        phone: authUser.user?.user_metadata?.phone || '',
        address: authUser.user?.user_metadata?.address || ''
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  const startConversation = async () => {
    try {
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID
      if (!agentId) {
        toast.error('ElevenLabs Agent ID not configured')
        return
      }

      const id = await conversation.startSession({
        agentId,
        clientTools: {
          // Simple test tool to verify agent is working
          printHelloWorld: async () => {
            console.log('\n🌟 ===== TOOL CALL: printHelloWorld =====')
            console.log('📥 Parameters: none')
            console.log('🎉 HELLO WORLD! 🎉')
            console.log('✅ Agent is successfully calling client tools!')
            console.log('🕒 Timestamp:', new Date().toISOString())
            
            const response = {
              success: true,
              message: 'Hello World! The agent is working perfectly and can call client tools.',
              timestamp: new Date().toISOString(),
              testPassed: true
            }

            console.log('✅ [TOOL RESPONSE] printHelloWorld SUCCESS:', response)
            console.log('🌟 ===== END printHelloWorld =====\n')
            
            // Also show a toast notification
            toast.success('🎉 Hello World! Agent tool test successful!')
            
            return response
          },

          // Get current cart details with complete information
          getCartDetails: async () => {
            console.log('\n🛒 ===== TOOL CALL: getCartDetails =====')
            console.log('📥 Parameters: none')
            console.log('👤 User:', user ? `${user.email} (ID: ${user.id})` : 'Not signed in')
            
            try {
              console.log('🔄 Refreshing cart data...')
              await refreshCart()
              
              console.log('📊 Cart state after refresh:', {
                itemCount: cartItems.length,
                totalAmount: getCartTotal(),
                totalItemCount: getCartItemCount()
              })

              const items = cartItems.map(item => ({
                id: item.id,
                name: item.product?.name || 'Unknown Product',
                price: item.product?.price || 0,
                quantity: item.quantity,
                unit: item.product?.unit || 'piece',
                total: (item.product?.price || 0) * item.quantity,
                image_url: item.product?.image_url || null,
                stock_quantity: item.product?.stock_quantity || 0
              }))
              
              console.log('📦 Processed cart items:', items)

              const response = {
                success: true,
                message: cartItems.length === 0 
                  ? 'Your cart is empty. You can add items by saying "Add [product name] to cart".'
                  : `You have ${getCartItemCount()} items in your cart totaling ₹${getCartTotal().toFixed(2)}.`,
                items,
                itemCount: getCartItemCount(),
                totalAmount: getCartTotal(),
                isEmpty: cartItems.length === 0,
                currency: 'INR',
                cartSummary: items.map(item => `${item.quantity} ${item.name} (₹${item.total.toFixed(2)})`).join(', ')
              }

              console.log('✅ [TOOL RESPONSE] getCartDetails SUCCESS:', response)
              console.log('🛒 ===== END getCartDetails =====\n')
              return response
            } catch (error) {
              const errorResponse = {
                success: false,
                message: 'Failed to get cart details. Please try again.',
                error: 'Failed to get cart details',
                items: [],
                itemCount: 0,
                totalAmount: 0,
                isEmpty: true
              }

              console.error('❌ [TOOL ERROR] getCartDetails FAILED:', error)
              console.error('❌ Error response:', errorResponse)
              console.log('🛒 ===== END getCartDetails (ERROR) =====\n')
              return errorResponse
            }
          },

          // Add item to cart by product name with fuzzy matching
          addItemToCart: async ({ productName, quantity = 1 }) => {
            console.log('\n➕ ===== TOOL CALL: addItemToCart =====')
            console.log('📥 Parameters:', { productName, quantity })
            console.log('👤 User:', user ? `${user.email} (ID: ${user.id})` : 'Not signed in')
            
            try {
              if (!productName || typeof productName !== 'string') {
                const response = { 
                  success: false, 
                  message: 'Product name is required. Please specify which product you want to add.' 
                }
                console.log('❌ [VALIDATION ERROR] Missing product name:', response)
                console.log('➕ ===== END addItemToCart (VALIDATION ERROR) =====\n')
                return response
              }

              if (!user) {
                const response = { 
                  success: false, 
                  message: 'Please sign in to add items to your cart. You can sign in through the website.' 
                }
                console.log('❌ [AUTH ERROR] User not signed in:', response)
                console.log('➕ ===== END addItemToCart (AUTH ERROR) =====\n')
                return response
              }

              const validQuantity = Math.max(1, Math.floor(Number(quantity) || 1))
              console.log('🔢 Validated quantity:', { original: quantity, validated: validQuantity })

              const matchResult = findProductByName(productName.trim())
              
              if (!matchResult.product) {
                const suggestions = matchResult.alternatives.slice(0, 3).map(p => p.name)
                
                const response = { 
                  success: false, 
                  message: `I couldn't find "${productName}" in our inventory.${suggestions.length > 0 ? ` Did you mean: ${suggestions.join(', ')}?` : ' Please check the product name and try again.'}`,
                  suggestions,
                  searchConfidence: matchResult.confidence,
                  matchType: matchResult.matchType,
                  availableProducts: products.slice(0, 5).map(p => p.name)
                }

                console.log('❌ [SEARCH ERROR] Product not found:', response)
                console.log('➕ ===== END addItemToCart (SEARCH ERROR) =====\n')
                return response
              }

              const product = matchResult.product
              console.log('✅ Product found:', {
                id: product.id,
                name: product.name,
                price: product.price,
                stock: product.stock_quantity,
                matchConfidence: matchResult.confidence
              })

              if (product.stock_quantity < validQuantity) {
                const response = {
                  success: false,
                  message: `Sorry, only ${product.stock_quantity} ${product.name} available in stock. You requested ${validQuantity}.`
                }

                console.log('❌ [STOCK ERROR] Insufficient stock:', response)
                console.log('➕ ===== END addItemToCart (STOCK ERROR) =====\n')
                return response
              }

              console.log('🛒 Adding to cart...')
              await addToCart(product.id, validQuantity)
              console.log('✅ Successfully added to cart')
              
              // CRITICAL: Refresh cart to get updated state
              console.log('🔄 Refreshing cart for updated totals...')
              await refreshCart()
              
              // Get updated cart totals
              const updatedItemCount = getCartItemCount()
              const updatedTotal = getCartTotal()
              
              console.log('📊 Updated cart state:', {
                itemCount: updatedItemCount,
                totalAmount: updatedTotal
              })
              
              let confidenceNote = ''
              if (matchResult.confidence === 'medium') {
                confidenceNote = ` (I matched "${productName}" to "${product.name}")`
              } else if (matchResult.confidence === 'low') {
                confidenceNote = ` (I matched "${productName}" to "${product.name}" - please verify this is correct)`
              }

              const response = { 
                success: true, 
                message: `Added ${validQuantity} ${product.name} to your cart for ₹${(product.price * validQuantity).toFixed(2)}${confidenceNote}. Your cart now has ${updatedItemCount} items totaling ₹${updatedTotal.toFixed(2)}.`,
                product: product.name,
                quantity: validQuantity,
                price: product.price,
                total: product.price * validQuantity,
                matchConfidence: matchResult.confidence,
                matchType: matchResult.matchType,
                // Include updated cart summary for agent context
                cartSummary: {
                  itemCount: updatedItemCount,
                  totalAmount: updatedTotal,
                  currency: 'INR'
                }
              }

              console.log('✅ [TOOL RESPONSE] addItemToCart SUCCESS:', response)
              console.log('➕ ===== END addItemToCart =====\n')
              return response
            } catch (error) {
              const errorResponse = {
                success: false,
                message: 'Failed to add item to cart. Please try again.'
              }

              console.error('❌ [TOOL ERROR] addItemToCart FAILED:', error)
              console.error('❌ Error response:', errorResponse)
              console.log('➕ ===== END addItemToCart (ERROR) =====\n')
              return errorResponse
            }
          },

          // Remove item from cart completely with fuzzy matching
          removeItemFromCart: async ({ productName }) => {
            console.log('\n🗑️ ===== TOOL CALL: removeItemFromCart =====')
            console.log('📥 Parameters:', { productName })
            console.log('👤 User:', user ? `${user.email} (ID: ${user.id})` : 'Not signed in')
            
            try {
              if (!productName || typeof productName !== 'string') {
                const response = { 
                  success: false, 
                  message: 'Product name is required. Please specify which product you want to remove.' 
                }
                console.log('❌ [VALIDATION ERROR] Missing product name:', response)
                console.log('🗑️ ===== END removeItemFromCart (VALIDATION ERROR) =====\n')
                return response
              }

              if (!user) {
                const response = { 
                  success: false, 
                  message: 'Please sign in to manage your cart.' 
                }
                console.log('❌ [AUTH ERROR] User not signed in:', response)
                console.log('🗑️ ===== END removeItemFromCart (AUTH ERROR) =====\n')
                return response
              }

              console.log('🔄 Refreshing cart data...')
              await refreshCart()
              
              const matchResult = findProductByName(productName.trim())
              
              if (!matchResult.product) {
                const cartProductNames = cartItems.map(item => item.product?.name).filter(Boolean)
                const response = { 
                  success: false, 
                  message: `I couldn't find "${productName}" in available products.${cartProductNames.length > 0 ? ` Items in your cart: ${cartProductNames.join(', ')}` : ' Your cart is empty.'}`,
                  cartItems: cartProductNames,
                  searchConfidence: matchResult.confidence,
                  suggestions: matchResult.alternatives.slice(0, 3).map(p => p.name)
                }

                console.log('❌ [SEARCH ERROR] Product not found:', response)
                console.log('🗑️ ===== END removeItemFromCart (SEARCH ERROR) =====\n')
                return response
              }

              const cartItem = cartItems.find(item => item.product_id === matchResult.product!.id)
              
              if (!cartItem) {
                const cartProductNames = cartItems.map(item => item.product?.name).filter(Boolean)
                const response = { 
                  success: false, 
                  message: `"${matchResult.product.name}" is not in your cart.${cartProductNames.length > 0 ? ` Items in your cart: ${cartProductNames.join(', ')}` : ' Your cart is empty.'}`,
                  cartItems: cartProductNames
                }

                console.log('❌ [CART ERROR] Item not in cart:', response)
                console.log('🗑️ ===== END removeItemFromCart (CART ERROR) =====\n')
                return response
              }

              console.log('🗑️ Removing from cart...')
              await removeFromCart(cartItem.product_id)
              console.log('✅ Successfully removed from cart')
              
              // CRITICAL: Refresh cart to get updated state
              console.log('🔄 Refreshing cart for updated totals...')
              await refreshCart()
              
              // Get updated cart totals
              const updatedItemCount = getCartItemCount()
              const updatedTotal = getCartTotal()
              
              console.log('📊 Updated cart state:', {
                itemCount: updatedItemCount,
                totalAmount: updatedTotal
              })
              
              let confidenceNote = ''
              if (matchResult.confidence === 'medium' || matchResult.confidence === 'low') {
                confidenceNote = ` (I matched "${productName}" to "${matchResult.product.name}")`
              }

              const response = { 
                success: true, 
                message: `Removed ${cartItem.product?.name} from your cart${confidenceNote}. Your cart now has ${updatedItemCount} items totaling ₹${updatedTotal.toFixed(2)}.`,
                product: cartItem.product?.name,
                removedQuantity: cartItem.quantity,
                matchConfidence: matchResult.confidence,
                // Include updated cart summary for agent context
                cartSummary: {
                  itemCount: updatedItemCount,
                  totalAmount: updatedTotal,
                  currency: 'INR'
                }
              }

              console.log('✅ [TOOL RESPONSE] removeItemFromCart SUCCESS:', response)
              console.log('🗑️ ===== END removeItemFromCart =====\n')
              return response
            } catch (error) {
              const errorResponse = {
                success: false,
                message: 'Failed to remove item from cart. Please try again.'
              }

              console.error('❌ [TOOL ERROR] removeItemFromCart FAILED:', error)
              console.error('❌ Error response:', errorResponse)
              console.log('🗑️ ===== END removeItemFromCart (ERROR) =====\n')
              return errorResponse
            }
          },

          // Update quantity of existing cart item with fuzzy matching
          updateCartItemQuantity: async ({ productName, quantity }) => {
            console.log('\n🔄 ===== TOOL CALL: updateCartItemQuantity =====')
            console.log('📥 Parameters:', { productName, quantity })
            console.log('👤 User:', user ? `${user.email} (ID: ${user.id})` : 'Not signed in')
            
            try {
              if (!productName || typeof productName !== 'string') {
                const response = { 
                  success: false, 
                  message: 'Product name is required. Please specify which product quantity you want to update.' 
                }
                console.log('❌ [VALIDATION ERROR] Missing product name:', response)
                console.log('🔄 ===== END updateCartItemQuantity (VALIDATION ERROR) =====\n')
                return response
              }

              if (!user) {
                const response = { 
                  success: false, 
                  message: 'Please sign in to manage your cart.' 
                }
                console.log('❌ [AUTH ERROR] User not signed in:', response)
                console.log('🔄 ===== END updateCartItemQuantity (AUTH ERROR) =====\n')
                return response
              }

              const validQuantity = Math.floor(Number(quantity) || 0)
              console.log('🔢 Validated quantity:', { original: quantity, validated: validQuantity })
              
              if (validQuantity < 0) {
                const response = { 
                  success: false, 
                  message: 'Quantity cannot be negative. Use "remove" to delete items from cart.' 
                }
                console.log('❌ [VALIDATION ERROR] Negative quantity:', response)
                console.log('🔄 ===== END updateCartItemQuantity (VALIDATION ERROR) =====\n')
                return response
              }

              console.log('🔄 Refreshing cart data...')
              await refreshCart()
              
              const matchResult = findProductByName(productName.trim())
              
              if (!matchResult.product) {
                const cartProductNames = cartItems.map(item => item.product?.name).filter(Boolean)
                const response = { 
                  success: false, 
                  message: `I couldn't find "${productName}" in available products.${cartProductNames.length > 0 ? ` Items in your cart: ${cartProductNames.join(', ')}` : ' Your cart is empty.'}`,
                  cartItems: cartProductNames,
                  searchConfidence: matchResult.confidence,
                  suggestions: matchResult.alternatives.slice(0, 3).map(p => p.name)
                }

                console.log('❌ [SEARCH ERROR] Product not found:', response)
                console.log('🔄 ===== END updateCartItemQuantity (SEARCH ERROR) =====\n')
                return response
              }

              const cartItem = cartItems.find(item => item.product_id === matchResult.product!.id)
              
              if (!cartItem) {
                const cartProductNames = cartItems.map(item => item.product?.name).filter(Boolean)
                const response = { 
                  success: false, 
                  message: `"${matchResult.product.name}" is not in your cart.${cartProductNames.length > 0 ? ` Items in your cart: ${cartProductNames.join(', ')}` : ' Your cart is empty.'}`,
                  cartItems: cartProductNames
                }

                console.log('❌ [CART ERROR] Item not in cart:', response)
                console.log('🔄 ===== END updateCartItemQuantity (CART ERROR) =====\n')
                return response
              }

              if (validQuantity === 0) {
                console.log('🗑️ Quantity is 0, removing item...')
                await removeFromCart(cartItem.product_id)
                console.log('✅ Successfully removed item (quantity 0)')
                
                // CRITICAL: Refresh cart to get updated state
                console.log('🔄 Refreshing cart for updated totals...')
                await refreshCart()
                
                // Get updated cart totals
                const updatedItemCount = getCartItemCount()
                const updatedTotal = getCartTotal()
                
                const response = {
                  success: true,
                  message: `Removed ${cartItem.product?.name} from your cart (quantity set to 0). Your cart now has ${updatedItemCount} items totaling ₹${updatedTotal.toFixed(2)}.`,
                  product: cartItem.product?.name,
                  quantity: 0,
                  matchConfidence: matchResult.confidence,
                  // Include updated cart summary for agent context
                  cartSummary: {
                    itemCount: updatedItemCount,
                    totalAmount: updatedTotal,
                    currency: 'INR'
                  }
                }

                console.log('✅ [TOOL RESPONSE] updateCartItemQuantity SUCCESS (REMOVED):', response)
                console.log('🔄 ===== END updateCartItemQuantity =====\n')
                return response
              }

              const product = products.find(p => p.id === cartItem.product_id)
              if (product && product.stock_quantity < validQuantity) {
                const response = {
                  success: false,
                  message: `Sorry, only ${product.stock_quantity} ${product.name} available in stock. You requested ${validQuantity}.`
                }

                console.log('❌ [STOCK ERROR] Insufficient stock:', response)
                console.log('🔄 ===== END updateCartItemQuantity (STOCK ERROR) =====\n')
                return response
              }

              console.log('🔄 Updating cart quantity...')
              await updateCartQuantity(cartItem.product_id, validQuantity)
              console.log('✅ Successfully updated cart quantity')
              
              // CRITICAL: Refresh cart to get updated state
              console.log('🔄 Refreshing cart for updated totals...')
              await refreshCart()
              
              // Get updated cart totals
              const updatedItemCount = getCartItemCount()
              const updatedTotal = getCartTotal()
              
              console.log('📊 Updated cart state:', {
                itemCount: updatedItemCount,
                totalAmount: updatedTotal
              })
              
              let confidenceNote = ''
              if (matchResult.confidence === 'medium' || matchResult.confidence === 'low') {
                confidenceNote = ` (I matched "${productName}" to "${matchResult.product.name}")`
              }

              const response = { 
                success: true, 
                message: `Updated ${cartItem.product?.name} quantity to ${validQuantity}${confidenceNote}. Your cart now has ${updatedItemCount} items totaling ₹${updatedTotal.toFixed(2)}.`,
                product: cartItem.product?.name,
                quantity: validQuantity,
                newTotal: (cartItem.product?.price || 0) * validQuantity,
                matchConfidence: matchResult.confidence,
                // Include updated cart summary for agent context
                cartSummary: {
                  itemCount: updatedItemCount,
                  totalAmount: updatedTotal,
                  currency: 'INR'
                }
              }

              console.log('✅ [TOOL RESPONSE] updateCartItemQuantity SUCCESS:', response)
              console.log('🔄 ===== END updateCartItemQuantity =====\n')
              return response
            } catch (error) {
              const errorResponse = {
                success: false,
                message: 'Failed to update cart quantity. Please try again.'
              }

              console.error('❌ [TOOL ERROR] updateCartItemQuantity FAILED:', error)
              console.error('❌ Error response:', errorResponse)
              console.log('🔄 ===== END updateCartItemQuantity (ERROR) =====\n')
              return errorResponse
            }
          },

          // Get available products with optional category filter
          getAvailableProducts: async ({ category = '', searchTerm = '', limit = 10 }) => {
            console.log('\n📦 ===== TOOL CALL: getAvailableProducts =====')
            console.log('📥 Parameters:', { category, searchTerm, limit })
            console.log('📊 Total products in database:', products.length)
            
            try {
              let filteredProducts = [...products]
              
              if (category && typeof category === 'string') {
                filteredProducts = filteredProducts.filter(p => 
                  p.category?.name.toLowerCase().includes(category.toLowerCase())
                )
              }

              if (searchTerm && typeof searchTerm === 'string') {
                const fuzzyResults = fuzzySearch.search(searchTerm.trim(), 50)
                const fuzzyProductIds = new Set(fuzzyResults.map(r => r.product.id))
                
                filteredProducts = filteredProducts.filter(p =>
                  p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  fuzzyProductIds.has(p.id)
                )
              }

              filteredProducts = filteredProducts.filter(p => p.stock_quantity > 0)
              
              const validLimit = Math.min(Math.max(1, Math.floor(Number(limit) || 10)), 50)
              filteredProducts = filteredProducts.slice(0, validLimit)
              
              const response = {
                success: true,
                message: filteredProducts.length === 0 
                  ? `No products found${searchTerm ? ` for "${searchTerm}"` : ''}${category ? ` in category "${category}"` : ''}.`
                  : `Found ${filteredProducts.length} products${searchTerm ? ` matching "${searchTerm}"` : ''}${category ? ` in category "${category}"` : ''}.`,
                products: filteredProducts.map(p => ({
                  name: p.name,
                  price: p.price,
                  unit: p.unit,
                  category: p.category?.name || 'Uncategorized',
                  description: p.description || 'No description available',
                  inStock: p.stock_quantity > 0,
                  stockQuantity: p.stock_quantity
                })),
                count: filteredProducts.length,
                currency: 'INR',
                totalAvailableProducts: products.filter(p => p.stock_quantity > 0).length
              }

              console.log('✅ [TOOL RESPONSE] getAvailableProducts SUCCESS:', {
                ...response,
                products: `[${response.products.length} products]`
              })
              console.log('📦 ===== END getAvailableProducts =====\n')
              return response
            } catch (error) {
              const errorResponse = {
                success: false,
                message: 'Failed to get products. Please try again.',
                error: 'Failed to get products',
                products: [],
                count: 0,
                totalAvailableProducts: 0
              }

              console.error('❌ [TOOL ERROR] getAvailableProducts FAILED:', error)
              console.error('❌ Error response:', errorResponse)
              console.log('📦 ===== END getAvailableProducts (ERROR) =====\n')
              return errorResponse
            }
          },

          // Get purchase history
          getPurchaseHistory: async ({ limit = 3, orderId = null }) => {
            console.log('\n📜 ===== TOOL CALL: getPurchaseHistory =====')
            console.log('📥 Parameters:', { limit, orderId })

            if (!user) {
              const response = {
                success: false,
                message: 'You must be signed in to view your order history.'
              }
              console.log('❌ [TOOL RESPONSE] getPurchaseHistory - User not signed in:', response)
              console.log('📜 ===== END getPurchaseHistory (AUTH ERROR) =====\n')
              return response
            }

            try {
              let query = supabase
                .from('orders')
                .select(`
                  id,
                  created_at,
                  total_amount,
                  status,
                  order_items (
                    product:products ( name )
                  )
                `)
                .eq('user_id', user.id)

              if (orderId) {
                query = query.eq('id', orderId).single()
              } else {
                query = query.order('created_at', { ascending: false }).limit(limit)
              }

              const { data, error } = await query

              if (error) throw error
              if (!data) {
                const response = {
                  success: false,
                  message: orderId ? `Could not find an order with ID #${orderId}.` : 'You have no past orders.'
                }
                console.log('❌ [TOOL RESPONSE] getPurchaseHistory - No data found:', response)
                console.log('📜 ===== END getPurchaseHistory (NO DATA) =====\n')
                return response
              }
              
              const orders = Array.isArray(data) ? data : [data]

              const formattedOrders = orders.map(order => ({
                orderId: order.id,
                date: new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                totalAmount: order.total_amount,
                currency: 'INR',
                status: order.status,
                itemCount: order.order_items.length,
                itemSample: order.order_items.slice(0, 3).map(item => item.product?.name).filter(Boolean)
              }))
              
              const response = {
                success: true,
                orders: formattedOrders,
                count: formattedOrders.length,
                message: `Found ${formattedOrders.length} order(s).`
              }

              console.log('✅ [TOOL RESPONSE] getPurchaseHistory - Success:', response)
              console.log('📜 ===== END getPurchaseHistory =====\n')
              return response

            } catch (error) {
              const errorResponse = {
                success: false,
                message: 'There was an error trying to fetch your order history.'
              }
              console.error('❌ [TOOL ERROR] getPurchaseHistory:', error, errorResponse)
              console.log('📜 ===== END getPurchaseHistory (ERROR) =====\n')
              return errorResponse
            }
          },

          // Place order using profile information
          placeOrder: async () => {
            console.log('\n📋 ===== TOOL CALL: placeOrder =====')
            console.log('📥 Parameters: none (using profile information)')
            console.log('👤 User:', user ? `${user.email} (ID: ${user.id})` : 'Not signed in')
            
            try {
              if (!user) {
                const response = { 
                  success: false, 
                  message: 'Please sign in to place an order. You can sign in through the website by clicking the user icon in the top right.' 
                }

                console.log('❌ [AUTH ERROR] User not signed in:', response)
                console.log('📋 ===== END placeOrder (AUTH ERROR) =====\n')
                return response
              }

              console.log('🔄 Refreshing cart data...')
              await refreshCart()
              
              console.log('📊 Cart state:', {
                itemCount: cartItems.length,
                totalAmount: getCartTotal(),
                items: cartItems.map(item => ({
                  name: item.product?.name,
                  quantity: item.quantity,
                  price: item.product?.price
                }))
              })

              if (cartItems.length === 0) {
                const response = { 
                  success: false, 
                  message: 'Your cart is empty. Please add some items before placing an order.' 
                }

                console.log('❌ [CART ERROR] Empty cart:', response)
                console.log('📋 ===== END placeOrder (CART ERROR) =====\n')
                return response
              }

              console.log('👤 Fetching user profile...')
              const userProfile = await getUserProfile()
              
              if (!userProfile) {
                const response = { 
                  success: false, 
                  message: 'Failed to fetch your profile information. Please try again.' 
                }

                console.log('❌ [PROFILE ERROR] Failed to fetch profile:', response)
                console.log('📋 ===== END placeOrder (PROFILE ERROR) =====\n')
                return response
              }

              console.log('📋 Profile information:', {
                hasName: !!userProfile.full_name,
                hasPhone: !!userProfile.phone,
                hasAddress: !!userProfile.address,
                phoneLength: userProfile.phone?.length,
                addressLength: userProfile.address?.length
              })

              // Validate profile completeness
              if (!userProfile.phone || userProfile.phone.trim().length < 10) {
                const response = { 
                  success: false, 
                  message: 'Please complete your profile with a valid phone number (at least 10 digits). You can update your profile by clicking the user icon and selecting your profile.' 
                }

                console.log('❌ [VALIDATION ERROR] Invalid phone:', response)
                console.log('📋 ===== END placeOrder (VALIDATION ERROR) =====\n')
                return response
              }

              if (!userProfile.address || userProfile.address.trim().length < 10) {
                const response = { 
                  success: false, 
                  message: 'Please complete your profile with a complete delivery address (at least 10 characters). You can update your profile by clicking the user icon and selecting your profile.' 
                }

                console.log('❌ [VALIDATION ERROR] Invalid address:', response)
                console.log('📋 ===== END placeOrder (VALIDATION ERROR) =====\n')
                return response
              }

              const customerName = userProfile.full_name?.trim() || user.email?.split('@')[0] || 'Customer'
              const customerPhone = userProfile.phone.trim()
              const deliveryAddress = userProfile.address.trim()

              console.log('📝 Order details:', {
                customerName,
                customerPhone: '***' + customerPhone.slice(-4),
                deliveryAddress: deliveryAddress.substring(0, 50) + '...',
                itemCount: getCartItemCount(),
                totalAmount: getCartTotal()
              })

              const orderTotal = getCartTotal()
              const itemCount = getCartItemCount()

              console.log('📋 Placing order...')
              await placeOrder(deliveryAddress, customerName, customerPhone)
              console.log('✅ Order placed successfully')
              
              // CRITICAL: Refresh cart after order placement (should be empty now)
              console.log('🔄 Refreshing cart after order placement...')
              await refreshCart()
              
              const response = { 
                success: true, 
                message: `Order placed successfully! Your order of ${itemCount} items totaling ₹${orderTotal.toFixed(2)} will be delivered to your saved address. You'll receive a confirmation shortly. Your cart is now empty and ready for your next order.`,
                orderTotal,
                itemCount,
                customerName,
                estimatedDelivery: '30-45 minutes',
                usedProfileInfo: true,
                // Include updated cart summary (should be empty)
                cartSummary: {
                  itemCount: getCartItemCount(),
                  totalAmount: getCartTotal(),
                  currency: 'INR'
                }
              }

              console.log('✅ [TOOL RESPONSE] placeOrder SUCCESS:', response)
              console.log('📋 ===== END placeOrder =====\n')
              return response
            } catch (error) {
              const errorResponse = { 
                success: false, 
                message: 'Failed to place order. Please try again or contact support if the problem persists.' 
              }

              console.error('❌ [TOOL ERROR] placeOrder FAILED:', error)
              console.error('❌ Error response:', errorResponse)
              console.log('📋 ===== END placeOrder (ERROR) =====\n')
              return errorResponse
            }
          },

          // Get user authentication and cart status
          getUserStatus: async () => {
            console.log('\n👤 ===== TOOL CALL: getUserStatus =====')
            console.log('📥 Parameters: none')
            console.log('👤 Current user state:', user ? {
              id: user.id,
              email: user.email,
              fullName: user.full_name
            } : 'Not signed in')
            
            try {
              if (user) {
                console.log('🔄 Refreshing cart data...')
                await refreshCart()
                console.log('📊 Cart refreshed:', {
                  itemCount: getCartItemCount(),
                  totalAmount: getCartTotal()
                })

                console.log('👤 Fetching user profile...')
                const userProfile = await getUserProfile()
                
                const isProfileComplete = userProfile?.phone && userProfile?.address && 
                                        userProfile.phone.length >= 10 && userProfile.address.length >= 10

                console.log('📋 Profile status:', {
                  hasProfile: !!userProfile,
                  isComplete: isProfileComplete,
                  hasPhone: !!userProfile?.phone,
                  hasAddress: !!userProfile?.address
                })

                const cartItemsData = cartItems.map(item => ({
                  name: item.product?.name,
                  quantity: item.quantity,
                  price: item.product?.price
                }))

                const response = {
                  success: true,
                  message: `You are signed in as ${user.email}. Your cart has ${getCartItemCount()} items totaling ₹${getCartTotal().toFixed(2)}. ${isProfileComplete ? 'Your profile is complete and ready for orders.' : 'Please complete your profile (phone and address) to place orders.'}`,
                  isSignedIn: true,
                  email: user.email,
                  userName: userProfile?.full_name || user.email?.split('@')[0] || null,
                  cartItemCount: getCartItemCount(),
                  cartTotal: getCartTotal(),
                  currency: 'INR',
                  hasItems: cartItems.length > 0,
                  cartItems: cartItemsData,
                  profileComplete: isProfileComplete,
                  profileInfo: {
                    hasPhone: !!userProfile?.phone,
                    hasAddress: !!userProfile?.address,
                    phoneValid: userProfile?.phone && userProfile.phone.length >= 10,
                    addressValid: userProfile?.address && userProfile.address.length >= 10
                  }
                }

                console.log('✅ [TOOL RESPONSE] getUserStatus SUCCESS (SIGNED IN):', response)
                console.log('👤 ===== END getUserStatus =====\n')
                return response
              } else {
                const response = {
                  success: true,
                  message: 'You are not signed in. Please sign in through the website to add items to cart and place orders.',
                  isSignedIn: false,
                  email: null,
                  userName: null,
                  cartItemCount: 0,
                  cartTotal: 0,
                  currency: 'INR',
                  hasItems: false,
                  cartItems: [],
                  profileComplete: false
                }

                console.log('✅ [TOOL RESPONSE] getUserStatus SUCCESS (NOT SIGNED IN):', response)
                console.log('👤 ===== END getUserStatus =====\n')
                return response
              }
            } catch (error) {
              const errorResponse = {
                success: false,
                message: 'Failed to get user status. Please try again.',
                error: 'Failed to get user status',
                isSignedIn: false,
                cartItemCount: 0,
                cartTotal: 0
              }

              console.error('❌ [TOOL ERROR] getUserStatus FAILED:', error)
              console.error('❌ Error response:', errorResponse)
              console.log('👤 ===== END getUserStatus (ERROR) =====\n')
              return errorResponse
            }
          }
        }
      })

      setConversationId(id)
    } catch (error) {
      console.error('Failed to start conversation:', error)
      toast.error('Failed to start voice assistant')
      // CRITICAL: Update parent component about error
      onStatusChange(false, false)
    }
  }

  const stopConversation = async () => {
    try {
      await conversation.endSession()
    } catch (error) {
      console.error('Failed to stop conversation:', error)
    }
  }

  return null // This component doesn't render anything visible
}

export default VoiceAssistant