import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { getFeaturedProducts } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

type Product = {
  id: number;
  name: string;
  price: string;
  category: { id: number; name: string };
  image: string | null;
  stock: number;
};

const getImageUrl = (imagePath: string | null): string => {
  if (!imagePath) return "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80";
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  return `${baseUrl.replace("/api", "")}${imagePath}`;
};

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getFeaturedProducts(8);
        setProducts(response.data.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Latest Drops</h2>
            <p className="text-muted-foreground max-w-md">
              Explore our newest arrivals, crafted with precision and designed for the modern wardrobe.
            </p>
          </div>
          <Link to="/products">
            <Button variant="link" className="group text-lg font-medium p-0 h-auto">
              View All Products
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-secondary/30 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id.toString()}
                name={product.name}
                price={product.price}
                category={product.category.name}
                image={getImageUrl(product.image)}
                stock={product.stock}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No products available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
