import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Package, ArrowRight, FileText, Download, ShoppingBag, MapPin, Calendar } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface OrderDetails {
  id: number
  status: string
  total_amount: string
  created_at: string
  invoice_pdf?: string
  address: {
    street: string
    city: string
    state: string
    pincode: string
  } | null
  items: Array<{
    id: number
    product_name: string
    product_image?: string
    quantity: number
    price: string
    total: string
  }>
}

const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const { tokens } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !tokens?.access) {
        navigate('/')
        return
      }

      try {
        const response = await fetch(`http://localhost:8000/api/orders/`, {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.status === 'success') {
            // Find the specific order
            const foundOrder = data.data.orders.find((o: OrderDetails) => o.id.toString() === orderId)
            if (foundOrder) {
              setOrder(foundOrder)
            } else {
              navigate('/')
            }
          }
        } else {
          navigate('/')
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, tokens, navigate])

  if (loading) {
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

  if (!order) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'dispatched': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-12 space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-serif font-bold tracking-tight">Order Placed Successfully!</h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Thank you for your purchase. Your order has been confirmed and will be shipped shortly.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm font-medium bg-secondary/20 py-2 px-4 rounded-full w-fit mx-auto">
              <span>Order ID: #{order.id}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Order Details Card */}
            <Card className="overflow-hidden border-none shadow-lg bg-secondary/5">
              <CardHeader className="bg-secondary/10 border-b border-secondary/20 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-serif text-xl">Order Details</CardTitle>
                  <Badge className={`${getStatusColor(order.status)} px-3 py-1 capitalize`}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Items List */}
                <div className="space-y-6">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="w-16 h-20 bg-background rounded-sm overflow-hidden flex-shrink-0 border">
                        {item.product_image ? (
                          <img 
                            src={item.product_image} 
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-base truncate">{item.product_name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Qty: {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <div className="text-right font-medium">
                        ₹{item.total}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Order Info Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> Shipping Address
                    </h4>
                    {order.address ? (
                      <div className="text-sm leading-relaxed">
                        <p>{order.address.street}</p>
                        <p>{order.address.city}, {order.address.state} {order.address.pincode}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No address provided</p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" /> Payment Summary
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{order.total_amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span className="text-green-600">Free</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                        <span>Total Paid</span>
                        <span>₹{order.total_amount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full sm:w-auto min-w-[200px] h-12"
              >
                <ShoppingBag className="mr-2 h-4 w-4" /> Continue Shopping
              </Button>
              
              <Button 
                onClick={() => navigate('/orders')}
                className="w-full sm:w-auto min-w-[200px] h-12"
              >
                View All Orders <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {order.invoice_pdf && (
                <Button
                  variant="secondary"
                  onClick={() => window.open(`http://localhost:8000${order.invoice_pdf}`, '_blank')}
                  className="w-full sm:w-auto min-w-[200px] h-12"
                >
                  <Download className="mr-2 h-4 w-4" /> Download Invoice
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default OrderSuccess