import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { User, CartItem, Product, Category } from '../types'
import toast from 'react-hot-toast'

interface AppContextType {
  user: User | null
  categories: Category[]
  products: Product[]
  cartItems: CartItem[]
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  addToCart: (productId: string, quantity?: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>
  getCartTotal: () => number
  getCartItemCount: () => number
  placeOrder: (deliveryAddress: string, customerName: string, customerPhone: string) => Promise<void>
  refreshCart: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata.full_name,
          avatar_url: session.user.user_metadata.avatar_url
        })
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata.full_name,
            avatar_url: session.user.user_metadata.avatar_url
          })
          await refreshCart()
        } else {
          setUser(null)
          setCartItems([])
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (user) {
      refreshCart()
    }
  }, [user])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      toast.error('Failed to fetch categories')
      return
    }

    setCategories(data || [])
  }

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .order('name')

    if (error) {
      toast.error('Failed to fetch products')
      return
    }

    setProducts(data || [])
  }

  const refreshCart = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', user.id)

    if (error) {
      toast.error('Failed to fetch cart')
      return
    }

    setCartItems(data || [])
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      throw error
    }
    toast.success('Signed in successfully!')
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      toast.error(error.message)
      throw error
    }
    toast.success('Account created successfully!')
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
      throw error
    }
    toast.success('Signed out successfully!')
  }

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      toast.error('Please sign in to add items to cart')
      return
    }

    // Check if item already exists in cart
    const existingItem = cartItems.find(item => item.product_id === productId)

    if (existingItem) {
      await updateCartQuantity(productId, existingItem.quantity + quantity)
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert([{ user_id: user.id, product_id: productId, quantity }])

      if (error) {
        toast.error('Failed to add item to cart')
        return
      }

      toast.success('Item added to cart!')
      await refreshCart()
    }
  }

  const removeFromCart = async (productId: string) => {
    if (!user) return

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId)

    if (error) {
      toast.error('Failed to remove item from cart')
      return
    }

    toast.success('Item removed from cart!')
    await refreshCart()
  }

  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (!user) return

    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', user.id)
      .eq('product_id', productId)

    if (error) {
      toast.error('Failed to update cart')
      return
    }

    await refreshCart()
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity
    }, 0)
  }

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  }

  const placeOrder = async (
  deliveryAddress: string,
  customerName: string,
  customerPhone: string,
  itemsForOrder: any[] // Pass the definitive list of items here
) => {
  if (!user || !itemsForOrder || itemsForOrder.length === 0) {
    console.error("placeOrder called with no user or no items.");
    return;
  }

  // Recalculate total based on the passed items to be 100% sure
  const totalAmount = itemsForOrder.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  // Create the order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total_amount: totalAmount,
      status: 'Pending',
      delivery_address: deliveryAddress,
      customer_name: customerName,
      customer_phone: customerPhone,
    })
    .select()
    .single();

  if (orderError) {
    console.error("Error creating order:", orderError);
    toast.error("Could not create your order.");
    throw orderError;
  }

  // THIS IS THE FIX: Use the 'itemsForOrder' argument, not the stale state
  const orderItems = itemsForOrder.map(item => ({
    order_id: orderData.id,
    product_id: item.product.id, // Ensure you are using the correct id property
    quantity: item.quantity,
    price: item.product?.price || 0,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

  if (itemsError) {
    console.error("Error creating order items:", itemsError);
    // Optional: Attempt to delete the created order to avoid dangling orders
    await supabase.from('orders').delete().eq('id', orderData.id);
    toast.error("Could not save items for your order.");
    throw itemsError;
  }

  // Clear the user's cart in the database
  await supabase.from('cart_items').delete().eq('user_id', user.id);

  // Refresh the UI
  await refreshCart();

  toast.success(`Order #${orderData.id} placed successfully!`);
};

  const value = {
    user,
    categories,
    products,
    cartItems,
    loading,
    signIn,
    signUp,
    signOut,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    getCartTotal,
    getCartItemCount,
    placeOrder,
    refreshCart
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}