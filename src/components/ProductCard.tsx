import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  name: string;
  price: string;
  image: string;
  category: string;
  id?: string;
}

const ProductCard = ({ name, price, image, category, id = "1" }: ProductCardProps) => {
  return (
    <Link to={`/product/${id}`} className="group cursor-pointer block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-muted mb-4">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
        <Button 
          size="icon"
          className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <ShoppingBag className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{category}</p>
        <h3 className="font-medium text-foreground">{name}</h3>
        <p className="text-sm text-foreground font-medium">${price}</p>
      </div>
    </Link>
  );
};

export default ProductCard;
