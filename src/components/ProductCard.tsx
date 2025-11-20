import { Button } from "@/components/ui/button";
import { ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { getProductReviewStats } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  name: string;
  price: string;
  image: string;
  category: string;
  id?: string;
  stock?: number;
}

const ProductCard = ({ name, price, image, category, id = "1", stock = 0 }: ProductCardProps) => {
  const { addToCart, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviewStats, setReviewStats] = useState<{ average_rating: number; total_reviews: number } | null>(null);
  const isOutOfStock = stock === 0;

  useEffect(() => {
    const fetchReviewStats = async () => {
      try {
        const response = await getProductReviewStats(parseInt(id));
        setReviewStats({
          average_rating: response.data.average_rating,
          total_reviews: response.data.total_reviews,
        });
      } catch (error) {
        // Silently fail
      }
    };

    fetchReviewStats();
  }, [id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to add items to your cart",
        variant: "destructive"
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      return;
    }

    setAddingToCart(true);
    const success = await addToCart(parseInt(id));
    
    if (success) {
      toast({
        title: "Added to cart",
        description: `${name} has been added to your cart`
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive"
      });
    }
    setAddingToCart(false);
  };

  return (
    <Link to={`/product/${id}`} className="group cursor-pointer block">
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary/20 mb-4">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        
        {/* Tags/Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isOutOfStock && (
            <span className="bg-white/90 backdrop-blur text-black text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
              Sold Out
            </span>
          )}
          {!isOutOfStock && reviewStats && reviewStats.average_rating >= 4.5 && (
            <span className="bg-white/90 backdrop-blur text-black text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
              Best Seller
            </span>
          )}
        </div>

        {/* Quick Add Button */}
        {!isOutOfStock && (
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Button 
              className="w-full bg-white text-black hover:bg-white/90 shadow-lg"
              onClick={handleAddToCart}
              disabled={loading || addingToCart}
            >
              {addingToCart ? "Adding..." : "Quick Add"}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-start">
          <h3 className="font-serif text-lg text-foreground group-hover:underline decoration-1 underline-offset-4 transition-all">
            {name}
          </h3>
          <span className="font-medium text-foreground">₹{price}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{category}</p>
          {reviewStats && reviewStats.total_reviews > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-black text-black" />
              <span className="text-xs font-medium">{reviewStats.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
