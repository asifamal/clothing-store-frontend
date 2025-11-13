import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory, getCategoryAttributes, createCategoryAttribute, deleteCategoryAttribute } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Settings, X } from "lucide-react";

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
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Categories</h2>
            <p className="text-gray-600 mt-1">Manage product categories</p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", description: "" });
              setShowModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-600">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-600 mb-4">No categories yet</p>
            <Button onClick={() => setShowModal(true)}>Create First Category</Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{cat.description || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(cat.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(cat)}
                          className="flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openAttributesModal(cat)}
                          className="flex items-center gap-1"
                        >
                          <Settings className="w-4 h-4" />
                          Attributes
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTargetId(cat.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats Footer */}
        {categories.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-sm text-gray-600">
            Total Categories: <span className="font-semibold text-gray-900">{categories.length}</span>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the category information" : "Create a new product category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Electronics, Clothing, Home..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter category description"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
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
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Attributes Modal */}
      <Dialog open={showAttributesModal} onOpenChange={(open) => { if (!open) resetAttributesModal(); }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Attributes - {selectedCategoryName}</DialogTitle>
            <DialogDescription>
              Define custom attributes that products in this category can have (e.g., "Sleeve Length" for shirts, "Fit Type" for pants).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Add New Attribute Form */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">Add New Attribute</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="attr-name">Attribute Name *</Label>
                  <Input
                    id="attr-name"
                    value={attributeForm.name}
                    onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })}
                    placeholder="e.g., Sleeve Length, Size, Material"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="attr-type">Field Type *</Label>
                  <Select 
                    value={attributeForm.field_type} 
                    onValueChange={(value: "text" | "number" | "select") => 
                      setAttributeForm({ ...attributeForm, field_type: value, options: value !== 'select' ? '' : attributeForm.options })
                    }
                  >
                    <SelectTrigger className="mt-1">
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
                <div className="mt-4">
                  <Label htmlFor="attr-options">Options *</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Add options one by one. Example: "Small", "Medium", "Large" or "Short Sleeve", "Long Sleeve", "Sleeveless"
                  </p>
                  <Textarea
                    id="attr-options"
                    value={attributeForm.options}
                    onChange={(e) => setAttributeForm({ ...attributeForm, options: e.target.value })}
                    placeholder="Enter each option on a new line or separate with commas:\n\nShort Sleeve\nLong Sleeve\nSleeveless\n\nOR\n\nShort Sleeve, Long Sleeve, Sleeveless"
                    className="mt-1"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: You can enter options separated by commas or each on a new line
                  </p>
                </div>
              )}
              
              {attributeForm.field_type === 'number' && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📊 <strong>Number fields</strong> allow customers to filter by ranges (e.g., "Price: $10-$50" or "Size: 6-12").
                    Products will be filterable by minimum and maximum values.
                  </p>
                </div>
              )}
              
              {attributeForm.field_type === 'text' && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✏️ <strong>Text fields</strong> allow customers to search by typing (e.g., "Material: Cotton" or "Brand: Nike").
                    Good for open-ended attributes with many possible values.
                  </p>
                </div>
              )}
              
              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="attr-required"
                  checked={attributeForm.is_required}
                  onChange={(e) => setAttributeForm({ ...attributeForm, is_required: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="attr-required">Required field (customers must specify this when viewing products)</Label>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button onClick={handleSaveAttribute} className="bg-blue-600 hover:bg-blue-700">
                  Add Attribute
                </Button>
              </div>
            </div>

            {/* Existing Attributes */}
            <div>
              <h3 className="text-lg font-medium mb-4">Existing Attributes ({attributes?.length || 0})</h3>
              {!attributes || attributes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No attributes defined for this category yet.</p>
              ) : (
                <div className="grid gap-3">
                  {attributes.map((attr) => (
                    <div key={attr.id} className="flex items-start justify-between p-4 bg-white border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-lg">{attr.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            attr.field_type === 'text' ? 'bg-blue-100 text-blue-800' :
                            attr.field_type === 'number' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {attr.field_type === 'select' ? '📋 Dropdown' : 
                             attr.field_type === 'number' ? '🔢 Number Range' : 
                             '✏️ Text Input'}
                          </span>
                          {attr.is_required && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                              ⚠️ Required
                            </span>
                          )}
                        </div>
                        {attr.field_type === 'select' && attr.options && attr.options.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <strong>Options:</strong> {attr.options.map(opt => opt.value).join(' • ')}
                          </div>
                        )}
                        {attr.field_type === 'number' && (
                          <div className="text-sm text-gray-600">
                            <strong>Type:</strong> Customers can filter by number ranges (e.g., 10-50)
                          </div>
                        )}
                        {attr.field_type === 'text' && (
                          <div className="text-sm text-gray-600">
                            <strong>Type:</strong> Customers can search by typing text
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteAttribute(attr.id)}
                        className="ml-4"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={resetAttributesModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
