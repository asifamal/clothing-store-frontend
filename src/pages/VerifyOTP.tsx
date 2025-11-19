import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { toast } from '@/hooks/use-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ShieldCheck, Loader2, Package } from 'lucide-react'

const VerifyOTP: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { tokens, isAuthenticated } = useAuth()
  const { getTotalPrice, items, fetchCart } = useCart()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [otpVerified, setOtpVerified] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)

  const addressId = location.state?.addressId
  const contactPhone = location.state?.contactPhone

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!addressId || !contactPhone) {
      toast({
        title: "Error",
        description: "Missing order information. Please try again.",
        variant: "destructive"
      })
      navigate('/checkout')
      return
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isAuthenticated, addressId, navigate])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleVerifyAndPlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Step 1: Verify OTP
      const verifyResponse = await fetch('http://localhost:8000/api/orders/verify-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access}`
        },
        body: JSON.stringify({ otp })
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        toast({
          title: "Verification Failed",
          description: verifyData.message || "Invalid OTP. Please try again.",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      // Step 2: Place Order
      setPlacingOrder(true)
      const orderResponse = await fetch('http://localhost:8000/api/orders/place/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access}`
        },
        body: JSON.stringify({ 
          address_id: addressId,
          contact_phone: contactPhone
        })
      })

      const orderData = await orderResponse.json()

      if (orderResponse.ok) {
        // Refresh cart to reflect empty state
        await fetchCart()
        
        toast({
          title: "Order Placed Successfully!",
          description: `Order #${orderData.data.order.id} has been confirmed`
        })
        navigate(`/order-success/${orderData.data.order.id}`)
      } else {
        toast({
          title: "Order Failed",
          description: orderData.message || "Failed to place order. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process order. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setPlacingOrder(false)
    }
  }

  const handleResendOTP = async () => {
    setResending(true)

    try {
      const response = await fetch('http://localhost:8000/api/orders/generate-otp/', {
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
          title: "OTP Resent",
          description: "A new OTP has been sent to your email"
        })
        setTimeLeft(600) // Reset timer
        setOtp('') // Clear input
      } else {
        toast({
          title: "Failed to Resend",
          description: data.message || "Could not resend OTP",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP",
        variant: "destructive"
      })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Verify OTP</CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to your email
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleVerifyAndPlaceOrder} className="space-y-6">
                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold text-sm">Order Summary</h3>
                  <div className="space-y-1">
                    {items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {item.product.name}
                          {item.size && <span className="font-medium"> ({item.size})</span>}
                          {' '}x {item.quantity}
                        </span>
                        <span>₹{(parseFloat(item.product.discounted_price || item.product.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="text-xs text-muted-foreground">...and {items.length - 3} more items</p>
                    )}
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₹{getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                    autoComplete="off"
                    autoFocus
                  />
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  {timeLeft > 0 ? (
                    <p>Time remaining: <span className="font-semibold text-foreground">{formatTime(timeLeft)}</span></p>
                  ) : (
                    <p className="text-red-600">OTP expired</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={loading || otp.length !== 6 || timeLeft === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {placingOrder ? 'Placing Order...' : 'Verifying...'}
                    </>
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      Verify OTP & Place Order
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendOTP}
                    disabled={resending || timeLeft > 540} // Can resend after 1 minute
                    className="text-sm"
                  >
                    {resending ? 'Resending...' : "Didn't receive code? Resend"}
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/checkout')}
                    className="text-sm"
                  >
                    Back to Checkout
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Check your email inbox for the OTP. The code is valid for 10 minutes.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default VerifyOTP
