import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingBag, Heart, ChevronLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPublicProductDetail } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type ProductData = {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  category: { id: number; name: string } | null;
  image: string | null;
  variants: Array<{ id: number; size: string; stock: number }>;
  attributes: Array<{ name: string; value: string }>;
  created_at: string;
  updated_at: string;
};

const getImageUrl = (imagePath: string | null): string => {
  if (!imagePath) return "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80";
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  return `${baseUrl.replace("/api", "")}${imagePath}`;
};

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await getPublicProductDetail(parseInt(id));
        setProduct(response.data);
        // Auto-select first available size
        if (response.data.variants && response.data.variants.length > 0) {
          const firstAvailable = response.data.variants.find((v: { stock: number }) => v.stock > 0);
          if (firstAvailable) {
            setSelectedSize(firstAvailable.size);
          }
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const mainImage = getImageUrl(product?.image);
  
  // Get stock for selected size
  const selectedVariant = product?.variants?.find(v => v.size === selectedSize);
  const availableStock = selectedVariant?.stock || 0;
  const hasVariants = product?.variants && product.variants.length > 0;
  
  // Calculate total stock - check both main stock AND variant stock
  const totalVariantStock = hasVariants 
    ? product.variants.reduce((sum, v) => sum + v.stock, 0) 
    : 0;
  
  // Determine if product is completely out of stock
  // For products with variants: check main stock OR if all variants are out of stock
  // For products without variants: check main stock only
  const isCompletelyOutOfStock = hasVariants 
    ? (product?.stock || 0) === 0 || totalVariantStock === 0
    : (product?.stock || 0) === 0;
  
  // Check if selected size is out of stock
  const isSelectedSizeOutOfStock = hasVariants && selectedSize && availableStock === 0;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add items to your cart.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!product) return;

    try {
      await addToCart(product.id, quantity, selectedSize || undefined);
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error || "Product not found"}</p>
            <Link to="/products">
              <Button>Back to Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Link to="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to shopping
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <div className="space-y-4">
            <div className="aspect-[3/4] overflow-hidden rounded-sm bg-muted">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                {product.category?.name || "Uncategorized"}
              </p>
              <h1 className="text-4xl font-serif font-bold mb-4">{product.name}</h1>
              <p className="text-3xl font-medium">₹{product.price}</p>
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Stock Status */}
            {isCompletelyOutOfStock ? (
              <div className="text-sm">
                <p className="text-red-600 font-semibold">Out of Stock</p>
              </div>
            ) : hasVariants ? (
              <div className="text-sm">
                {selectedSize && availableStock > 0 ? (
                  <p className="text-green-600">In Stock ({availableStock} available in size {selectedSize})</p>
                ) : selectedSize ? (
                  <p className="text-red-600">Size {selectedSize} is Out of Stock</p>
                ) : (
                  <p className="text-muted-foreground">Select a size to check availability</p>
                )}
              </div>
            ) : (
              <div className="text-sm">
                <p className="text-green-600">In Stock ({product.stock} available)</p>
              </div>
            )}

            {/* Size Selection */}
            {hasVariants && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Size</Label>
                <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex gap-3">
                  {product.variants.filter(variant => variant.stock > 0).map((variant) => (
                    <div key={variant.size}>
                      <RadioGroupItem 
                        value={variant.size} 
                        id={variant.size} 
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={variant.size}
                        className="flex items-center justify-center w-12 h-12 border border-border rounded-sm cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground hover:border-primary/50"
                      >
                        {variant.size}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quantity</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isCompletelyOutOfStock || isSelectedSizeOutOfStock || (hasVariants && !selectedSize)}
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const maxStock = hasVariants ? availableStock : product.stock;
                    setQuantity(Math.min(maxStock, quantity + 1));
                  }}
                  disabled={isCompletelyOutOfStock || isSelectedSizeOutOfStock || (hasVariants && !selectedSize)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button 
                className="flex-1 h-12" 
                size="lg"
                disabled={isCompletelyOutOfStock || isSelectedSizeOutOfStock || (hasVariants && !selectedSize) || cartLoading}
                onClick={handleAddToCart}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                {cartLoading ? "Adding..." : (
                  isCompletelyOutOfStock ? "Out of Stock" : (
                    isSelectedSizeOutOfStock ? "Out of Stock" : (
                      hasVariants ? (
                        !selectedSize ? "Select a Size" : "Add to Cart"
                      ) : "Add to Cart"
                    )
                  )
                )}
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Product Details */}
            <div className="border-t border-border pt-8 space-y-4">
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide mb-3">Product Details</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {product.category && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium text-foreground">Category</span>
                      <span>{product.category.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-foreground">Product ID</span>
                    <span>#{product.id}</span>
                  </div>
                  {product.attributes && product.attributes.length > 0 && product.attributes.map((attr, index) => (
                    <div key={index} className="flex justify-between py-2 border-b">
                      <span className="font-medium text-foreground">{attr.name}</span>
                      <span>{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Product;
