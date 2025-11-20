import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import Footer from "@/components/Footer";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(location.search);
    const asadmin = params.get("asadmin");

    if (user?.role === "manager" && asadmin !== "1") {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [user, loading, navigate, location.search]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-black selection:text-white">
      <Header />
      <main>
        <Hero />
        
        {/* Categories Section */}
        <section className="py-20 border-b border-border/40">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "New Arrivals", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80", link: "/products?category=new" },
                { title: "Best Sellers", image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80", link: "/products?sort=popular" },
                { title: "Accessories", image: "https://images.unsplash.com/photo-1521223890158-5d669a0ee79c?w=800&q=80", link: "/products?category=accessories" }
              ].map((category, index) => (
                <Link to={category.link} key={index} className="group relative h-[400px] overflow-hidden block">
                  <img 
                    src={category.image} 
                    alt={category.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute bottom-8 left-8 text-white">
                    <h3 className="text-2xl font-serif font-bold mb-2">{category.title}</h3>
                    <div className="flex items-center text-sm font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <FeaturedProducts />

        {/* Philosophy Section */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">The Philosophy</h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed mb-8">
              We believe that style should be effortless. Our collections are designed to be versatile, 
              timeless, and durable, ensuring that you look your best in every situation. 
              Quality is not just a promise; it's our standard.
            </p>
            <Link to="/about">
              <span className="inline-flex items-center text-primary font-medium border-b border-primary pb-1 hover:opacity-70 transition-opacity">
                Read Our Story <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
