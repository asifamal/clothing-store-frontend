import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

export interface CartItem {
  id: number
  product: {
    id: number
    name: string
    price: string
    discounted_price: string
    image?: string
  }
  quantity: number
  size?: string
}

interface CartContextType {
  items: CartItem[]
  loading: boolean
  addToCart: (productId: number, quantity?: number, size?: string) => Promise<boolean>
  updateQuantity: (itemId: number, quantity: number) => Promise<boolean>
  removeFromCart: (itemId: number) => Promise<boolean>
  clearCart: () => Promise<boolean>
  fetchCart: () => Promise<void>
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

interface CartProviderProps {
  children: ReactNode
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const { tokens, isAuthenticated } = useAuth()

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(`http://localhost:8000/api/${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(tokens && { Authorization: `Bearer ${tokens.access}` }),
        ...options.headers,
      },
    })
    return response
  }

  const fetchCart = async () => {
    if (!isAuthenticated || !tokens) {
      setItems([])
      return
    }

    try {
      setLoading(true)
      const response = await apiCall('cart/')
      
      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success') {
          setItems(data.data.cart?.items || [])
        } else {
          console.error('Cart fetch error:', data.message)
          setItems([])
        }
      } else if (response.status === 401) {
        // Authentication failed, clear items
        setItems([])
      } else {
        console.error('Cart fetch failed with status:', response.status)
        setItems([])
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId: number, quantity: number = 1, size?: string): Promise<boolean> => {
    if (!isAuthenticated || !tokens) {
      return false
    }

    try {
      setLoading(true)
      const response = await apiCall('cart/add/', {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          quantity,
          ...(size && { size })
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success') {
          await fetchCart() // Refresh cart after adding
          return true
        } else {
          console.error('Add to cart error:', data.message)
          return false
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Add to cart failed:', errorData)
        return false
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: number, quantity: number): Promise<boolean> => {
    if (!isAuthenticated) {
      return false
    }

    try {
      setLoading(true)
      const response = await apiCall(`cart/item/${itemId}/`, {
        method: 'PUT',
        body: JSON.stringify({ quantity })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success') {
          await fetchCart() // Refresh cart after update
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error updating cart item:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (itemId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      return false
    }

    try {
      setLoading(true)
      const response = await apiCall(`cart/item/${itemId}/`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success') {
          await fetchCart() // Refresh cart after removal
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error removing from cart:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async (): Promise<boolean> => {
    if (!isAuthenticated) {
      return false
    }

    try {
      setLoading(true)
      // Remove all items one by one
      const promises = items.map(item => removeFromCart(item.id))
      await Promise.all(promises)
      return true
    } catch (error) {
      console.error('Error clearing cart:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const getTotalItems = (): number => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = (): number => {
    return items.reduce((total, item) => {
      const price = parseFloat(item.product.discounted_price || item.product.price)
      return total + (price * item.quantity)
    }, 0)
  }

  // Fetch cart when user authentication changes
  useEffect(() => {
    if (isAuthenticated && tokens) {
      fetchCart()
    } else {
      setItems([])
    }
  }, [isAuthenticated, tokens])

  const value: CartContextType = {
    items,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
    getTotalItems,
    getTotalPrice
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}