import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import Footer from "@/components/Footer";
import { ArrowRight, Loader2 } from "lucide-react";
import { getPublicCategories } from "@/lib/api";

const getImageUrl = (imagePath: string | null): string => {
  if (!imagePath) return "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80"; // Fallback
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  return `${baseUrl.replace("/api", "")}${imagePath}`;
};

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(location.search);
    const asadmin = params.get("asadmin");

    if (user?.role === "manager" && asadmin !== "1") {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [user, loading, navigate, location.search]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getPublicCategories();
        setCategories(response.data.categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!categoriesLoading && location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [categoriesLoading, location.hash]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-black">
      <Header />
      <main>
        <div id="home">
          <Hero />
        </div>
        
        {/* Categories Section */}
        <section id="shop" className="py-20 border-b border-border/40">
          <div className="container mx-auto px-6">
            {categoriesLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {categories.map((category) => (
                  <Link 
                    to={`/products?category_id=${category.id}`} 
                    key={category.id} 
                    className="group relative h-[400px] overflow-hidden block border border-border/50 rounded-sm"
                  >
                    <img 
                      src={getImageUrl(category.image)} 
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-8 left-8 text-white">
                      <h3 className="text-2xl font-bold mb-2 tracking-tight">{category.name}</h3>
                      <div className="flex items-center text-sm font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 text-primary">
                        Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <div id="new-arrivals">
          <FeaturedProducts />
        </div>


      </main>
      <Footer />
    </div>
  );
};

export default Index;
