import React from 'react'
import { X, Plus, Minus, Trash2, LogIn } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useCart, type CartItem } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { items, loading, updateQuantity, removeFromCart, getTotalPrice } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleCheckout = () => {
    navigate('/checkout')
    onClose()
  }

  const handleLoginRedirect = () => {
    navigate('/login')
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-white shadow-lg z-50 flex flex-col border-l">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0">
          <h2 className="text-lg font-semibold">Shopping Cart</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          {!isAuthenticated ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Please login</h3>
              <p className="text-gray-500 mb-4">Login to view your cart and add items!</p>
              <div className="space-y-2">
                <Button onClick={handleLoginRedirect} className="w-full">
                  Login
                </Button>
                <Button onClick={() => navigate('/register')} variant="outline" className="w-full">
                  Sign Up
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-3 4h18M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-4">Add some items to get started!</p>
              <Button onClick={onClose} variant="outline">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItemRow 
                  key={item.id} 
                  item={item}
                  onUpdateQuantity={(quantity) => updateQuantity(item.id, quantity)}
                  onRemove={() => removeFromCart(item.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {isAuthenticated && items.length > 0 && (
          <>
            <Separator />
            <div className="p-4 bg-white border-t sticky bottom-0">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-lg">${getTotalPrice().toFixed(2)}</span>
              </div>
              <Button 
                onClick={handleCheckout}
                className="w-full"
                disabled={loading}
              >
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

interface CartItemRowProps {
  item: CartItem
  onUpdateQuantity: (quantity: number) => Promise<boolean>
  onRemove: () => Promise<boolean>
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const [updating, setUpdating] = React.useState(false)

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return
    setUpdating(true)
    await onUpdateQuantity(newQuantity)
    setUpdating(false)
  }

  const handleRemove = async () => {
    setUpdating(true)
    await onRemove()
    setUpdating(false)
  }

  const price = parseFloat(item.product.discounted_price || item.product.price)
  const totalPrice = price * item.quantity

  return (
    <div className="flex gap-3 p-3 border rounded-lg">
      {/* Product Image */}
      <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
        {item.product.image ? (
          <img 
            src={item.product.image} 
            alt={item.product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
        <p className="text-sm text-gray-600">${price.toFixed(2)}</p>
        
        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={updating || item.quantity <= 1}
            className="h-6 w-6 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <Badge variant="secondary" className="h-6 min-w-[2rem] text-center">
            {item.quantity}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={updating}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={updating}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Total Price */}
      <div className="text-sm font-medium">
        ${totalPrice.toFixed(2)}
      </div>
    </div>
  )
}

export default CartDrawer