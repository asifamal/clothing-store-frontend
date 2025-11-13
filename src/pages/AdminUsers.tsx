import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { adminListUsers, adminDeleteUser, adminUpdateUser, registerUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "customer" });

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

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const promptDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  const handleDelete = async (id?: number) => {
    const toDelete = id ?? deleteTargetId;
    if (!toDelete) return;
    setDeleteLoading(true);
    try {
      await adminDeleteUser(access, toDelete);
      toast({ title: "Deleted", description: "User deleted" });
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
      await adminUpdateUser(access, editingId, { username: form.username, email: form.email, role: form.role, password: form.password || undefined });
      toast({ title: "Saved", description: "User updated" });
      cancelEdit();
      fetchUsers();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const handleCreate = async () => {
    try {
      const res = await registerUser(form.username, form.email, form.password, form.role as 'customer' | 'manager');
      if (res.data) {
        toast({ title: "Created", description: "User created" });
        setForm({ username: "", email: "", password: "", role: "customer" });
        fetchUsers();
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>

        <div className="mb-6 p-4 border rounded-md">
          <h3 className="font-medium mb-2">Create User</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Password</Label>
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <div className="mt-3">
            <Label>Role</Label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 border rounded px-2 py-1">
              <option value="customer">Customer</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div className="mt-3">
            <Button onClick={handleCreate}>Create user</Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Label>Filter:</Label>
          <div className="flex gap-2">
            <Button size="sm" variant={filter === 'all' ? undefined : 'ghost'} onClick={() => setFilter('all')}>All</Button>
            <Button size="sm" variant={filter === 'customer' ? undefined : 'ghost'} onClick={() => setFilter('customer')}>Customers</Button>
            <Button size="sm" variant={filter === 'manager' ? undefined : 'ghost'} onClick={() => setFilter('manager')}>Managers</Button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-2">Existing Users</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="p-2">ID</th>
                  <th className="p-2">Username</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => filter === 'all' ? true : u.role === filter).map((u) => (
                  <React.Fragment key={u.id}>
                    <tr className="border-t">
                      <td className="p-2">{u.id}</td>
                      <td className="p-2">
                        {editingId === u.id ? (
                          <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                        ) : (
                          u.username
                        )}
                      </td>
                      <td className="p-2">
                        {editingId === u.id ? (
                          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        ) : (
                          u.email
                        )}
                      </td>
                      <td className="p-2">
                        {editingId === u.id ? (
                          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="border rounded px-2 py-1">
                            <option value="customer">Customer</option>
                            <option value="manager">Manager</option>
                          </select>
                        ) : (
                          u.role
                        )}
                      </td>
                      <td className="p-2">
                        {editingId === u.id ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={submitEdit}>Save</Button>
                            <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => startEdit(u)}>Edit</Button>
                            <Button size="sm" onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}>{expandedId === u.id ? 'Hide' : 'Details'}</Button>
                            <Button variant="destructive" size="sm" onClick={() => promptDelete(u.id)}>Delete</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedId === u.id && (
                      <tr key={`details-${u.id}`} className="bg-muted/10">
                        <td colSpan={5} className="p-4 text-sm text-muted-foreground">
                          <div className="grid grid-cols-2 gap-2">
                            <div><strong>Username:</strong> {u.username}</div>
                            <div><strong>Email:</strong> {u.email}</div>
                            <div><strong>Role:</strong> {u.role}</div>
                            <div><strong>Staff:</strong> {String(u.is_staff)}</div>
                            <div><strong>Superuser:</strong> {String(u.is_superuser)}</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Dialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm delete</DialogTitle>
              <DialogDescription>Are you sure you want to delete this user? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeleteTargetId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDelete()} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminUsers;
