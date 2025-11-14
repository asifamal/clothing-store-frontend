import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'

interface CartIconProps {
  onClick?: () => void
}

const CartIcon: React.FC<CartIconProps> = ({ onClick }) => {
  const { getTotalItems, loading } = useCart()
  const { isAuthenticated } = useAuth()
  const itemCount = getTotalItems()

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="relative p-2"
      onClick={onClick}
      disabled={loading}
    >
      <ShoppingCart className="h-5 w-5" />
      {isAuthenticated && itemCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  )
}

export default CartIcon