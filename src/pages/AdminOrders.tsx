import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminOrders, getAdminOrderDetail, updateAdminOrder, getCourierPartners } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Eye, CheckCircle, Package, TruckIcon, XCircle, Clock, RefreshCw, Search, Filter, User, MapPin, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Order = {
  id: number;
  customer: string;
  total_amount: number;
  status: string;
  created_at: string;
  items_count: number;
};

type OrderDetail = {
  id: number;
  customer: string;
  email: string;
  contact_phone: string;
  total_amount: number;
  status: string;
  awb_number: string;
  courier_partner: string;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
};

const AdminOrders = () => {
  const { tokens } = useAuth();
  const access = tokens?.access || "";
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  
  // Dispatch fields
  const [awbNumber, setAwbNumber] = useState("");
  const [courierPartner, setCourierPartner] = useState("");
  const [courierPartners, setCourierPartners] = useState<Array<{id: number, name: string}>>([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders(access, status === "all" ? undefined : status);
      setOrders(res.data);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (access) fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access, status]);

  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const response = await getCourierPartners();
        if (response.status === 'success') {
          setCourierPartners(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch courier partners:', error);
      }
    };
    fetchCouriers();
  }, []);

  const handleViewDetails = async (order: Order) => {
    try {
      const res = await getAdminOrderDetail(access, order.id);
      setOrderDetail(res.data);
      setNewStatus(res.data.status);
      // Prefill AWB and courier partner if they exist
      setAwbNumber(res.data.awb_number || '');
      setCourierPartner(res.data.courier_partner || '');
      setShowDetailModal(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const handleUpdateStatus = async () => {
    if (!orderDetail || !newStatus) return;
    
    // If changing to dispatched, validate AWB and courier
    if (newStatus === 'dispatched' && orderDetail.status !== 'dispatched') {
      if (!awbNumber.trim() || !courierPartner.trim()) {
        toast({ variant: "destructive", title: "Error", description: "Please provide AWB number and courier partner for dispatch" });
        return;
      }
    }
    
    setUpdating(true);
    try {
      if (newStatus === 'dispatched' && orderDetail.status !== 'dispatched') {
        await updateAdminOrder(access, orderDetail.id, newStatus, awbNumber, courierPartner);
        toast({ title: "Success", description: "Order marked as dispatched and notification sent" });
      } else {
        await updateAdminOrder(access, orderDetail.id, newStatus);
        toast({ title: "Success", description: "Order status updated" });
      }
      setShowDetailModal(false);
      setOrderDetail(null);
      setAwbNumber("");
      setCourierPartner("");
      fetchOrders();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "dispatched":
        return "bg-indigo-100 text-indigo-700";
      case "delivered":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "confirmed":
        return <CheckCircle className="w-3 h-3" />;
      case "dispatched":
        return <TruckIcon className="w-3 h-3" />;
      case "delivered":
        return <Package className="w-3 h-3" />;
      case "cancelled":
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => 
    order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toString().includes(searchTerm)
  );

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    dispatched: orders.filter(o => o.status === 'dispatched').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Orders Management</h2>
          <p className="text-slate-500 mt-1">Track and manage customer orders</p>
        </div>
        <Button
          onClick={fetchOrders}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-slate-600 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-amber-700 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-blue-700 mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-blue-900">{stats.confirmed}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-indigo-700 mb-1">Dispatched</p>
            <p className="text-2xl font-bold text-indigo-900">{stats.dispatched}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-green-700 mb-1">Delivered</p>
            <p className="text-2xl font-bold text-green-900">{stats.delivered}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by customer name or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-slate-600" />
              {["all", "pending", "confirmed", "dispatched", "delivered", "cancelled"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={status === s ? "default" : "outline"}
                  onClick={() => setStatus(s)}
                  className={status === s ? "bg-gradient-to-r from-indigo-600 to-purple-600" : ""}
                >
                  {s === "pending" ? "Pending" : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">{loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-indigo-600 animate-spin" />
            <p className="text-slate-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No orders found</p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">#{order.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-900">{order.customer}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatCurrency(order.total_amount)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{order.items_count} items</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewDetails(order)}
                          className="hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-200">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Order #{order.id}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600">{order.customer}</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(order.total_amount)}</p>
                    <p className="text-xs text-slate-500">{order.items_count} items • {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewDetails(order)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Package className="w-6 h-6 text-indigo-600" />
              Order Details #{orderDetail?.id}
            </DialogTitle>
          </DialogHeader>
          {orderDetail && (
            <div className="space-y-6 py-4">
              {/* Order Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-purple-50">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-indigo-700 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-indigo-900">${orderDetail.total_amount.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-blue-700 mb-1">Status</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold items-center gap-1 ${getStatusColor(orderDetail.status)}`}>
                      {getStatusIcon(orderDetail.status)}
                      {orderDetail.status.charAt(0).toUpperCase() + orderDetail.status.slice(1)}
                    </span>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-slate-100">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-slate-700 mb-1">Items</p>
                    <p className="text-2xl font-bold text-slate-900">{orderDetail.items.length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Info */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Name</p>
                    <p className="text-sm font-semibold text-slate-900">{orderDetail.customer}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">Email</p>
                    <p className="text-sm font-semibold text-slate-900">{orderDetail.email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium text-slate-600 mb-1">Contact Phone</p>
                    <p className="text-sm font-semibold text-slate-900">{orderDetail.contact_phone || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              {orderDetail.address && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {orderDetail.address.street}<br />
                      {orderDetail.address.city}, {orderDetail.address.state} {orderDetail.address.zip}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Order Items */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    Order Items ({orderDetail.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-200">
                    {orderDetail.items.map((item) => (
                      <div key={item.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                          <Package className="w-8 h-8 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 mb-1">{item.product_name}</p>
                          <p className="text-xs text-slate-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-slate-900">${item.price.toFixed(2)} each</p>
                          <p className="text-xs text-slate-600">Total: ${item.total.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Status Update */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-indigo-600" />
                    Update Order Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">
                      Select Status
                    </Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="border-slate-300 focus:ring-2 focus:ring-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending Confirmation</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="dispatched">Dispatched</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Show dispatch fields when dispatched is selected */}
                  {newStatus === 'dispatched' && (
                    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TruckIcon className="w-4 h-4 text-indigo-600" />
                          <p className="text-sm font-semibold text-indigo-900">Dispatch Information Required</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-1 block">
                            Courier Partner *
                          </Label>
                          <Select value={courierPartner} onValueChange={setCourierPartner}>
                            <SelectTrigger className="border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500">
                              <SelectValue placeholder="Select Courier Partner" />
                            </SelectTrigger>
                            <SelectContent>
                              {courierPartners.map((partner) => (
                                <SelectItem key={partner.id} value={partner.name}>
                                  {partner.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-slate-700 mb-1 block">
                            AWB / Tracking Number *
                          </Label>
                          <Input
                            value={awbNumber}
                            onChange={(e) => setAwbNumber(e.target.value)}
                            placeholder="Enter tracking number"
                            className="border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
            <Button 
              onClick={handleUpdateStatus} 
              disabled={updating}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {updating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
