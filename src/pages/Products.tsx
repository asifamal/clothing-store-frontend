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
import { X } from "lucide-react";

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
  const [showFilters, setShowFilters] = useState(false);
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

  // Fetch category attributes when category changes
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
        setAttributeFilters({}); // Reset filters when category changes
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
        // Combine regular filters and number range filters
        const allFilters = { ...attributeFilters };
        
        // Only include non-empty text filters
        Object.keys(allFilters).forEach(attrId => {
          if (!allFilters[parseInt(attrId)]?.trim()) {
            delete allFilters[parseInt(attrId)];
          }
        });
        
        // Add number range filters
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
        return {
          ...prev,
          [attributeId]: value
        };
      }
    });
    setPage(1);
  }, []);

  const handleNumberRangeChange = (attributeId: number, type: 'min' | 'max', value: string) => {
    setNumberRangeFilters(prev => ({
      ...prev,
      [attributeId]: {
        ...prev[attributeId],
        [type]: value
      }
    }));
    setPage(1);
  };

  const handlePriceRangeChange = (type: 'min' | 'max', value: string) => {
    setPriceRange(prev => ({ ...prev, [type]: value }));
    setPage(1);
  };

  const clearAttributeFilter = (attributeId: number) => {
    setAttributeFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[attributeId];
      return newFilters;
    });
    setNumberRangeFilters(prev => {
      const newRanges = { ...prev };
      delete newRanges[attributeId];
      return newRanges;
    });
    setPage(1);
  };

  const clearAllFilters = () => {
    setAttributeFilters({});
    setNumberRangeFilters({});
    setPriceRange({ min: '', max: '' });
    setPage(1);
  };

  const hasActiveFilters = Object.keys(attributeFilters).length > 0 || Object.keys(numberRangeFilters).length > 0 || priceRange.min !== '' || priceRange.max !== '';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold mb-4">
              {searchQuery ? `Search Results for "${searchQuery}"` : "All Products"}
            </h1>
            <p className="text-muted-foreground">
              Discover our carefully curated collection
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8">
            {/* Category Filters */}
            <div className="flex gap-2 flex-wrap mb-4">
              <Button
                variant={selectedCategory === undefined ? "default" : "outline"}
                onClick={() => handleCategoryChange(undefined)}
                size="sm"
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => handleCategoryChange(category.id)}
                  size="sm"
                >
                  {category.name}
                </Button>
              ))}
              {selectedCategory && categoryAttributes.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="ml-2"
                >
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>
              )}
            </div>

            {/* Price Filter - Always Visible */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Filter by Price</h3>
                {(priceRange.min || priceRange.max) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPriceRange({ min: '', max: '' })}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Clear Price
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Min Price</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={priceRange.min}
                    onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                    className="text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Max Price</Label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={priceRange.max}
                    onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                    className="text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              {(priceRange.min || priceRange.max) && (
                <div className="mt-2 text-sm text-green-600 font-medium">
                  Showing products: ${priceRange.min || '0'} - ${priceRange.max || '∞'}
                </div>
              )}
            </div>

            {/* Attribute Filters */}
            {selectedCategory && showFilters && categoryAttributes.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Filter by Attributes</h3>
                  {(Object.keys(attributeFilters).length > 0 || Object.keys(numberRangeFilters).length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAttributeFilters({});
                        setNumberRangeFilters({});
                        setPage(1);
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Clear Attributes
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryAttributes.map((attribute) => (
                    <div key={attribute.id} className="space-y-2">
                      <Label htmlFor={`attr-${attribute.id}`} className="text-sm font-medium">
                        {attribute.name}
                        {attribute.is_required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      
                      {attribute.field_type === 'select' && attribute.options.length > 0 ? (
                        <Select
                          value={attributeFilters[attribute.id] || "ALL"}
                          onValueChange={(value) => 
                            value === "ALL" ? clearAttributeFilter(attribute.id) : handleAttributeFilterChange(attribute.id, value)
                          }
                        >
                          <SelectTrigger id={`attr-${attribute.id}`}>
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
                        // Number range inputs
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Input
                                type="number"
                                placeholder="Min"
                                value={numberRangeFilters[attribute.id]?.min || ""}
                                onChange={(e) => handleNumberRangeChange(attribute.id, 'min', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                placeholder="Max"
                                value={numberRangeFilters[attribute.id]?.max || ""}
                                onChange={(e) => handleNumberRangeChange(attribute.id, 'max', e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">Enter range (e.g., 10 to 50)</p>
                          {(numberRangeFilters[attribute.id]?.min || numberRangeFilters[attribute.id]?.max) && (
                            <button
                              onClick={() => clearAttributeFilter(attribute.id)}
                              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Clear range
                            </button>
                          )}
                        </div>
                      ) : (
                        // Text input
                        <div className="relative">
                          <Input
                            id={`attr-${attribute.id}`}
                            type="text"
                            value={attributeFilters[attribute.id] || ""}
                            onChange={(e) => handleAttributeFilterChange(attribute.id, e.target.value)}
                            placeholder={`Search ${attribute.name.toLowerCase()}...`}
                            className="pr-8"
                          />
                          {attributeFilters[attribute.id] && (
                            <button
                              onClick={() => clearAttributeFilter(attribute.id)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Type to search (e.g., "Cotton", "Nike")</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Active Filters Display */}
                {hasActiveFilters && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-gray-600">Active filters:</span>
                      
                      {/* Price Range Filter */}
                      {(priceRange.min || priceRange.max) && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Price: ${priceRange.min || '0'} - ${priceRange.max || '∞'}
                          <button
                            onClick={() => setPriceRange({ min: '', max: '' })}
                            className="ml-1 hover:text-green-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      
                      {/* Regular attribute filters */}
                      {Object.entries(attributeFilters).map(([attrId, value]) => {
                        const attribute = categoryAttributes.find(attr => attr.id.toString() === attrId);
                        return (
                          <span
                            key={`attr-${attrId}`}
                            className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {attribute?.name}: {value}
                            <button
                              onClick={() => clearAttributeFilter(parseInt(attrId))}
                              className="ml-1 hover:text-blue-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                      
                      {/* Number range filters */}
                      {Object.entries(numberRangeFilters).map(([attrId, range]) => {
                        if (!range.min && !range.max) return null;
                        const attribute = categoryAttributes.find(attr => attr.id.toString() === attrId);
                        const rangeText = `${range.min || '0'} - ${range.max || '∞'}`;
                        return (
                          <span
                            key={`range-${attrId}`}
                            className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                          >
                            {attribute?.name}: {rangeText}
                            <button
                              onClick={() => clearAttributeFilter(parseInt(attrId))}
                              className="ml-1 hover:text-green-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id.toString()}
                    name={product.name}
                    price={product.price}
                    category={product.category.name}
                    image={getImageUrl(product.image)}
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
                  <div className="flex items-center px-4">
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
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "No products found matching your search" : "No products available"}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
