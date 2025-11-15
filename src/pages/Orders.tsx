import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Eye, ArrowLeft, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface OrderItem {
  id: number
  product_name: string
  product_image?: string
  quantity: number
  price: string
  total: string
}

interface Order {
  id: number
  status: string
  total_amount: string
  created_at: string
  updated_at: string
  invoice_pdf?: string
  address: {
    street: string
    city: string
    state: string
    pincode: string
  } | null
  items: OrderItem[]
}

const Orders: React.FC = () => {
  const { tokens } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!tokens) {
        navigate('/login')
        return
      }

      try {
        const response = await fetch('http://localhost:8000/api/orders/', {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.status === 'success') {
            setOrders(data.data.orders)
          }
        } else {
          console.error('Orders fetch failed with status:', response.status)
          const errorData = await response.text()
          console.error('Error response:', errorData)
          toast({
            title: "Error",
            description: "Failed to load orders",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
        toast({
          title: "Error",
          description: "Failed to load orders",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [tokens, navigate])

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

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="ml-3">Loading orders...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/profile')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
              <Button onClick={() => navigate('/')}>
                Start Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        Order #{order.id}
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${order.total_amount}</p>
                      <p className="text-sm text-gray-600">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Order Items Preview (show first 2 items) */}
                    <div className="space-y-2">
                      {order.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden">
                            {item.product_image ? (
                              <img 
                                src={item.product_image} 
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                <Package className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.product_name}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × ${item.price}
                            </p>
                          </div>
                          <div className="text-sm font-medium">
                            ${item.total}
                          </div>
                        </div>
                      ))}
                      
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-600 pl-15">
                          +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Delivery Address */}
                    {order.address && (
                      <div className="border-t pt-3">
                        <h4 className="font-medium text-sm text-gray-700 mb-1">Delivery Address</h4>
                        <p className="text-sm text-gray-600">
                          {order.address.street}, {order.address.city}, {order.address.state} {order.address.pincode}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="border-t pt-3 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/order-success/${order.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      
                      {order.invoice_pdf && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`http://localhost:8000${order.invoice_pdf}`, '_blank')}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Invoice
                        </Button>
                      )}
                      
                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          Rate & Review
                        </Button>
                      )}
                      
                      {order.status === 'placed' && (
                        <Button variant="destructive" size="sm">
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  )
}

export default Orders