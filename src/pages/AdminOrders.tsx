import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminOrders, getAdminOrderDetail, updateAdminOrder } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Eye, CheckCircle } from "lucide-react";

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
  total_amount: number;
  status: string;
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

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

  const handleViewDetails = async (order: Order) => {
    try {
      const res = await getAdminOrderDetail(access, order.id);
      setOrderDetail(res.data);
      setNewStatus(res.data.status);
      setShowDetailModal(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const handleUpdateStatus = async () => {
    if (!orderDetail || !newStatus) return;
    setUpdating(true);
    try {
      await updateAdminOrder(access, orderDetail.id, newStatus);
      toast({ title: "Success", description: "Order status updated" });
      setShowDetailModal(false);
      setOrderDetail(null);
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
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "dispatched":
        return "bg-blue-100 text-blue-800";
      case "packed":
        return "bg-purple-100 text-purple-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Orders</h2>
          <div className="flex gap-2 flex-wrap">
            {["all", "placed", "confirmed", "packed", "dispatched", "delivered", "cancelled"].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? "default" : "outline"}
                onClick={() => setStatus(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Items</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">#{order.id}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{order.customer}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">{formatCurrency(order.total_amount)}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{order.items_count} items</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-sm">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(order)} className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{orderDetail?.id}</DialogTitle>
          </DialogHeader>
          {orderDetail && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium text-gray-900">{orderDetail.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{orderDetail.email}</p>
                </div>
              </div>

              {/* Address */}
              {orderDetail.address && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Shipping Address</p>
                  <p className="text-sm text-gray-600">
                    {orderDetail.address.street}<br />
                    {orderDetail.address.city}, {orderDetail.address.state} {orderDetail.address.zip}
                  </p>
                </div>
              )}

              {/* Order Items */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-900 mb-3">Order Items</p>
                <div className="space-y-2">
                  {orderDetail.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${item.price.toFixed(2)} each</p>
                        <p className="text-gray-600">Total: ${item.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium text-gray-900 mb-2 block">Update Status</Label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="placed">Placed</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="packed">Packed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Total Amount */}
              <div className="border-t pt-4 bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">${orderDetail.total_amount.toFixed(2)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
            <Button onClick={handleUpdateStatus} disabled={updating} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {updating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
