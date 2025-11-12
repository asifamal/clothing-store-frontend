import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-serif font-bold tracking-tight">
              Welcome to Admin Dashboard
            </h1>
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
          <p className="text-lg text-muted-foreground">
            Hello, {user?.username}! You are logged in as an administrator.
          </p>
          <div className="mt-12 p-8 border rounded-lg bg-muted/50">
            <p className="text-muted-foreground">
              Admin dashboard features coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
