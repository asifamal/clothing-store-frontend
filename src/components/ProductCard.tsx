import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import StarRating from "./StarRating";
import { getProductReviewStats } from "@/lib/api";

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
        // Silently fail - reviews are optional
      }
    };

    fetchReviewStats();
  }, [id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product page
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to add items to your cart",
        variant: "destructive"
      });
      // Redirect to login page after a short delay
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
      <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-sm bg-muted mb-4">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
        {isOutOfStock ? (
          <div className="absolute bottom-4 right-4 bg-destructive text-destructive-foreground px-3 py-2 rounded-sm text-sm font-medium">
            Out of Stock
          </div>
        ) : (
          <Button 
            size="icon"
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={handleAddToCart}
            disabled={loading || addingToCart}
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{category}</p>
        <h3 className="font-medium text-foreground">{name}</h3>
        <p className="text-sm text-foreground font-medium">₹{price}</p>
        {reviewStats && reviewStats.total_reviews > 0 && (
          <div className="flex items-center gap-1 pt-1">
            <StarRating rating={reviewStats.average_rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              ({reviewStats.total_reviews})
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
