import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Loader2, Package } from 'lucide-react'

const OrderConfirmation: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { tokens, isAuthenticated } = useAuth()
  const { items, getTotalPrice } = useCart()
  const [loading, setLoading] = useState(false)

  const addressId = location.state?.addressId

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!addressId) {
      toast({
        title: "Error",
        description: "Invalid session. Please start checkout again.",
        variant: "destructive"
      })
      navigate('/checkout')
    }
  }, [isAuthenticated, addressId, navigate])

  const handlePlaceOrder = async () => {
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/orders/place/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access}`
        },
        body: JSON.stringify({ address_id: addressId })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Order Placed Successfully!",
          description: `Order #${data.data.order.id} has been confirmed`
        })
        navigate(`/order-success/${data.data.order.id}`)
      } else {
        toast({
          title: "Order Failed",
          description: data.message || "Failed to place order. Please try again.",
          variant: "destructive"
        })
        
        // If OTP verification required, go back to checkout
        if (response.status === 403) {
          navigate('/checkout')
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Confirm Your Order</CardTitle>
              <p className="text-muted-foreground mt-2">
                Your OTP has been verified. Review and place your order.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Order Summary */}
              <div>
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product.name} x {item.quantity}</span>
                      <span className="font-medium">
                        ${(parseFloat(item.product.discounted_price || item.product.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handlePlaceOrder} 
                  className="w-full" 
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/checkout')}
                  className="w-full"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>By placing your order, you agree to our terms and conditions.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default OrderConfirmation
