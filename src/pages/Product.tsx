import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingBag, Heart, ChevronLeft, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPublicProductDetail } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

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
  
  const selectedVariant = product?.variants?.find(v => v.size === selectedSize);
  const availableStock = selectedVariant?.stock || 0;
  const hasVariants = product?.variants && product.variants.length > 0;
  
  const totalVariantStock = hasVariants 
    ? product?.variants.reduce((sum, v) => sum + v.stock, 0) || 0
    : 0;
  
  const isCompletelyOutOfStock = hasVariants 
    ? (product?.stock || 0) === 0 || totalVariantStock === 0
    : (product?.stock || 0) === 0;
  
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
        <main className="flex-1 container mx-auto px-6 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-32 bg-secondary/50 rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-[3/4] bg-secondary/50 rounded" />
              <div className="space-y-4">
                <div className="h-12 w-3/4 bg-secondary/50 rounded" />
                <div className="h-8 w-1/4 bg-secondary/50 rounded" />
              </div>
            </div>
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
        <main className="flex-1 container mx-auto px-6 py-12 text-center">
          <p className="text-destructive mb-4">{error || "Product not found"}</p>
          <Link to="/products">
            <Button variant="outline">Back to Products</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-6 pt-24 pb-12 lg:pt-32 lg:pb-16">
        <Link to="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to shopping
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Image Section - Sticky on Desktop */}
          <div className="lg:col-span-7">
            <div className="sticky top-24">
              <div className="aspect-[3/4] overflow-hidden rounded-sm bg-secondary/20">
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-widest mb-2">
                {product.category?.name || "Uncategorized"}
              </p>
              <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-tight leading-tight">{product.name}</h1>
              <p className="text-2xl font-medium">₹{product.price}</p>
            </div>

            <Separator />

            {/* Size Selection */}
            {hasVariants && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium uppercase tracking-wide">Select Size</Label>
                  <span className="text-xs text-muted-foreground underline cursor-pointer">Size Guide</span>
                </div>
                <RadioGroup value={selectedSize} onValueChange={setSelectedSize} className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => {
                    const isOutOfStock = variant.stock === 0;
                    return (
                      <div key={variant.size}>
                        <RadioGroupItem 
                          value={variant.size} 
                          id={variant.size} 
                          className="peer sr-only"
                          disabled={isOutOfStock}
                        />
                        <Label
                          htmlFor={variant.size}
                          className={`flex items-center justify-center w-14 h-14 border rounded-sm cursor-pointer transition-all 
                            ${isOutOfStock 
                              ? "opacity-50 cursor-not-allowed bg-secondary/50 border-transparent" 
                              : "border-border hover:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary"
                            }`}
                        >
                          {variant.size}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
                {selectedSize && !isSelectedSizeOutOfStock && (
                  <p className="text-xs text-green-600">
                    {availableStock < 5 ? `Only ${availableStock} left!` : "In Stock"}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4 pt-4">
              <Button 
                className="w-full h-14 text-base uppercase tracking-wide" 
                size="lg"
                disabled={isCompletelyOutOfStock || isSelectedSizeOutOfStock || (hasVariants && !selectedSize) || cartLoading}
                onClick={handleAddToCart}
              >
                {cartLoading ? "Adding..." : (
                  isCompletelyOutOfStock ? "Out of Stock" : (
                    isSelectedSizeOutOfStock ? "Out of Stock" : (
                      hasVariants ? (
                        !selectedSize ? "Select Size" : "Add to Cart"
                      ) : "Add to Cart"
                    )
                  )
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Free shipping on orders over ₹2000. Returns within 30 days.
              </p>
            </div>

            {/* Details Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="description">
                <AccordionTrigger className="text-sm uppercase tracking-wide">Description</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {product.description}
                </AccordionContent>
              </AccordionItem>
              
              {product.attributes && product.attributes.length > 0 && (
                <AccordionItem value="details">
                  <AccordionTrigger className="text-sm uppercase tracking-wide">Product Details</AccordionTrigger>
                  <AccordionContent>
                    <dl className="space-y-2 text-sm">
                      {product.attributes.map((attr, index) => (
                        <div key={index} className="flex justify-between">
                          <dt className="text-muted-foreground">{attr.name}</dt>
                          <dd className="font-medium">{attr.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="shipping">
                <AccordionTrigger className="text-sm uppercase tracking-wide">Shipping & Returns</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <Truck className="h-5 w-5 shrink-0" />
                      <p>Free standard shipping on all orders over ₹2000. Estimated delivery within 3-5 business days.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <RefreshCw className="h-5 w-5 shrink-0" />
                      <p>Free returns within 30 days of purchase. Items must be in original condition.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 shrink-0" />
                      <p>2-year warranty against manufacturing defects.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Product;
