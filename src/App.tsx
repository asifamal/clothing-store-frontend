import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import AdminLayout from "@/components/AdminLayout";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Product from "./pages/Product";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Debug from "./pages/Debug";
import Checkout from "./pages/Checkout";
import VerifyOTP from "./pages/VerifyOTP";
import OrderSuccess from "./pages/OrderSuccess";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminCategories from "./pages/AdminCategories";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminReviews from "./pages/AdminReviews";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<Product />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/debug" element={<Debug />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/order-success/:orderId" element={<OrderSuccess />} />
            <Route path="/admin-dashboard" element={<AdminLayout><AdminAnalytics /></AdminLayout>} />
              <Route path="/admin-dashboard/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
              <Route path="/admin-dashboard/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />
              <Route path="/admin-dashboard/categories" element={<AdminLayout><AdminCategories /></AdminLayout>} />
              <Route path="/admin-dashboard/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
              <Route path="/admin-dashboard/reviews" element={<AdminLayout><AdminReviews /></AdminLayout>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
