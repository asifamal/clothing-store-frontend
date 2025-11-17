import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { adminListUsers, adminDeleteUser, adminUpdateUser, registerUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  Save,
  Shield,
  User,
  Mail,
  Key,
  Filter,
  RefreshCw
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type UserItem = {
  id: number;
  username: string;
  email: string;
  role: string;
  is_staff?: boolean;
  is_superuser?: boolean;
};

const AdminUsers = () => {
  const { tokens } = useAuth();
  const access = tokens?.access || "";
  const { toast } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'customer' | 'manager'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "customer" });
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminListUsers(access);
      if (res.data) setUsers(res.data as UserItem[]);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const promptDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  const handleDelete = async (id?: number) => {
    const toDelete = id ?? deleteTargetId;
    if (!toDelete) return;
    setDeleteLoading(true);
    try {
      await adminDeleteUser(access, toDelete);
      toast({ title: "Success", description: "User deleted successfully" });
      setDeleteTargetId(null);
      fetchUsers();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const startEdit = (u: UserItem) => {
    setEditingId(u.id);
    setForm({ username: u.username, email: u.email, password: "", role: u.role });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ username: "", email: "", password: "", role: "customer" });
  };

  const submitEdit = async () => {
    if (!editingId) return;
    try {
      await adminUpdateUser(access, editingId, { 
        username: form.username, 
        email: form.email, 
        role: form.role, 
        password: form.password || undefined 
      });
      toast({ title: "Success", description: "User updated successfully" });
      cancelEdit();
      fetchUsers();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const handleCreate = async () => {
    if (!form.username || !form.email || !form.password) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields" });
      return;
    }
    try {
      const res = await registerUser(form.username, form.email, form.password, form.role as 'customer' | 'manager');
      if (res.data) {
        toast({ title: "Success", description: "User created successfully" });
        setForm({ username: "", email: "", password: "", role: "customer" });
        setShowCreateModal(false);
        fetchUsers();
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesFilter = filter === 'all' ? true : u.role === filter;
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'manager':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 flex items-center gap-1 w-fit">
            <Shield className="w-3 h-3" />
            Manager
          </span>
        );
      case 'customer':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 flex items-center gap-1 w-fit">
            <User className="w-3 h-3" />
            Customer
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {role}
          </span>
        );
    }
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const stats = {
    total: users.length,
    customers: users.filter(u => u.role === 'customer').length,
    managers: users.filter(u => u.role === 'manager').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">User Management</h2>
          <p className="text-slate-500 mt-1">Manage your platform users and roles</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Users</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Customers</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.customers}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Managers</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.managers}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
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
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : ''}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'customer' ? 'default' : 'outline'}
                  onClick={() => setFilter('customer')}
                  className={filter === 'customer' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : ''}
                >
                  Customers
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'manager' ? 'default' : 'outline'}
                  onClick={() => setFilter('manager')}
                  className={filter === 'manager' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''}
                >
                  Managers
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchUsers}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table/Grid */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 text-indigo-600 animate-spin" />
              <p className="text-slate-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredUsers.map((u) => (
                      <React.Fragment key={u.id}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            {editingId === u.id ? (
                              <Input 
                                value={form.username} 
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className="max-w-xs"
                              />
                            ) : (
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                                  <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-semibold">
                                    {getInitials(u.username)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-slate-900">{u.username}</p>
                                  <p className="text-xs text-slate-500">ID: {u.id}</p>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingId === u.id ? (
                              <Input 
                                value={form.email} 
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="max-w-xs"
                              />
                            ) : (
                              <span className="text-sm text-slate-600">{u.email}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingId === u.id ? (
                              <select 
                                value={form.role} 
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="customer">Customer</option>
                                <option value="manager">Manager</option>
                              </select>
                            ) : (
                              getRoleBadge(u.role)
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {u.is_superuser && (
                                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full w-fit">Superuser</span>
                              )}
                              {u.is_staff && (
                                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full w-fit">Staff</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {editingId === u.id ? (
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={submitEdit}
                                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                                  className="hover:bg-indigo-50 hover:text-indigo-600"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => startEdit(u)}
                                  className="hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => promptDelete(u.id)}
                                  className="hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {expandedId === u.id && (
                          <tr className="bg-gradient-to-r from-indigo-50 to-purple-50">
                            <td colSpan={5} className="px-6 py-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">Username</p>
                                  <p className="text-sm font-medium text-slate-900">{u.username}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">Email</p>
                                  <p className="text-sm font-medium text-slate-900">{u.email}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">Role</p>
                                  <p className="text-sm font-medium text-slate-900">{u.role}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">User ID</p>
                                  <p className="text-sm font-medium text-slate-900">#{u.id}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">Staff Status</p>
                                  <p className="text-sm font-medium text-slate-900">{u.is_staff ? 'Yes' : 'No'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-600 mb-1">Superuser</p>
                                  <p className="text-sm font-medium text-slate-900">{u.is_superuser ? 'Yes' : 'No'}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden divide-y divide-slate-200">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="p-4">
                    {editingId === u.id ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-slate-600">Username</Label>
                          <Input 
                            value={form.username} 
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Email</Label>
                          <Input 
                            value={form.email} 
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-600">Role</Label>
                          <select 
                            value={form.role} 
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="customer">Customer</option>
                            <option value="manager">Manager</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={submitEdit}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button variant="ghost" size="sm" onClick={cancelEdit} className="flex-1">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 border-2 border-white shadow-md">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-semibold">
                              {getInitials(u.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{u.username}</p>
                            <p className="text-sm text-slate-500">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(u.role)}
                          {u.is_superuser && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">Superuser</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                            className="flex-1"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {expandedId === u.id ? 'Hide' : 'Details'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEdit(u)}
                            className="flex-1"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => promptDelete(u.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        {expandedId === u.id && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-xs text-slate-600">User ID</p>
                                <p className="font-medium">#{u.id}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-600">Staff</p>
                                <p className="font-medium">{u.is_staff ? 'Yes' : 'No'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Create New User
            </DialogTitle>
            <DialogDescription>
              Add a new user to the platform with specified role and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-slate-600" />
                Username *
              </Label>
              <Input 
                value={form.username} 
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Enter username"
                className="border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-slate-600" />
                Email *
              </Label>
              <Input 
                type="email"
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
                className="border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-slate-600" />
                Password *
              </Label>
              <Input 
                type="password"
                value={form.password} 
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
                className="border-slate-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-slate-600" />
                Role *
              </Label>
              <select 
                value={form.role} 
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="customer">Customer</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setShowCreateModal(false);
              setForm({ username: "", email: "", password: "", role: "customer" });
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTargetId(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDelete()} 
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
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
