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
import { MapPin, Phone, ShieldCheck, CreditCard } from 'lucide-react'

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
  const { items, loading: cartLoading, getTotalPrice } = useCart()
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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 py-12">
        <h1 className="text-3xl font-serif font-bold mb-8">Checkout</h1>
        
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left Column: Address & Details */}
          <div className="lg:col-span-7 space-y-8">
            {/* Delivery Address */}
            <section>
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Delivery Address
              </h2>
              
              {addresses.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-secondary/10">
                  <p className="text-muted-foreground mb-4">No addresses found</p>
                  <Button onClick={() => navigate('/profile')}>
                    Add Address
                  </Button>
                </div>
              ) : (
                <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress} className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="relative">
                      <RadioGroupItem value={address.id.toString()} id={`address-${address.id}`} className="peer sr-only" />
                      <Label 
                        htmlFor={`address-${address.id}`} 
                        className="flex items-start p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-secondary/10"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{address.address_type}</span>
                            {address.is_default && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{address.street}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state} {address.pincode}
                          </p>
                          <p className="text-sm text-muted-foreground">{address.country}</p>
                        </div>
                        <div className="h-4 w-4 border rounded-full border-primary opacity-0 peer-data-[state=checked]:opacity-100 flex items-center justify-center">
                          <div className="h-2 w-2 bg-primary rounded-full" />
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              
              <Button 
                variant="link" 
                onClick={() => navigate('/profile')}
                className="mt-2 px-0"
              >
                + Add or Manage Addresses
              </Button>
            </section>

            <Separator />
            
            {/* Contact Phone */}
            <section>
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5" /> Contact Information
              </h2>
              
              <div className="space-y-4">
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${useProfilePhone ? 'border-primary bg-secondary/10' : 'hover:border-primary/50'}`}
                  onClick={() => setUseProfilePhone(true)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${useProfilePhone ? 'border-primary' : 'border-muted-foreground'}`}>
                      {useProfilePhone && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="font-medium">Use Profile Phone Number</p>
                      <p className="text-sm text-muted-foreground font-mono mt-1">
                        {user?.phone_number || 'Not set - Please add phone in profile'}</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${!useProfilePhone ? 'border-primary bg-secondary/10' : 'hover:border-primary/50'}`}
                  onClick={() => setUseProfilePhone(false)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!useProfilePhone ? 'border-primary' : 'border-muted-foreground'}`}>
                      {!useProfilePhone && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="font-medium">Use Different Number</p>
                    </div>
                  </div>
                  
                  {!useProfilePhone && (
                    <div className="ml-7">
                      <Input
                        type="tel"
                        placeholder="Enter phone number (e.g., +1234567890)"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="max-w-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <Card className="border-none shadow-lg bg-secondary/10">
                <CardHeader>
                  <CardTitle className="font-serif">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {items.map((item) => {
                      const price = parseFloat(item.product.discounted_price || item.product.price)
                      
                      return (
                        <div key={item.id} className="flex gap-4">
                          <div className="w-16 h-20 bg-background rounded-sm overflow-hidden flex-shrink-0">
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
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.size && <span>Size: {item.size} • </span>}
                              Qty: {item.quantity}
                            </p>
                            <p className="text-sm font-medium mt-1">₹{(price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-serif font-bold text-xl">
                      <span>Total</span>
                      <span>₹{getTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handlePlaceOrder}
                    disabled={loading || !selectedAddress || addresses.length === 0}
                    className="w-full h-12 text-base uppercase tracking-wide"
                  >
                    {loading ? "Processing..." : "Proceed to Payment"}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Secure Checkout
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default Checkout