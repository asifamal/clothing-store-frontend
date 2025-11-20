import React from 'react'
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useCart, type CartItem } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"

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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[450px] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="font-serif text-2xl">Shopping Bag ({items.length})</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {!isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Please login</h3>
              <p className="text-muted-foreground max-w-xs">
                Sign in to view your cart items and proceed to checkout.
              </p>
              <div className="flex gap-3 w-full max-w-xs pt-4">
                <Button onClick={handleLoginRedirect} className="flex-1">
                  Login
                </Button>
                <Button onClick={() => { navigate('/register'); onClose(); }} variant="outline" className="flex-1">
                  Sign Up
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Your bag is empty</h3>
              <p className="text-muted-foreground">
                Looks like you haven't added anything to your bag yet.
              </p>
              <Button onClick={onClose} variant="outline" className="mt-4">
                Start Shopping
              </Button>
            </div>
          ) : (
            <ScrollArea className="flex-1 px-6">
              <div className="py-6 space-y-6">
                {items.map((item) => (
                  <CartItemRow 
                    key={item.id} 
                    item={item}
                    onUpdateQuantity={(quantity) => updateQuantity(item.id, quantity)}
                    onRemove={() => removeFromCart(item.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {isAuthenticated && items.length > 0 && (
          <div className="p-6 bg-secondary/10 border-t space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>₹{getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
            <Button 
              onClick={handleCheckout}
              className="w-full h-12 text-base uppercase tracking-wide"
              disabled={loading}
            >
              Checkout <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
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

  return (
    <div className="flex gap-4">
      {/* Product Image */}
      <div className="w-20 h-24 bg-secondary/20 rounded-sm overflow-hidden flex-shrink-0">
        {item.product.image ? (
          <img 
            src={item.product.image} 
            alt={item.product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No Image
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-medium text-sm leading-tight line-clamp-2">{item.product.name}</h4>
            <button 
              onClick={handleRemove}
              disabled={updating}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {item.size && (
            <p className="text-xs text-muted-foreground mt-1">Size: {item.size}</p>
          )}
        </div>
        
        <div className="flex justify-between items-end">
          <div className="flex items-center border rounded-sm">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={updating || item.quantity <= 1}
              className="h-7 w-7 flex items-center justify-center hover:bg-secondary/50 disabled:opacity-50"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={updating}
              className="h-7 w-7 flex items-center justify-center hover:bg-secondary/50 disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <p className="font-medium text-sm">₹{(price * item.quantity).toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}

export default CartDrawer