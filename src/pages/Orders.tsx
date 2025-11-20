import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Eye, ArrowLeft, Download, Star, X, ShoppingBag } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ReviewForm from '@/components/ReviewForm'
import { createReview } from '@/lib/api'

interface OrderItem {
  id: number
  product_id: number
  product_name: string
  product_image?: string
  quantity: number
  price: string
  total: string
  has_review?: boolean
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
  const [reviewingItem, setReviewingItem] = useState<{ orderId: number; orderItemId: number; productId: number } | null>(null)
  const [reviewedItems, setReviewedItems] = useState<Set<number>>(new Set())

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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'dispatched': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  const getStatusText = (status: string) => {
    if (status === 'pending') return 'Pending Confirmation'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const handleSubmitReview = async (data: { rating: number; title: string; comment: string }) => {
    if (!tokens?.access || !reviewingItem) return

    try {
      await createReview(tokens.access, { 
        ...data, 
        product: reviewingItem.productId,
        order_item: reviewingItem.orderItemId 
      })
      
      // Mark this item as reviewed
      setReviewedItems(prev => new Set(prev).add(reviewingItem.orderItemId))
      
      toast({
        title: "✓ Thank you for your review!",
        description: "Your review has been submitted successfully and is now visible.",
      })
      setReviewingItem(null)
    } catch (error: any) {
      console.error("Review submission error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      })
    }
  }

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/profile')}
                className="pl-0 hover:bg-transparent hover:text-primary/80 mb-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
              </Button>
              <h1 className="text-3xl font-serif font-bold">My Orders</h1>
              <p className="text-muted-foreground mt-1">Track and manage your recent purchases</p>
            </div>
          </div>

          {orders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  You haven't placed any orders yet. Start shopping to see your orders here.
                </p>
                <Button onClick={() => navigate('/')} size="lg">
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden transition-all hover:shadow-md border-border/60">
                  <CardHeader className="bg-secondary/5 border-b border-border/60 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-serif font-bold text-lg">Order #{order.id}</span>
                          <Badge className={`${getStatusColor(order.status)} font-normal`}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-bold text-lg">₹{order.total_amount}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Order Items */}
                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex gap-4 items-start sm:items-center group">
                            <div className="w-16 h-20 bg-secondary/20 rounded-sm overflow-hidden flex-shrink-0 border border-border/50">
                              {item.product_image ? (
                                <img 
                                  src={item.product_image} 
                                  alt={item.product_name}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <Package className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{item.product_name}</h4>
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

                      {/* Footer Actions & Info */}
                      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
                        <div className="text-sm text-muted-foreground">
                          {order.address && (
                            <>
                              <span className="font-medium text-foreground">Ship to:</span> {order.address.city}, {order.address.state}
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/order-success/${order.id}`)}
                          >
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            Details
                          </Button>
                          
                          {order.invoice_pdf && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`http://localhost:8000${order.invoice_pdf}`, '_blank')}
                            >
                              <Download className="mr-2 h-3.5 w-3.5" />
                              Invoice
                            </Button>
                          )}

                          {order.status.toLowerCase() === 'delivered' && !order.items.some(item => item.has_review || reviewedItems.has(item.id)) && (
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => {
                                const firstItem = order.items[0]
                                setReviewingItem({ 
                                  orderId: order.id, 
                                  orderItemId: firstItem.id,
                                  productId: firstItem.product_id 
                                })
                              }}
                            >
                              <Star className="mr-2 h-3.5 w-3.5" />
                              Write Review
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Review Form Section */}
                      {reviewingItem && reviewingItem.orderId === order.id && (
                        <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="bg-secondary/5 border border-border rounded-lg p-6 relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-2 h-8 w-8"
                              onClick={() => setReviewingItem(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <div className="mb-4">
                              <h4 className="font-serif font-bold text-lg flex items-center gap-2">
                                <Star className="w-5 h-5 fill-primary text-primary" />
                                Write Your Review
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Share your experience with this product
                              </p>
                            </div>
                            <ReviewForm
                              productId={reviewingItem.productId}
                              onSubmit={handleSubmitReview}
                              onCancel={() => setReviewingItem(null)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default Orders