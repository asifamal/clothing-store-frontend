import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, ExternalLink, BarChart3, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminDashboard = () => {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not an admin
  // Wait for auth to finish loading before checking
  useEffect(() => {
    if (loading) return; // Wait for auth state to restore from storage

    if (!isAuthenticated || user?.role !== "manager") {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Show loading state while auth is being restored
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Hello, <span className="font-semibold">{user?.username}</span>! You are logged in as an administrator.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/?asadmin=1')}
              className="flex items-center gap-2"
              title="Open site as admin"
            >
              <ExternalLink className="h-4 w-4" />
              View Website
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Analytics Section */}
          <div
            onClick={() => navigate('/admin-dashboard/analytics')}
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
          >
            <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <BarChart3 className="w-16 h-16 text-white opacity-80" />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900">Analytics & Reports</h2>
              <p className="text-gray-600 mt-2">
                View sales trends, product distribution, and manage orders and inventory.
              </p>
              <div className="mt-4">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Open Analytics
                </Button>
              </div>
            </div>
          </div>

          {/* User Management Section */}
          <div
            onClick={() => navigate('/admin-dashboard/users')}
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
          >
            <div className="h-32 bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <Users className="w-16 h-16 text-white opacity-80" />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <p className="text-gray-600 mt-2">
                Add, edit, and remove users. Manage customer and manager roles.
              </p>
              <div className="mt-4">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Manage Users
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50">
              <h4 className="font-medium text-gray-900">Total Users</h4>
              <p className="text-2xl font-bold text-gray-600 mt-2">—</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50">
              <h4 className="font-medium text-gray-900">Total Products</h4>
              <p className="text-2xl font-bold text-gray-600 mt-2">—</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50">
              <h4 className="font-medium text-gray-900">Total Orders</h4>
              <p className="text-2xl font-bold text-gray-600 mt-2">—</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
