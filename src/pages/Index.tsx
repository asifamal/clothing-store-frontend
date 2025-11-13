import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import Footer from "@/components/Footer";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect managers to admin dashboard
  useEffect(() => {
    if (loading) return; // Wait for auth to load

    // allow admins to view site when ?asadmin=1 is present
    const params = new URLSearchParams(location.search);
    const asadmin = params.get("asadmin");

    if (user?.role === "manager" && asadmin !== "1") {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [user, loading, navigate, location.search]);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
