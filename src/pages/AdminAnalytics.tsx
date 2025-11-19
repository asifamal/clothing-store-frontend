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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Users, Package, ShoppingCart, Eye, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

type StatCard = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: "positive" | "negative";
  color: string;
  bgColor: string;
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

  const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

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
          icon: <DollarSign className="w-7 h-7" />,
          change: formatTrend(stats.revenue_change),
          changeType: getTrendType(stats.revenue_change),
          color: "text-indigo-600",
          bgColor: "bg-gradient-to-br from-indigo-500 to-purple-600",
        },
        {
          label: "New Users",
          value: stats.new_users,
          icon: <Users className="w-7 h-7" />,
          change: formatTrend(stats.users_change),
          changeType: getTrendType(stats.users_change),
          color: "text-purple-600",
          bgColor: "bg-gradient-to-br from-purple-500 to-pink-600",
        },
        {
          label: "Page Views",
          value: stats.page_views.toLocaleString(),
          icon: <Eye className="w-7 h-7" />,
          change: "Today",
          color: "text-pink-600",
          bgColor: "bg-gradient-to-br from-pink-500 to-rose-600",
        },
        {
          label: "Total Orders",
          value: stats.total_orders,
          icon: <ShoppingCart className="w-7 h-7" />,
          change: formatTrend(stats.orders_change),
          changeType: getTrendType(stats.orders_change),
          color: "text-emerald-600",
          bgColor: "bg-gradient-to-br from-emerald-500 to-teal-600",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Analytics Overview</h2>
          <p className="text-slate-500 mt-1">Track your business performance and insights</p>
        </div>
        <Button
          onClick={fetchData}
          disabled={loading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bgColor} opacity-10 rounded-full -mr-16 -mt-16`} />
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  {stat.change && (
                    <div className="flex items-center space-x-1">
                      {stat.changeType === "positive" ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : stat.changeType === "negative" ? (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      ) : null}
                      <span
                        className={`text-sm font-medium ${
                          stat.changeType === "positive"
                            ? "text-green-600"
                            : stat.changeType === "negative"
                            ? "text-red-600"
                            : "text-slate-500"
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  )}
                </div>
                <div className={`${stat.bgColor} p-3 rounded-xl shadow-lg text-white`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Sales Over Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fill="url(#colorSales)"
                    name="Sales" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No sales data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-purple-600" />
              <span>Product Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={productDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} (${value})`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No products data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <span>Recent Orders</span>
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              {["all", "pending", "confirmed", "dispatched", "delivered", "cancelled"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={orderStatus === status ? "default" : "outline"}
                  onClick={() => setOrderStatus(status)}
                  className={orderStatus === status ? "bg-gradient-to-r from-indigo-600 to-purple-600" : ""}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.length > 0 ? (
                  orders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">#{order.id}</td>
                      <td className="px-6 py-4 text-sm text-slate-900">{order.customer}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatCurrency(order.total_amount)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : order.status === "dispatched"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{order.items_count} items</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No orders found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-indigo-600" />
              <span>Products Inventory</span>
            </CardTitle>
            <div className="flex gap-2 flex-col md:flex-row">
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.length > 0 ? (
                  products.slice(0, 10).map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{product.category}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            product.stock > 10
                              ? "bg-green-100 text-green-700"
                              : product.stock > 0
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(product.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No products found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
