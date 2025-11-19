import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAdminProducts,
  getAdminProductDetail,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
  updateProductVariants,
  getCategoryAttributes,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Image as ImageIcon, Package, RefreshCw, Search, Filter, Grid3x3, List, X, Upload } from "lucide-react";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  created_at: string;
};

type Category = {
  id: number;
  name: string;
};

const getImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http") || imagePath.startsWith("data:")) return imagePath;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  return `${baseUrl.replace("/api", "")}${imagePath}`;
};

const AdminProducts = () => {
  const { tokens } = useAuth();
  const access = tokens?.access || "";
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variants, setVariants] = useState<Array<{ size: string; stock: number }>>([]);
  const [categoryAttributes, setCategoryAttributes] = useState<Array<{ id: number; name: string; field_type: string; is_required: boolean; options: Array<{ id: number; value: string }> }>>([]);
  const [productAttributes, setProductAttributes] = useState<Record<number, string>>({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    image: null as File | null,
  });

  const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchCategoryAttributes = async (categoryId: string) => {
    if (!categoryId) {
      setCategoryAttributes([]);
      return;
    }
    try {
      const response = await getCategoryAttributes(access, parseInt(categoryId));
      setCategoryAttributes(response.data.attributes || []);
    } catch (error) {
      console.error('Failed to fetch category attributes:', error);
      setCategoryAttributes([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getAdminProducts(access, undefined, "", 100),
        getAdminCategories(access),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (access) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.stock) {
      toast({ variant: "destructive", title: "Error", description: "Fill all required fields" });
      return;
    }

    // Validate variants if specified
    if (variants.length > 0) {
      const totalVariantStock = variants.reduce((sum, v) => sum + v.stock, 0);
      const productStock = parseInt(form.stock);
      
      if (totalVariantStock !== productStock) {
        toast({ 
          variant: "destructive", 
          title: "Error", 
          description: `Variant stocks (${totalVariantStock}) must equal total stock (${productStock})` 
        });
        return;
      }
    }

    try {
      let productId = editingId;
      
      console.log('=== DEBUG: Form submission ===');
      console.log('Category ID:', form.category_id);
      console.log('Product attributes state:', productAttributes);
      console.log('Category attributes available:', categoryAttributes);
      
      if (editingId) {
        await updateAdminProduct(
          access,
          editingId,
          {
            name: form.name,
            description: form.description,
            price: parseFloat(form.price),
            stock: parseInt(form.stock),
            category_id: form.category_id ? parseInt(form.category_id) : null,
          },
          form.image || undefined,
          productAttributes
        );
        toast({ title: "Success", description: "Product updated" });
      } else {
        const result = await createAdminProduct(
          access,
          form.name,
          form.description,
          parseFloat(form.price),
          parseInt(form.stock),
          form.category_id ? parseInt(form.category_id) : null,
          form.image || undefined,
          productAttributes
        );
        productId = result.data.id;
        toast({ title: "Success", description: "Product created" });
      }

      // Save variants if any are specified
      if (variants.length > 0 && productId) {
        await updateProductVariants(access, productId, variants);
      }

      resetForm();
      fetchData();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const handleEdit = async (prod: Product) => {
    try {
      const res = await getAdminProductDetail(access, prod.id);
      const data = res.data;
      setForm({
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        stock: data.stock.toString(),
        category_id: data.category_id?.toString() || "",
        image: null,
      });
      if (data.image) setImagePreview(getImageUrl(data.image));
      // Load variants if they exist
      if (data.variants && Array.isArray(data.variants)) {
        setVariants(data.variants.map((v: any) => ({ size: v.size, stock: v.stock })));
      }
      // Load attributes if they exist
      const attributeMap: Record<number, string> = {};
      if (data.attributes && Array.isArray(data.attributes)) {
        data.attributes.forEach((attr: any) => {
          attributeMap[attr.id] = attr.value;
        });
      }
      setProductAttributes(attributeMap);
      
      // Load category attributes
      if (data.category_id) {
        await fetchCategoryAttributes(data.category_id.toString());
      }
      
      setEditingId(prod.id);
      setShowModal(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteAdminProduct(access, deleteTargetId);
      toast({ title: "Success", description: "Product deleted" });
      setDeleteTargetId(null);
      fetchData();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", stock: "", category_id: "", image: null });
    setImagePreview(null);
    setVariants([]);
    setCategoryAttributes([]);
    setProductAttributes({});
    setEditingId(null);
    setShowModal(false);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: products.length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    categories: new Set(products.map(p => p.category)).size,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Products Management</h2>
          <p className="text-slate-500 mt-1">Manage your product catalog and inventory</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-indigo-700 mb-1">Total Products</p>
            <p className="text-2xl font-bold text-indigo-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-amber-700 mb-1">Low Stock</p>
            <p className="text-2xl font-bold text-amber-900">{stats.lowStock}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-red-700 mb-1">Out of Stock</p>
            <p className="text-2xl font-bold text-red-900">{stats.outOfStock}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-purple-700 mb-1">Categories</p>
            <p className="text-2xl font-bold text-purple-900">{stats.categories}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48 border-slate-300 focus:ring-2 focus:ring-indigo-500">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex gap-1 border border-slate-300 rounded-lg p-1 w-fit">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-gradient-to-r from-indigo-600 to-purple-600" : ""}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-gradient-to-r from-indigo-600 to-purple-600" : ""}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Display */}
      {loading ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-indigo-600 animate-spin" />
            <p className="text-slate-600">Loading products...</p>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">{searchTerm || categoryFilter !== "all" ? "No products match your search" : "No products yet"}</p>
            {!searchTerm && categoryFilter === "all" && (
              <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Create First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow group">
              <CardContent className="p-0">
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-slate-400" />
                  </div>
                  {/* Stock Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.stock > 10
                          ? "bg-green-100 text-green-800"
                          : product.stock > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.stock} units
                    </span>
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="p-4 space-y-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-slate-500">{product.category}</p>
                  </div>
                  <p className="text-2xl font-bold text-indigo-600">₹{product.price.toFixed(2)}</p>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(product)}
                      className="flex-1 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-600"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteTargetId(product.id)}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Products ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{product.category}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">₹{product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            product.stock > 10
                              ? "bg-green-100 text-green-800"
                              : product.stock > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEdit(product)}
                            className="hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setDeleteTargetId(product.id)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Package className="w-6 h-6 text-indigo-600" />
              {editingId ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Product Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter product name"
                    className="border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Description</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Enter description"
                    className="border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Price *</Label>
                    <Input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      className="border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Stock *</Label>
                    <Input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      placeholder="0"
                      className="border-slate-300 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">Category</Label>
                  <Select
                    value={form.category_id}
                    onValueChange={(value) => {
                      const previousCategoryId = form.category_id;
                      setForm({ ...form, category_id: value });
                      if (value !== previousCategoryId) {
                        setProductAttributes({});
                      }
                      fetchCategoryAttributes(value);
                    }}
                  >
                    <SelectTrigger className="border-slate-300 focus:ring-2 focus:ring-indigo-500">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Category Attributes */}
            {form.category_id && (
              <div className="border-t pt-4">
                <div className="mb-4">
                  <Label className="text-base font-semibold mb-2 block">Product Attributes</Label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-blue-800 font-medium mb-1">How Dynamic Attributes Work:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• <strong>Select:</strong> Choose from predefined options (dropdown on website)</li>
                      <li>• <strong>Number:</strong> Enter numeric values (enables range filtering: 10-50, 20-100)</li>
                      <li>• <strong>Text:</strong> Enter descriptive text (enables search filtering)</li>
                      <li>• These attributes become filters that customers can use to find products</li>
                    </ul>
                  </div>
                </div>
                {categoryAttributes.length > 0 ? (
                  <div className="space-y-4">
                    {categoryAttributes.map((attr) => (
                      <div key={attr.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Label className="text-sm font-medium text-gray-900">
                            {attr.name} 
                            {attr.is_required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            attr.field_type === 'select' ? 'bg-purple-100 text-purple-700' :
                            attr.field_type === 'number' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {attr.field_type}
                          </span>
                        </div>
                      {attr.field_type === 'select' ? (
                        <div>
                          <select
                            value={productAttributes[attr.id] || ''}
                            onChange={(e) => setProductAttributes(prev => ({ ...prev, [attr.id]: e.target.value }))}
                            className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            required={attr.is_required}
                          >
                            <option value="">Select {attr.name.toLowerCase()}</option>
                            {attr.options.map((option) => (
                              <option key={option.id} value={option.value}>
                                {option.value}
                              </option>
                            ))}
                          </select>
                          {attr.options.length === 0 && (
                            <p className="text-xs text-orange-600 mt-1">No options configured for this attribute</p>
                          )}
                        </div>
                      ) : attr.field_type === 'number' ? (
                        <div>
                          <Input
                            type="number"
                            value={productAttributes[attr.id] || ''}
                            onChange={(e) => setProductAttributes(prev => ({ ...prev, [attr.id]: e.target.value }))}
                            placeholder="Enter numeric value (e.g., 10, 25.5)"
                            className="mt-1"
                            required={attr.is_required}
                            step="any"
                            min="0"
                          />
                          <div className="mt-1 text-xs text-gray-500">
                            <p>• Enter a numeric value (decimals allowed)</p>
                            <p>• This will be used for range filtering on the website</p>
                            <p>• Examples: Size (8, 10, 12), Weight (1.5, 2.0), Length (30, 45)</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Input
                            type="text"
                            value={productAttributes[attr.id] || ''}
                            onChange={(e) => setProductAttributes(prev => ({ ...prev, [attr.id]: e.target.value }))}
                            placeholder={`Enter ${attr.name.toLowerCase()} (e.g., Cotton, Red, Large)`}
                            className="mt-1"
                            required={attr.is_required}
                            maxLength={100}
                          />
                          <div className="mt-1 text-xs text-gray-500">
                            <p>• Enter a descriptive text value</p>
                            <p>• This will be searchable on the website</p>
                            <p>• Examples: Material (Cotton, Polyester), Color (Red, Blue), Pattern (Striped, Solid)</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 mb-2">No specific attributes defined for this category</p>
                    <p className="text-xs text-gray-400">Attributes can be added in the Categories management section</p>
                  </div>
                )}
                
                {/* Attribute Preview */}
                {Object.keys(productAttributes).length > 0 && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">Preview - How customers will see these attributes:</h4>
                    <div className="space-y-2">
                      {categoryAttributes
                        .filter(attr => productAttributes[attr.id])
                        .map(attr => (
                          <div key={attr.id} className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-green-700">{attr.name}:</span>
                            <span className="text-green-600">{productAttributes[attr.id]}</span>
                            <span className="text-xs text-green-500">
                              ({attr.field_type === 'number' ? 'filterable by range' : 
                                attr.field_type === 'select' ? 'filterable by selection' : 'searchable'})
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Product Image */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  Product Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded-lg" />
                      <Button
                        variant="outline"
                        onClick={() => {
                          setForm({ ...form, image: null });
                          setImagePreview(null);
                        }}
                        className="mt-4 hover:bg-red-50 hover:text-red-600 hover:border-red-600"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-700">Click to upload image</span>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Size Variants Section */}
            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">Size Variants (Optional)</Label>
              <p className="text-sm text-gray-600 mb-3">Add different sizes with individual stock counts</p>
              
              <div className="space-y-2">
                {AVAILABLE_SIZES.map((size) => {
                  const variant = variants.find(v => v.size === size);
                  const stock = variant?.stock || 0;
                  const isActive = variant !== undefined;

                  return (
                    <div key={size} className="flex items-center gap-3 p-2 border rounded">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVariants([...variants, { size, stock: 0 }]);
                          } else {
                            setVariants(variants.filter(v => v.size !== size));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="w-12 font-medium">{size}</span>
                      {isActive && (
                        <>
                          <Label className="text-sm">Stock:</Label>
                          <Input
                            type="number"
                            value={stock}
                            onChange={(e) => {
                              const newStock = parseInt(e.target.value) || 0;
                              setVariants(variants.map(v => 
                                v.size === size ? { ...v, stock: newStock } : v
                              ));
                            }}
                            min="0"
                            className="w-24"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {variants.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Variant Stock Total:</span>
                    <span className={`font-bold ${
                      variants.reduce((sum, v) => sum + v.stock, 0) === parseInt(form.stock || '0')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {variants.reduce((sum, v) => sum + v.stock, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="font-medium">Total Product Stock:</span>
                    <span className="font-bold">{form.stock || 0}</span>
                  </div>
                  {variants.reduce((sum, v) => sum + v.stock, 0) !== parseInt(form.stock || '0') && (
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ Variant stocks must equal total stock
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {editingId ? (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Update Product
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Trash2 className="w-5 h-5 text-red-600" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription className="text-base">
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
