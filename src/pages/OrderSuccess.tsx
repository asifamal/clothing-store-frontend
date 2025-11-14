import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Package, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface OrderDetails {
  id: number
  status: string
  total_amount: string
  created_at: string
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="ml-3">Loading order details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!order) {
    navigate('/')
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'packed': return 'bg-purple-100 text-purple-800'
      case 'dispatched': return 'bg-orange-100 text-orange-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-3xl font-bold text-green-600 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">
            Thank you for your order. We'll send you shipping confirmation when your items are on the way.
          </p>
        </div>

        {/* Order Details */}
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order #{order.id}</span>
                <Badge className={getStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Order Date</h4>
                  <p className="text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Total Amount</h4>
                  <p className="text-xl font-bold">${order.total_amount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {order.address && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-600">
                  <p>{order.address.street}</p>
                  <p>{order.address.city}, {order.address.state} {order.address.pincode}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items Ordered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                      {item.product_image ? (
                        <img 
                          src={item.product_image} 
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product_name}</h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm text-gray-600">
                        Price: ${item.price}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.total}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
            >
              Continue Shopping
            </Button>
            <Button 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2"
            >
              View Orders
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default OrderSuccess