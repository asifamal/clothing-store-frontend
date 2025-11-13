import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAdminDashboardStats,
  getAdminOrders,
  getAdminProducts,
  getAdminSalesChart,
  getAdminAllCategories,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, Package, ShoppingCart, Eye, TrendingUp, DollarSign } from "lucide-react";

type StatCard = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: "positive" | "negative";
};

type OrderItem = {
  id: number;
  customer: string;
  total_amount: number;
  status: string;
  created_at: string;
  items_count: number;
};

type ProductItem = {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  created_at: string;
};

type Category = {
  id: number;
  name: string;
};

const AdminAnalytics = () => {
  const { tokens } = useAuth();
  const access = tokens?.access || "";
  const { toast } = useToast();

  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState("all");
  const [productCategory, setProductCategory] = useState("all");
  const [productSearch, setProductSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes, chartRes, categoriesRes] = await Promise.all([
        getAdminDashboardStats(access),
        getAdminOrders(access, orderStatus === "all" ? undefined : orderStatus),
        getAdminProducts(access, productCategory === "all" ? undefined : productCategory, productSearch),
        getAdminSalesChart(access),
        getAdminAllCategories(access),
      ]);

      setStats(statsRes.data);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
      setChartData(chartRes.data);
      setCategories(categoriesRes.data || []);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (access) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access, orderStatus, productCategory, productSearch]);

  const formatCurrency = (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

  const productDistribution = products.reduce(
    (acc: any, p) => {
      const existing = acc.find((a: any) => a.name === p.category);
      if (existing) existing.value += 1;
      else acc.push({ name: p.category, value: 1 });
      return acc;
    },
    []
  );

  const formatTrend = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTrendType = (value: number): "positive" | "negative" => value >= 0 ? "positive" : "negative";

  const statCards: StatCard[] = stats
    ? [
        {
          label: "Total Revenue",
          value: formatCurrency(stats.total_revenue),
          icon: <DollarSign className="w-6 h-6" />,
          change: formatTrend(stats.revenue_change),
          changeType: getTrendType(stats.revenue_change),
        },
        {
          label: "New Users",
          value: stats.new_users,
          icon: <Users className="w-6 h-6" />,
          change: formatTrend(stats.users_change),
          changeType: getTrendType(stats.users_change),
        },
        {
          label: "Page Views",
          value: stats.page_views.toLocaleString(),
          icon: <Eye className="w-6 h-6" />,
          change: "Derived",
        },
        {
          label: "Total Orders",
          value: stats.total_orders,
          icon: <ShoppingCart className="w-6 h-6" />,
          change: formatTrend(stats.orders_change),
          changeType: getTrendType(stats.orders_change),
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your store analytics.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  {stat.change && (
                    <p
                      className={`text-sm mt-2 ${
                        stat.changeType === "positive" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.change}
                    </p>
                  )}
                </div>
                <div className="text-blue-600 bg-blue-50 p-3 rounded-lg">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Over Time</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="Sales" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 h-[300px] flex items-center">No data available</p>
            )}
          </div>

          {/* Product Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Distribution</h3>
            {productDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} (${value})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 h-[300px] flex items-center">No data available</p>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <div className="mt-4 flex gap-2 flex-wrap">
              {["all", "placed", "confirmed", "dispatched", "delivered", "cancelled"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={orderStatus === status ? "default" : "outline"}
                  onClick={() => setOrderStatus(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Items</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">#{order.id}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{order.customer}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{formatCurrency(order.total_amount)}</td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : order.status === "dispatched"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">{order.items_count}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-3 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Products</h3>
            <div className="mt-4 flex gap-2 flex-col md:flex-row">
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Added</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{product.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{product.category}</td>
                      <td className="px-6 py-3 text-sm text-gray-900">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            product.stock > 10
                              ? "bg-green-100 text-green-800"
                              : product.stock > 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{new Date(product.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-3 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
