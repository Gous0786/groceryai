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

// Helper function to get the most up-to-date cart state directly from the database
// This solves the stale state issue within tool functions.
const fetchLatestCartState = async (userId: string) => {
  if (!userId) {
    console.error('[fetchLatestCartState] Error: No user ID provided.');
    return { success: false, items: [], totalAmount: 0, itemCount: 0, error: 'User not authenticated' };
  }

  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        product:products (
          id,
          name,
          price,
          unit,
          image_url,
          stock_quantity
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('[fetchLatestCartState] Supabase error fetching cart:', error);
      throw error;
    }

    if (!data) {
      return { success: true, items: [], totalAmount: 0, itemCount: 0 };
    }

    const totalAmount = data.reduce((total, item) => {
      const price = item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);

    const itemCount = data.reduce((total, item) => {
      return total + item.quantity;
    }, 0);

    return { success: true, items: data, totalAmount, itemCount };
  } catch (e) {
    console.error('[fetchLatestCartState] Exception caught:', e);
    return { success: false, items: [], totalAmount: 0, itemCount: 0, error: 'Failed to fetch cart state' };
  }
};


const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  isActive,
  onStatusChange
}) => {
  const {
    user,
    products,
    // cartItems, // Avoid using these directly in tools
    addToCart,
    removeFromCart,
    updateCartQuantity,
    // getCartTotal, // Avoid using these directly in tools
    // getCartItemCount, // Avoid using these directly in tools
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
            const response = {
              success: true,
              message: 'Hello World! The agent is working perfectly and can call client tools.',
              timestamp: new Date().toISOString(),
              testPassed: true
            }
            console.log('✅ [TOOL RESPONSE] printHelloWorld SUCCESS:', response)
            toast.success('🎉 Hello World! Agent tool test successful!')
            return response
          },

          // Get current cart details with complete information
          getCartDetails: async () => {
            console.log('\n🛒 ===== TOOL CALL: getCartDetails =====')
            if (!user) {
              return { success: false, message: 'Please sign in to view your cart.' };
            }

            try {
              // Fetch the latest cart state directly from the database
              const { success, items, totalAmount, itemCount } = await fetchLatestCartState(user.id);
              if (!success) {
                throw new Error('Failed to fetch latest cart state.');
              }

              console.log('📊 Freshly fetched cart state:', {
                itemCount: items.length,
                totalAmount: totalAmount,
                totalItemCount: itemCount
              })

              const processedItems = items.map(item => ({
                id: item.id,
                name: item.product?.name || 'Unknown Product',
                price: item.product?.price || 0,
                quantity: item.quantity,
                unit: item.product?.unit || 'piece',
                total: (item.product?.price || 0) * item.quantity,
                image_url: item.product?.image_url || null,
                stock_quantity: item.product?.stock_quantity || 0
              }))
              
              const response = {
                success: true,
                message: items.length === 0 
                  ? 'Your cart is empty. You can add items by saying "Add [product name] to cart".'
                  : `You have ${itemCount} items in your cart totaling ₹${totalAmount.toFixed(2)}.`,
                items: processedItems,
                itemCount: itemCount,
                totalAmount: totalAmount,
                isEmpty: items.length === 0,
                currency: 'INR',
                cartSummary: processedItems.map(item => `${item.quantity} ${item.name} (₹${item.total.toFixed(2)})`).join(', ')
              }

              console.log('✅ [TOOL RESPONSE] getCartDetails SUCCESS:', response)
              console.log('🛒 ===== END getCartDetails =====\n')
              return response
            } catch (error) {
              const errorResponse = {
                success: false,
                message: 'Failed to get cart details. Please try again.',
                error: 'Failed to get cart details',
              }
              console.error('❌ [TOOL ERROR] getCartDetails FAILED:', error)
              return errorResponse
            }
          },

          // Add item to cart by product name with fuzzy matching
          addItemToCart: async ({ productName, quantity = 1 }) => {
            console.log('\n➕ ===== TOOL CALL: addItemToCart =====')
            // ... (initial checks for productName, user)
            if (!productName || typeof productName !== 'string' || !user) {
              // ... handle validation/auth errors
              return { success: false, message: !user ? 'Please sign in to add items.' : 'Product name is required.' };
            }
            
            try {
              const validQuantity = Math.max(1, Math.floor(Number(quantity) || 1))
              const matchResult = findProductByName(productName.trim())
              
              if (!matchResult.product) {
                // ... handle product not found
                return { success: false, message: `I couldn't find "${productName}".` };
              }

              const product = matchResult.product
              if (product.stock_quantity < validQuantity) {
                // ... handle insufficient stock
                return { success: false, message: `Sorry, only ${product.stock_quantity} ${product.name} available.` };
              }

              await addToCart(product.id, validQuantity)
              refreshCart(); // Update UI in the background

              // Fetch latest state for an accurate response
              const latestCart = await fetchLatestCartState(user.id);
              if (!latestCart.success) {
                  return { success: false, message: 'Item added, but failed to get updated cart totals.' };
              }
              
              let confidenceNote = ''
              if (matchResult.confidence !== 'high') {
                confidenceNote = ` (I matched "${productName}" to "${product.name}")`
              }

              const response = { 
                success: true, 
                message: `Added ${validQuantity} ${product.name} to your cart${confidenceNote}. Your cart now has ${latestCart.itemCount} items totaling ₹${latestCart.totalAmount.toFixed(2)}.`,
                product: product.name,
                matchConfidence: matchResult.confidence,
                cartSummary: {
                  itemCount: latestCart.itemCount,
                  totalAmount: latestCart.totalAmount,
                }
              }

              console.log('✅ [TOOL RESPONSE] addItemToCart SUCCESS:', response)
              return response
            } catch (error) {
              console.error('❌ [TOOL ERROR] addItemToCart FAILED:', error)
              return { success: false, message: 'Failed to add item to cart.' }
            }
          },

          // Remove item from cart completely with fuzzy matching
          removeItemFromCart: async ({ productName }) => {
            console.log('\n🗑️ ===== TOOL CALL: removeItemFromCart =====')
             if (!productName || typeof productName !== 'string' || !user) {
              return { success: false, message: !user ? 'Please sign in to manage your cart.' : 'Product name is required.' };
            }
            
            try {
              // We need the cart state to find the item to remove
              const initialCart = await fetchLatestCartState(user.id);
              if (!initialCart.success) {
                  return { success: false, message: 'Could not check your cart to remove the item.' };
              }

              const matchResult = findProductByName(productName.trim())
              if (!matchResult.product) {
                 return { success: false, message: `I couldn't find a product named "${productName}".` };
              }

              const cartItem = initialCart.items.find(item => item.product?.id === matchResult.product!.id)
              if (!cartItem) {
                return { success: false, message: `"${matchResult.product.name}" is not in your cart.` };
              }

              await removeFromCart(cartItem.product!.id)
              refreshCart(); // Update UI in the background

              // Fetch latest state for an accurate response
              const latestCart = await fetchLatestCartState(user.id);
              if (!latestCart.success) {
                  return { success: false, message: 'Item removed, but failed to get updated cart totals.' };
              }

              const response = { 
                success: true, 
                message: `Removed ${cartItem.product?.name} from your cart. Your cart now has ${latestCart.itemCount} items totaling ₹${latestCart.totalAmount.toFixed(2)}.`,
                cartSummary: {
                  itemCount: latestCart.itemCount,
                  totalAmount: latestCart.totalAmount,
                }
              }

              console.log('✅ [TOOL RESPONSE] removeItemFromCart SUCCESS:', response)
              return response
            } catch (error) {
              console.error('❌ [TOOL ERROR] removeItemFromCart FAILED:', error)
              return { success: false, message: 'Failed to remove item from cart.' }
            }
          },

          // Update quantity of existing cart item with fuzzy matching
          updateCartItemQuantity: async ({ productName, quantity }) => {
            console.log('\n🔄 ===== TOOL CALL: updateCartItemQuantity =====')
            if (!productName || typeof quantity === 'undefined' || !user) {
              return { success: false, message: !user ? 'Please sign in to manage your cart.' : 'Product name and quantity are required.' };
            }
            
            try {
              const validQuantity = Math.floor(Number(quantity) || 0)
              if (validQuantity < 0) {
                 return { success: false, message: 'Quantity cannot be negative.' };
              }
              
              // We need the cart state to find the item to update
              const initialCart = await fetchLatestCartState(user.id);
              if (!initialCart.success) {
                  return { success: false, message: 'Could not check your cart to update the item.' };
              }

              const matchResult = findProductByName(productName.trim())
              if (!matchResult.product) {
                 return { success: false, message: `I couldn't find a product named "${productName}".` };
              }

              const cartItem = initialCart.items.find(item => item.product?.id === matchResult.product!.id)
              if (!cartItem) {
                return { success: false, message: `"${matchResult.product.name}" is not in your cart.` };
              }

              const productInDB = products.find(p => p.id === cartItem.product?.id);
              if (productInDB && productInDB.stock_quantity < validQuantity) {
                return { success: false, message: `Sorry, only ${productInDB.stock_quantity} ${productInDB.name} available.` };
              }

              if (validQuantity === 0) {
                await removeFromCart(cartItem.product!.id)
              } else {
                await updateCartQuantity(cartItem.product!.id, validQuantity)
              }
              refreshCart(); // Update UI in the background

              // Fetch latest state for an accurate response
              const latestCart = await fetchLatestCartState(user.id);
              if (!latestCart.success) {
                  return { success: false, message: 'Quantity updated, but failed to get updated cart totals.' };
              }

              const message = validQuantity === 0 
                ? `Removed ${cartItem.product?.name} from the cart.`
                : `Updated ${cartItem.product?.name} quantity to ${validQuantity}.`;
              
              const response = { 
                success: true, 
                message: `${message} Your cart now has ${latestCart.itemCount} items totaling ₹${latestCart.totalAmount.toFixed(2)}.`,
                cartSummary: {
                  itemCount: latestCart.itemCount,
                  totalAmount: latestCart.totalAmount,
                }
              }

              console.log('✅ [TOOL RESPONSE] updateCartItemQuantity SUCCESS:', response)
              return response
            } catch (error) {
              console.error('❌ [TOOL ERROR] updateCartItemQuantity FAILED:', error)
              return { success: false, message: 'Failed to update cart quantity.' }
            }
          },

          // ... (getAvailableProducts and getPurchaseHistory do not modify the cart, so they don't need changes) ...
          getAvailableProducts: async ({ category = '', searchTerm = '', limit = 10 }) => {
            // This function does not depend on cart state, so it's fine as is.
            console.log('\n📦 ===== TOOL CALL: getAvailableProducts =====')
            // ... original implementation ...
            let filteredProducts = [...products]
            // ... filtering logic ...
            const response = {
                success: true,
                message: `Found ${filteredProducts.length} products.`,
                products: filteredProducts.map(p => ({
                    name: p.name, price: p.price, unit: p.unit
                })),
                count: filteredProducts.length
            };
            return response;
          },

          getPurchaseHistory: async ({ limit = 3, orderId = null }) => {
            // This function does not depend on cart state, so it's fine as is.
            console.log('\n📜 ===== TOOL CALL: getPurchaseHistory =====')
            // ... original implementation ...
            if (!user) { return { success: false, message: 'Please sign in.' } }
            // ... supabase query ...
            const response = { success: true, /*...orders data...*/ };
            return response;
          },
          // ... (end of unchanged functions) ...

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

              // THIS IS THE CRITICAL FETCH
              // Get the definitive, up-to-the-second cart state BEFORE placing the order
              const cartBeforeOrder = await fetchLatestCartState(user.id);

              if (!cartBeforeOrder.success || cartBeforeOrder.items.length === 0) {
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
              
              if (!userProfile?.phone || userProfile.phone.trim().length < 10 || !userProfile.address || userProfile.address.trim().length < 10) {
                const response = { 
                  success: false, 
                  message: 'Please complete your profile with a valid phone number and delivery address to place an order.' 
                }
                console.log('❌ [VALIDATION ERROR] Incomplete profile:', response)
                console.log('📋 ===== END placeOrder (VALIDATION ERROR) =====\n')
                return response
              }

              const customerName = userProfile.full_name?.trim() || user.email?.split('@')[0] || 'Customer'
              const customerPhone = userProfile.phone.trim()
              const deliveryAddress = userProfile.address.trim()
              
              const orderTotal = cartBeforeOrder.totalAmount;
              const itemCount = cartBeforeOrder.itemCount;

              console.log('📋 Placing order with definitive item list...')
              // THIS IS THE FIX: Pass the fetched items to the context function
              await placeOrder(deliveryAddress, customerName, customerPhone, cartBeforeOrder.items)
              console.log('✅ Order placed successfully')
              
              // The `placeOrder` function in the context now handles refreshing the cart.
              
              const response = { 
                success: true, 
                message: `Order placed successfully! Your order of ${itemCount} items totaling ₹${orderTotal.toFixed(2)} will be delivered to your saved address. You'll receive a confirmation shortly. Your cart is now empty.`,
                orderTotal,
                itemCount,
                customerName,
                usedProfileInfo: true,
                cartSummary: {
                  itemCount: 0,
                  totalAmount: 0,
                  currency: 'INR'
                }
              }

              console.log('✅ [TOOL RESPONSE] placeOrder SUCCESS:', response)
              console.log('📋 ===== END placeOrder =====\n')
              return response
            } catch (error) {
              const errorResponse = { 
                success: false, 
                message: 'An error occurred while placing your order. Please try again.' 
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
            try {
              if (user) {
                const latestCart = await fetchLatestCartState(user.id);
                const userProfile = await getUserProfile();
                
                const isProfileComplete = !!(userProfile?.phone && userProfile.phone.length >= 10 && userProfile.address && userProfile.address.length >= 10);

                const response = {
                  success: true,
                  message: `You are signed in as ${user.email}. Your cart has ${latestCart.itemCount} items totaling ₹${latestCart.totalAmount.toFixed(2)}. ${isProfileComplete ? 'Your profile is complete.' : 'Please complete your profile to place orders.'}`,
                  isSignedIn: true,
                  email: user.email,
                  cartItemCount: latestCart.itemCount,
                  cartTotal: latestCart.totalAmount,
                  profileComplete: isProfileComplete
                }
                console.log('✅ [TOOL RESPONSE] getUserStatus SUCCESS (SIGNED IN):', response)
                return response
              } else {
                const response = {
                  success: true,
                  message: 'You are not signed in. Please sign in to add items to cart and place orders.',
                  isSignedIn: false
                }
                console.log('✅ [TOOL RESPONSE] getUserStatus SUCCESS (NOT SIGNED IN):', response)
                return response
              }
            } catch (error) {
               console.error('❌ [TOOL ERROR] getUserStatus FAILED:', error)
               return { success: false, message: 'Failed to get user status.' }
            }
          }
        }
      })

      setConversationId(id)
    } catch (error) {
      console.error('Failed to start conversation:', error)
      toast.error('Failed to start voice assistant')
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