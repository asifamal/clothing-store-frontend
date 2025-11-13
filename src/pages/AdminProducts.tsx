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
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react";

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
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    image: null as File | null,
  });

  const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
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
          form.image || undefined
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
          form.image || undefined
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
    setEditingId(null);
    setShowModal(false);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Products</h2>
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-600 mb-4">No products yet</p>
            <Button onClick={() => setShowModal(true)}>Create First Product</Button>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stock</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{product.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{product.category}</td>
                    <td className="px-6 py-3 text-sm text-gray-900">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          product.stock > 10
                            ? "bg-green-100 text-green-800"
                            : product.stock > 0
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteTargetId(product.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter product name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter description"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price *</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Stock *</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Product Image</Label>
              <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded" />
                    <button
                      onClick={() => {
                        setForm({ ...form, image: null });
                        setImagePreview(null);
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

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
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>Are you sure you want to delete this product? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
