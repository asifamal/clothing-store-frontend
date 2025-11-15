import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getUserAddresses } from '@/lib/api'

interface Address {
  id: number
  address_type: string
  street: string
  city: string
  state: string
  pincode: string
  country: string
  is_default: boolean
}

const Checkout: React.FC = () => {
  const { items, loading: cartLoading, clearCart, getTotalPrice } = useCart()
  const { tokens, user } = useAuth()
  const navigate = useNavigate()
  
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [addressesLoading, setAddressesLoading] = useState(true)

  // Fetch user addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!tokens?.access) return

      try {
        const response = await getUserAddresses(tokens.access)
        setAddresses(response.data || [])
        
        // Auto-select default address
        const defaultAddress = response.data?.find((addr: Address) => addr.is_default)
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id.toString())
        } else if (response.data?.length > 0) {
          setSelectedAddress(response.data[0].id.toString())
        }
      } catch (error: any) {
        console.error('Error fetching addresses:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to load addresses",
          variant: "destructive"
        })
      } finally {
        setAddressesLoading(false)
      }
    }

    fetchAddresses()
  }, [tokens])

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartLoading && items.length === 0) {
      navigate('/')
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart before checkout"
      })
    }
  }, [items, cartLoading, navigate])

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({
        title: "Address required",
        description: "Please select a delivery address",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Generate OTP for order verification
      const response = await fetch('http://localhost:8000/api/orders/generate-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access}`
        },
        body: JSON.stringify({
          address_id: parseInt(selectedAddress)
        })
      })

      const data = await response.json()

      if (response.ok && data.status === 'success') {
        toast({
          title: "OTP Sent",
          description: "Please check your email for the verification code"
        })
        
        // Navigate to OTP verification page
        navigate('/verify-otp', { 
          state: { addressId: parseInt(selectedAddress) } 
        })
      } else {
        toast({
          title: "Failed to Send OTP",
          description: data.message || "Failed to send OTP",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error placing order:', error)
      toast({
        title: "Error",
        description: "Failed to place order",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (cartLoading || addressesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="ml-3">Loading checkout...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (items.length === 0) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => {
                const price = parseFloat(item.product.discounted_price || item.product.price)
                const total = price * item.quantity
                
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                      {item.product.image ? (
                        <img 
                          src={item.product.image} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-gray-600">
                        {item.size && <span className="font-medium">Size: {item.size} • </span>}
                        ${price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${total.toFixed(2)}</p>
                    </div>
                  </div>
                )
              })}
              
              <Separator />
              
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No addresses found</p>
                  <Button onClick={() => navigate('/profile')}>
                    Add Address
                  </Button>
                </div>
              ) : (
                <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div key={address.id} className="flex items-start space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value={address.id.toString()} id={`address-${address.id}`} className="mt-1" />
                        <Label htmlFor={`address-${address.id}`} className="flex-1 cursor-pointer">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={address.is_default ? "default" : "secondary"}>
                                {address.address_type}
                              </Badge>
                              {address.is_default && (
                                <Badge variant="outline">Default</Badge>
                              )}
                            </div>
                            <p className="font-medium">{address.street}</p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.state} {address.pincode}
                            </p>
                            <p className="text-sm text-gray-600">{address.country}</p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
              
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/profile')}
                  className="w-full"
                >
                  Manage Addresses
                </Button>
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={handlePlaceOrder}
                  disabled={loading || !selectedAddress || addresses.length === 0}
                  className="w-full"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default Checkout