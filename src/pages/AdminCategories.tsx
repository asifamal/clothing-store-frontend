import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory, getCategoryAttributes, createCategoryAttribute, deleteCategoryAttribute } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Settings, X, FolderTree, FileText, Hash, List, RefreshCw, Tag } from "lucide-react";

type Category = {
  id: number;
  name: string;
  description: string;
  created_at: string;
};

type CategoryAttribute = {
  id: number;
  name: string;
  field_type: 'text' | 'number' | 'select';
  is_required: boolean;
  options?: { id: number; value: string; }[];
};

const AdminCategories = () => {
  const { tokens } = useAuth();
  const access = tokens?.access || "";
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  // Attributes management state
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [attributeForm, setAttributeForm] = useState({
    name: "",
    field_type: "text" as "text" | "number" | "select",
    is_required: false,
    options: "" // For select type, comma-separated values
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getAdminCategories(access);
      setCategories(res.data as Category[]);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (access) fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Category name is required" });
      return;
    }

    try {
      if (editingId) {
        await updateAdminCategory(access, editingId, form.name, form.description);
        toast({ title: "Success", description: "Category updated" });
      } else {
        await createAdminCategory(access, form.name, form.description);
        toast({ title: "Success", description: "Category created" });
      }
      setForm({ name: "", description: "" });
      setEditingId(null);
      setShowModal(false);
      fetchCategories();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const handleEdit = (cat: Category) => {
    setForm({ name: cat.name, description: cat.description });
    setEditingId(cat.id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      await deleteAdminCategory(access, deleteTargetId);
      toast({ title: "Success", description: "Category deleted" });
      setDeleteTargetId(null);
      fetchCategories();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", description: "" });
    setEditingId(null);
    setShowModal(false);
  };

  // Attributes management functions
  const openAttributesModal = async (category: Category) => {
    setSelectedCategoryId(category.id);
    setSelectedCategoryName(category.name);
    setShowAttributesModal(true);
    try {
      const res = await getCategoryAttributes(access, category.id);
      setAttributes(res.data?.attributes || []);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load attributes" });
      setAttributes([]);
    }
  };

  const handleSaveAttribute = async () => {
    if (!attributeForm.name.trim() || !selectedCategoryId) {
      toast({ variant: "destructive", title: "Error", description: "Attribute name is required" });
      return;
    }

    try {
      const options = attributeForm.field_type === 'select' && attributeForm.options.trim()
        ? attributeForm.options
            .split(/[,\n]/) // Split by comma or newline
            .map(opt => opt.trim())
            .filter(opt => opt.length > 0)
        : [];

      if (attributeForm.field_type === 'select' && options.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "Please provide at least one option for dropdown fields" });
        return;
      }

      await createCategoryAttribute(access, selectedCategoryId, {
        name: attributeForm.name,
        field_type: attributeForm.field_type,
        is_required: attributeForm.is_required,
        options
      });

      toast({ title: "Success", description: "Attribute added successfully" });
      setAttributeForm({ name: "", field_type: "text", is_required: false, options: "" });
      
      // Refresh attributes
      const res = await getCategoryAttributes(access, selectedCategoryId);
      setAttributes(res.data?.attributes || []);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const handleDeleteAttribute = async (attributeId: number) => {
    if (!selectedCategoryId) return;
    try {
      await deleteCategoryAttribute(access, selectedCategoryId, attributeId);
      toast({ title: "Success", description: "Attribute deleted" });
      
      // Refresh attributes
      const res = await getCategoryAttributes(access, selectedCategoryId);
      setAttributes(res.data?.attributes || []);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const resetAttributesModal = () => {
    setShowAttributesModal(false);
    setSelectedCategoryId(null);
    setSelectedCategoryName("");
    setAttributes([]);
    setAttributeForm({ name: "", field_type: "text", is_required: false, options: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Categories</h2>
          <p className="text-slate-500 mt-1">Organize your products with categories and custom attributes</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchCategories}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", description: "" });
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Categories</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{categories.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FolderTree className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">With Attributes</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {categories.filter(c => c.description).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Last Added</p>
                <p className="text-lg font-bold text-slate-900 mt-2">
                  {categories.length > 0 ? new Date(categories[0].created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Tag className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-indigo-600 animate-spin" />
            <p className="text-slate-600">Loading categories...</p>
          </CardContent>
        </Card>
      ) : categories.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <FolderTree className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 mb-4">No categories yet</p>
            <Button 
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Card key={cat.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                        <FolderTree className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle className="text-lg">{cat.name}</CardTitle>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      {cat.description || "No description"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-xs text-slate-500">
                    <Tag className="w-3 h-3 mr-1" />
                    Created {new Date(cat.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(cat)}
                      className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openAttributesModal(cat)}
                      className="flex-1 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Attributes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteTargetId(cat.id)}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit2 className="w-5 h-5 text-indigo-600" />
                  Edit Category
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-indigo-600" />
                  Add New Category
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingId ? "Update the category information" : "Create a new product category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-slate-600" />
                Category Name *
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Electronics, Clothing, Home..."
                className="mt-2 border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                Description (optional)
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter category description"
                className="mt-2 border-slate-300 focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {editingId ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone and may affect associated products.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
            >
              {deleteLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Category
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Attributes Modal */}
      <Dialog open={showAttributesModal} onOpenChange={(open) => { if (!open) resetAttributesModal(); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Settings className="w-6 h-6 text-indigo-600" />
              Manage Attributes - {selectedCategoryName}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Define custom attributes that products in this category can have (e.g., "Sleeve Length" for shirts, "Fit Type" for pants).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Add New Attribute Form */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  Add New Attribute
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="attr-name" className="text-sm font-medium text-slate-700 mb-2 block">
                      Attribute Name *
                    </Label>
                    <Input
                      id="attr-name"
                      value={attributeForm.name}
                      onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })}
                      placeholder="e.g., Sleeve Length, Size, Material"
                      className="border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="attr-type" className="text-sm font-medium text-slate-700 mb-2 block">
                      Field Type *
                    </Label>
                    <Select 
                      value={attributeForm.field_type} 
                      onValueChange={(value: "text" | "number" | "select") => 
                        setAttributeForm({ ...attributeForm, field_type: value, options: value !== 'select' ? '' : attributeForm.options })
                      }
                    >
                      <SelectTrigger className="border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500">
                        <SelectValue placeholder="Select field type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text (Free input - e.g., Brand, Material)</SelectItem>
                        <SelectItem value="number">Number (Range filtering - e.g., Price, Size)</SelectItem>
                        <SelectItem value="select">Dropdown (Pre-defined options - e.g., Colors, Sizes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {attributeForm.field_type === 'select' && (
                  <div>
                    <Label htmlFor="attr-options" className="text-sm font-medium text-slate-700 mb-2 block">
                      Options *
                    </Label>
                    <p className="text-sm text-slate-600 mb-2">
                      Add options one by one. Example: "Small", "Medium", "Large" or "Short Sleeve", "Long Sleeve", "Sleeveless"
                    </p>
                    <Textarea
                      id="attr-options"
                      value={attributeForm.options}
                      onChange={(e) => setAttributeForm({ ...attributeForm, options: e.target.value })}
                      placeholder="Enter each option on a new line or separate with commas:

Short Sleeve
Long Sleeve
Sleeveless

OR

Short Sleeve, Long Sleeve, Sleeveless"
                      className="border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                      rows={4}
                    />
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      <span className="text-indigo-600">💡</span> Tip: You can enter options separated by commas or each on a new line
                    </p>
                  </div>
                )}
                
                {attributeForm.field_type === 'number' && (
                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="text-lg">📊</span>
                        <span><strong>Number fields</strong> allow customers to filter by ranges (e.g., "Price: $10-$50" or "Size: 6-12").
                        Products will be filterable by minimum and maximum values.</span>
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {attributeForm.field_type === 'text' && (
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-4">
                      <p className="text-sm text-green-800 flex items-start gap-2">
                        <span className="text-lg">✏️</span>
                        <span><strong>Text fields</strong> allow customers to search by typing (e.g., "Material: Cotton" or "Brand: Nike").
                        Good for open-ended attributes with many possible values.</span>
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="attr-required"
                    checked={attributeForm.is_required}
                    onChange={(e) => setAttributeForm({ ...attributeForm, is_required: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="attr-required" className="text-sm text-slate-700 cursor-pointer">
                    Required field (customers must specify this when viewing products)
                  </Label>
                </div>
                
                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={handleSaveAttribute} 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Attribute
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Attributes */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <List className="w-5 h-5 text-indigo-600" />
                  Existing Attributes ({attributes?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!attributes || attributes.length === 0 ? (
                  <div className="text-center py-12">
                    <Settings className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">No attributes defined for this category yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attributes.map((attr) => (
                      <Card key={attr.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="font-semibold text-slate-900">{attr.name}</span>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  attr.field_type === 'text' ? 'bg-blue-100 text-blue-700' :
                                  attr.field_type === 'number' ? 'bg-green-100 text-green-700' :
                                  'bg-purple-100 text-purple-700'
                                }`}>
                                  {attr.field_type === 'select' ? '📋 Dropdown' : 
                                   attr.field_type === 'number' ? '🔢 Number Range' : 
                                   '✏️ Text Input'}
                                </span>
                                {attr.is_required && (
                                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                                    ⚠️ Required
                                  </span>
                                )}
                              </div>
                              {attr.field_type === 'select' && attr.options && attr.options.length > 0 && (
                                <div className="text-sm text-slate-600 mt-2">
                                  <strong className="text-slate-700">Options:</strong>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {attr.options.map(opt => (
                                      <span key={opt.id} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                                        {opt.value}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {attr.field_type === 'number' && (
                                <div className="text-sm text-slate-600 mt-2">
                                  <strong className="text-slate-700">Type:</strong> Customers can filter by number ranges (e.g., 10-50)
                                </div>
                              )}
                              {attr.field_type === 'text' && (
                                <div className="text-sm text-slate-600 mt-2">
                                  <strong className="text-slate-700">Type:</strong> Customers can search by typing text
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAttribute(attr.id)}
                              className="ml-4 hover:bg-red-50 hover:text-red-600 shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetAttributesModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
