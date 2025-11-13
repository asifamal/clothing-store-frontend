import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  User, 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Star,
  Home,
  Building,
  CreditCard,
  Truck,
  MoreHorizontal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getUserProfile, 
  updateUserProfile, 
  getUserAddresses, 
  createUserAddress, 
  updateUserAddress, 
  deleteUserAddress,
  setDefaultAddress 
} from "@/lib/api";

interface UserProfile {
  id: number | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  phone_number: string;
  avatar: string | null;
  bio: string;
  created_at: string | null;
  updated_at: string | null;
}

interface UserData {
  id: number;
  username: string;
  email: string;
}

interface Address {
  id: number;
  address_type: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  street_address: string;
  apartment_number: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

interface AddressFormData {
  address_type: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  street_address: string;
  apartment_number: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
}

const addressTypeIcons = {
  home: Home,
  work: Building,
  billing: CreditCard,
  shipping: Truck,
  other: MoreHorizontal,
};

const addressTypeLabels = {
  home: 'Home',
  work: 'Work',
  billing: 'Billing',
  shipping: 'Shipping',
  other: 'Other',
};

export default function Profile() {
  const { isAuthenticated, tokens, user: authUser } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const { toast } = useToast();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone_number: '',
    bio: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Address form state
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    address_type: 'home',
    street_address: '',
    apartment_number: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States',
    is_default: false,
  });

  const loadProfile = async () => {
    try {
      if (!tokens?.access) {
        throw new Error('Please log in');
      }

      const response = await getUserProfile(tokens.access);
      setUser(response.data.user);
      setProfile(response.data.profile);
      
      // Update form with profile data
      setProfileForm({
        first_name: response.data.profile.first_name || '',
        last_name: response.data.profile.last_name || '',
        date_of_birth: response.data.profile.date_of_birth || '',
        phone_number: response.data.profile.phone_number || '',
        bio: response.data.profile.bio || '',
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadAddresses = async () => {
    try {
      if (!tokens?.access) return;

      const response = await getUserAddresses(tokens.access);
      setAddresses(response.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load addresses",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!isAuthenticated || !tokens) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await loadProfile();
      await loadAddresses();
      setLoading(false);
    };
    init();
  }, [isAuthenticated, tokens]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!tokens?.access) throw new Error('Please log in');

      await updateUserProfile(tokens.access, profileForm, avatarFile || undefined);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      await loadProfile(); // Reload to get updated data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!tokens?.access) throw new Error('Please log in');

      if (editingAddress) {
        await updateUserAddress(tokens.access, editingAddress.id, addressForm);
        toast({
          title: "Success",
          description: "Address updated successfully",
        });
      } else {
        await createUserAddress(tokens.access, addressForm);
        toast({
          title: "Success",
          description: "Address created successfully",
        });
      }

      setShowAddressDialog(false);
      setEditingAddress(null);
      resetAddressForm();
      await loadAddresses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    try {
      if (!tokens?.access) throw new Error('Please log in');

      await deleteUserAddress(tokens.access, addressId);
      toast({
        title: "Success",
        description: "Address deleted successfully",
      });
      await loadAddresses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    try {
      if (!tokens?.access) throw new Error('Please log in');

      await setDefaultAddress(tokens.access, addressId);
      toast({
        title: "Success",
        description: "Default address updated",
      });
      await loadAddresses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      address_type: address.address_type,
      street_address: address.street_address,
      apartment_number: address.apartment_number || '',
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
      country: address.country,
      is_default: address.is_default,
    });
    setShowAddressDialog(true);
  };

  const resetAddressForm = () => {
    setAddressForm({
      address_type: 'home',
      street_address: '',
      apartment_number: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'United States',
      is_default: false,
    } as AddressFormData);
  };

  const openAddAddress = () => {
    setEditingAddress(null);
    resetAddressForm();
    setShowAddressDialog(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <p className="text-gray-600">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information and addresses</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Addresses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      {profile?.avatar ? (
                        <img 
                          src={profile.avatar} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full object-cover" 
                        />
                      ) : (
                        <User className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <Label htmlFor="avatar">Profile Picture</Label>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Account Info (read-only) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Username</Label>
                      <Input value={user?.username || ''} disabled />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={user?.email || ''} disabled />
                    </div>
                  </div>

                  {/* Editable Profile Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={profileForm.first_name}
                        onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={profileForm.last_name}
                        onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={profileForm.date_of_birth}
                        onChange={(e) => setProfileForm({...profileForm, date_of_birth: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={profileForm.phone_number}
                        onChange={(e) => setProfileForm({...profileForm, phone_number: e.target.value})}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                      placeholder="Tell us a little about yourself..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Your Addresses</h3>
                  <p className="text-gray-600">Manage your shipping and billing addresses</p>
                </div>
                <Button onClick={openAddAddress}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </div>

              <div className="grid gap-4">
                {addresses.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <MapPin className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No addresses yet</h3>
                      <p className="text-gray-600 text-center mb-4">
                        Add your first address to make checkout easier
                      </p>
                      <Button onClick={openAddAddress}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  addresses.map((address) => {
                    // Ensure we have a valid icon component
                    const IconComponent = addressTypeIcons[address.address_type] || MoreHorizontal;
                    // Ensure we have a valid label
                    const addressLabel = addressTypeLabels[address.address_type] || address.address_type;
                    
                    return (
                      <Card key={address.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                              <IconComponent className="h-5 w-5 text-gray-500 mt-1" />
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">
                                    {addressLabel}
                                  </h4>
                                  {address.is_default && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      <Star className="h-3 w-3" />
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-gray-600">
                                  {address.street_address}
                                  {address.apartment_number && `, ${address.apartment_number}`}
                                </p>
                                <p className="text-gray-600">
                                  {address.city}, {address.state} {address.zip_code}
                                </p>
                                <p className="text-gray-600">{address.country}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {!address.is_default && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSetDefaultAddress(address.id)}
                                >
                                  Set Default
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditAddress(address)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAddress(address.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Address Dialog */}
        <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
              <DialogDescription>
                {editingAddress 
                  ? 'Update your address information' 
                  : 'Add a new address to your account'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div>
                <Label htmlFor="address_type">Address Type</Label>
                <Select 
                  value={addressForm.address_type} 
                  onValueChange={(value: 'home' | 'work' | 'billing' | 'shipping' | 'other') => 
                    setAddressForm({...addressForm, address_type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="street_address">Street Address</Label>
                <Input
                  id="street_address"
                  value={addressForm.street_address}
                  onChange={(e) => setAddressForm({...addressForm, street_address: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="apartment_number">Apartment/Unit (Optional)</Label>
                <Input
                  id="apartment_number"
                  value={addressForm.apartment_number}
                  onChange={(e) => setAddressForm({...addressForm, apartment_number: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={addressForm.zip_code}
                    onChange={(e) => setAddressForm({...addressForm, zip_code: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({...addressForm, is_default: e.target.checked})}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_default">Set as default address</Label>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddressDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : (editingAddress ? "Update" : "Add")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}