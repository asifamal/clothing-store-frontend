import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { getPublicProducts, getPublicCategories, getPublicCategoryAttributes } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Filter, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Product = {
  id: number;
  name: string;
  price: string;
  category: { id: number; name: string };
  image: string | null;
  stock: number;
  attributes?: { id: number; name: string; value: string; field_type: string; }[];
};

type Category = {
  id: number;
  name: string;
};

type CategoryAttribute = {
  id: number;
  name: string;
  field_type: 'text' | 'number' | 'select';
  is_required: boolean;
  options: { id: number; value: string; }[];
};

const getImageUrl = (imagePath: string | null): string => {
  if (!imagePath) return "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80";
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  return `${baseUrl.replace("/api", "")}${imagePath}`;
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  const [attributeFilters, setAttributeFilters] = useState<Record<number, string>>({});
  const [numberRangeFilters, setNumberRangeFilters] = useState<Record<number, { min: string; max: string }>>({});
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getPublicCategories();
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchCategoryAttributes = async () => {
      if (!selectedCategory) {
        setCategoryAttributes([]);
        setAttributeFilters({});
        setNumberRangeFilters({});
        return;
      }

      try {
        const response = await getPublicCategoryAttributes(selectedCategory);
        setCategoryAttributes(response.data.attributes || []);
        setAttributeFilters({});
        setNumberRangeFilters({});
        setPriceRange({ min: '', max: '' });
      } catch (error) {
        console.error("Failed to fetch category attributes:", error);
        setCategoryAttributes([]);
      }
    };
    fetchCategoryAttributes();
  }, [selectedCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const allFilters = { ...attributeFilters };
        
        Object.keys(allFilters).forEach(attrId => {
          if (!allFilters[parseInt(attrId)]?.trim()) {
            delete allFilters[parseInt(attrId)];
          }
        });
        
        Object.entries(numberRangeFilters).forEach(([attrId, range]) => {
          if (range.min || range.max) {
            const rangeValue = `${range.min || '0'}-${range.max || '999999'}`;
            allFilters[parseInt(attrId)] = rangeValue;
          }
        });
        
        const response = await getPublicProducts(
          page,
          12,
          selectedCategory,
          searchQuery,
          allFilters,
          priceRange.min,
          priceRange.max
        );
        setProducts(response.data.products || []);
        setTotalPages(response.data.pagination.total_pages);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, selectedCategory, searchQuery, attributeFilters, numberRangeFilters, priceRange]);

  const handleCategoryChange = (categoryId: number | undefined) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const handleAttributeFilterChange = useCallback((attributeId: number, value: string) => {
    setAttributeFilters(prev => {
      if (value.trim() === '') {
        const newFilters = { ...prev };
        delete newFilters[attributeId];
        return newFilters;
      } else {
        return { ...prev, [attributeId]: value };
      }
    });
    setPage(1);
  }, []);

  const handleNumberRangeChange = (attributeId: number, type: 'min' | 'max', value: string) => {
    setNumberRangeFilters(prev => ({
      ...prev,
      [attributeId]: { ...prev[attributeId], [type]: value }
    }));
    setPage(1);
  };

  const handlePriceRangeChange = (type: 'min' | 'max', value: string) => {
    setPriceRange(prev => ({ ...prev, [type]: value }));
    setPage(1);
  };

  const clearAllFilters = () => {
    setAttributeFilters({});
    setNumberRangeFilters({});
    setPriceRange({ min: '', max: '' });
    setPage(1);
  };

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="font-serif text-lg font-bold mb-4">Categories</h3>
        <div className="space-y-2">
          <Button
            variant={selectedCategory === undefined ? "secondary" : "ghost"}
            className="w-full justify-start font-normal"
            onClick={() => handleCategoryChange(undefined)}
          >
            All Categories
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "secondary" : "ghost"}
              className="w-full justify-start font-normal"
              onClick={() => handleCategoryChange(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Filter */}
      <div>
        <h3 className="font-serif text-lg font-bold mb-4">Price Range</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Min</Label>
            <Input
              type="number"
              placeholder="0"
              value={priceRange.min}
              onChange={(e) => handlePriceRangeChange('min', e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Max</Label>
            <Input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => handlePriceRangeChange('max', e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Attributes */}
      {selectedCategory && categoryAttributes.length > 0 && (
        <>
          <Separator />
          <div className="space-y-6">
            {categoryAttributes.map((attribute) => (
              <div key={attribute.id}>
                <h3 className="font-medium text-sm mb-3">{attribute.name}</h3>
                {attribute.field_type === 'select' ? (
                  <Select
                    value={attributeFilters[attribute.id] || "ALL"}
                    onValueChange={(value) => 
                      value === "ALL" 
                        ? handleAttributeFilterChange(attribute.id, "") 
                        : handleAttributeFilterChange(attribute.id, value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={`Any ${attribute.name}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Any {attribute.name}</SelectItem>
                      {attribute.options.map((option) => (
                        <SelectItem key={option.id} value={option.value}>
                          {option.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : attribute.field_type === 'number' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={numberRangeFilters[attribute.id]?.min || ""}
                      onChange={(e) => handleNumberRangeChange(attribute.id, 'min', e.target.value)}
                      className="h-9"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={numberRangeFilters[attribute.id]?.max || ""}
                      onChange={(e) => handleNumberRangeChange(attribute.id, 'max', e.target.value)}
                      className="h-9"
                    />
                  </div>
                ) : (
                  <Input
                    type="text"
                    value={attributeFilters[attribute.id] || ""}
                    onChange={(e) => handleAttributeFilterChange(attribute.id, e.target.value)}
                    placeholder={`Search ${attribute.name}...`}
                    className="h-9"
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {(Object.keys(attributeFilters).length > 0 || Object.keys(numberRangeFilters).length > 0 || priceRange.min || priceRange.max) && (
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={clearAllFilters}
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-6 pt-24 pb-12 lg:pt-32 lg:pb-16">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-serif font-bold mb-2">
                {searchQuery ? `Search: ${searchQuery}` : selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : "All Products"}
              </h1>
              <p className="text-muted-foreground">
                Showing {products.length} results
              </p>
            </div>
            
            <div className="flex items-center gap-2">
               {/* Mobile Filter Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="mr-2 h-4 w-4" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="font-serif text-2xl">Filters</SheetTitle>
                    <SheetDescription>Refine your search</SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-8rem)] mt-6 pr-4">
                    <FilterContent />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <FilterContent />
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-[3/4] bg-secondary/30 animate-pulse rounded-sm" />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 mb-12">
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center px-4 font-medium">
                        Page {page} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 border border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground text-lg">No products found.</p>
                  <Button 
                    variant="link" 
                    onClick={clearAllFilters}
                    className="mt-2"
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
