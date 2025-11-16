import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
  const [contactPhone, setContactPhone] = useState<string>('')
  const [useProfilePhone, setUseProfilePhone] = useState<boolean>(true)
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

    const phoneToUse = useProfilePhone ? (user?.phone_number || '') : contactPhone
    
    if (!phoneToUse.trim()) {
      toast({
        title: "Phone number required",
        description: "Please provide a contact phone number",
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
        
        // Navigate to OTP verification page with phone number
        navigate('/verify-otp', { 
          state: { 
            addressId: parseInt(selectedAddress),
            contactPhone: phoneToUse
          } 
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
              
              {/* Contact Phone Section */}
              <div className="mt-6 border-t pt-6">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Contact Number for Delivery
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">We'll use this number to contact you about your delivery</p>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50/50" 
                         style={{ borderColor: useProfilePhone ? '#3b82f6' : '#e5e7eb', backgroundColor: useProfilePhone ? '#eff6ff' : 'white' }}>
                    <input
                      type="radio"
                      checked={useProfilePhone}
                      onChange={() => setUseProfilePhone(true)}
                      className="mt-1 cursor-pointer"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">Profile Phone Number</span>
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 font-mono">{user?.phone_number || 'Not set - Please add phone in profile'}</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50/50"
                         style={{ borderColor: !useProfilePhone ? '#3b82f6' : '#e5e7eb', backgroundColor: !useProfilePhone ? '#eff6ff' : 'white' }}>
                    <input
                      type="radio"
                      checked={!useProfilePhone}
                      onChange={() => setUseProfilePhone(false)}
                      className="mt-1 cursor-pointer"
                    />
                    <div className="ml-3 flex-1">
                      <span className="font-medium text-gray-900">Use Different Number</span>
                      <p className="text-sm text-gray-500 mt-1">Enter an alternate contact number</p>
                    </div>
                  </label>
                  
                  {!useProfilePhone && (
                    <div className="ml-7 mt-3 animate-in slide-in-from-top-2 duration-200">
                      <Input
                        type="tel"
                        placeholder="Enter phone number (e.g., +1234567890)"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="border-2 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={handlePlaceOrder}
                  disabled={loading || !selectedAddress || addresses.length === 0}
                  className="w-full h-12 text-base font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Proceed to Payment Verification'
                  )}
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