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
} from "@/components/ui/dialog";
import { 
  User, 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Home,
  Building,
  CreditCard,
  Truck,
  MoreHorizontal,
  Camera,
  LogOut,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  getUserProfile, 
  updateUserProfile, 
  getUserAddresses, 
  createUserAddress, 
  updateUserAddress, 
  deleteUserAddress,
  setDefaultAddress 
} from "@/lib/api";

const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  return `${baseUrl.replace("/api", "")}${imagePath}`;
};

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
  const { isAuthenticated, tokens, user: authUser, updateUser, logout } = useAuth();
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

      const response = await updateUserProfile(tokens.access, profileForm, avatarFile || undefined);
      
      // Update AuthContext with new phone number if user data is returned
      if (response.data?.user) {
        updateUser(response.data.user);
      }
      
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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold mb-4">Please log in</h1>
            <p className="text-muted-foreground mb-8 text-lg">You need to be logged in to view your profile.</p>
            <Button size="lg" onClick={() => window.location.href = '/login'}>Log In</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="profile" className="grid md:grid-cols-[280px_1fr] gap-8 lg:gap-16">
            {/* Sidebar Navigation */}
            <div className="space-y-8">
              <div className="px-2">
                <h1 className="text-3xl font-serif font-bold">Account</h1>
                <p className="text-muted-foreground mt-2">Manage your personal details and preferences.</p>
              </div>

              {/* Mobile Navigation: Horizontal Scroll */}
              <div className="md:hidden w-full overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                  <TabsList className="flex w-max h-auto bg-transparent p-0 space-x-2">
                  <TabsTrigger 
                    value="profile" 
                    className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border border-border transition-all"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger 
                    value="addresses" 
                    className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full border border-border transition-all"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Addresses
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Desktop Navigation: Vertical List */}
              <TabsList className="hidden md:flex flex-col h-auto w-full bg-transparent p-0 space-y-2">
                <TabsTrigger 
                  value="profile" 
                  className="w-full justify-start px-4 py-3 text-base data-[state=active]:bg-secondary/50 data-[state=active]:text-primary data-[state=active]:font-medium rounded-lg transition-all hover:bg-secondary/30"
                >
                  <User className="h-5 w-5 mr-3" />
                  Profile Information
                </TabsTrigger>
                <TabsTrigger 
                  value="addresses" 
                  className="w-full justify-start px-4 py-3 text-base data-[state=active]:bg-secondary/50 data-[state=active]:text-primary data-[state=active]:font-medium rounded-lg transition-all hover:bg-secondary/30"
                >
                  <MapPin className="h-5 w-5 mr-3" />
                  Saved Addresses
                </TabsTrigger>
              </TabsList>

              <div className="hidden md:block mt-8 pt-8 border-t px-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                  onClick={logout}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </Button>
              </div>
              
              {/* Mobile Sign Out */}
              <div className="md:hidden mt-6 border-t pt-6">
                  <Button 
                  variant="outline" 
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Main Content Column */}
            <div className="min-w-0">
              <TabsContent value="profile" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="font-serif text-2xl">Personal Information</CardTitle>
                    <CardDescription className="text-base">Update your personal details and profile picture</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <form onSubmit={handleProfileSubmit} className="space-y-8">
                      {/* Avatar Section */}
                      <div className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-secondary/10 rounded-xl border border-border/50">
                        <div className="relative group shrink-0">
                          <div className="w-28 h-28 rounded-full bg-background flex items-center justify-center overflow-hidden border-4 border-background shadow-sm">
                            {profile?.avatar ? (
                              <img 
                                src={getImageUrl(profile.avatar)} 
                                alt="Profile" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <User className="h-12 w-12 text-muted-foreground/50" />
                            )}
                          </div>
                          <label 
                            htmlFor="avatar" 
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                          >
                            <Camera className="h-8 w-8 text-white" />
                          </label>
                          <Input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </div>
                        <div className="text-center sm:text-left space-y-1">
                          <h3 className="font-serif text-xl font-bold">{user?.username}</h3>
                          <p className="text-muted-foreground">{user?.email}</p>
                          <Button variant="outline" size="sm" className="mt-2" asChild>
                            <label htmlFor="avatar" className="cursor-pointer">
                              Change Photo
                            </label>
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="first_name">First Name</Label>
                          <Input
                            id="first_name"
                            value={profileForm.first_name}
                            onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input
                            id="last_name"
                            value={profileForm.last_name}
                            onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date_of_birth">Date of Birth</Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={profileForm.date_of_birth}
                            onChange={(e) => setProfileForm({...profileForm, date_of_birth: e.target.value})}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone_number">Phone Number</Label>
                          <Input
                            id="phone_number"
                            value={profileForm.phone_number}
                            onChange={(e) => setProfileForm({...profileForm, phone_number: e.target.value})}
                            placeholder="+1 (555) 123-4567"
                            className="h-11"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={profileForm.bio}
                            onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                            placeholder="Tell us a little about yourself..."
                            rows={4}
                            className="resize-none min-h-[120px]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={saving} size="lg" className="min-w-[140px]">
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="addresses" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold">Your Addresses</h2>
                    <p className="text-muted-foreground mt-1">Manage shipping and billing locations</p>
                  </div>
                  <Button onClick={openAddAddress} className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Address
                  </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {addresses.length === 0 ? (
                    <Card className="col-span-2 border-dashed bg-secondary/5">
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                          <MapPin className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No addresses saved</h3>
                        <p className="text-muted-foreground mb-6 text-center max-w-sm">
                          Add an address to speed up checkout and manage your delivery locations.
                        </p>
                        <Button variant="outline" onClick={openAddAddress}>
                          Add Address
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    addresses.map((address) => {
                      const IconComponent = addressTypeIcons[address.address_type] || MoreHorizontal;
                      const addressLabel = addressTypeLabels[address.address_type] || address.address_type;
                      
                      return (
                        <Card key={address.id} className="relative group overflow-hidden transition-all hover:shadow-md border-border/60 hover:border-primary/20">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/5 rounded-full">
                                  <IconComponent className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold capitalize">{addressLabel}</span>
                                    {address.is_default && (
                                      <Badge variant="secondary" className="text-[10px] px-2 h-5 font-normal">Default</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md p-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:text-primary"
                                  onClick={() => openEditAddress(address)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteAddress(address.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 text-sm text-muted-foreground pl-[3.25rem]">
                              <p className="text-foreground font-medium text-base">{address.street_address}</p>
                              {address.apartment_number && <p>{address.apartment_number}</p>}
                              <p>{address.city}, {address.state} {address.zip_code}</p>
                              <p>{address.country}</p>
                            </div>

                            {!address.is_default && (
                              <div className="mt-4 pl-[3.25rem]">
                                <Button
                                  variant="link"
                                  className="px-0 h-auto text-xs text-primary/80 hover:text-primary"
                                  onClick={() => handleSetDefaultAddress(address.id)}
                                >
                                  Set as default
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Address Dialog */}
        <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
              <DialogDescription>
                {editingAddress 
                  ? 'Update your address details below.' 
                  : 'Enter your delivery information.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddressSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="address_type">Address Type</Label>
                  <Select 
                    value={addressForm.address_type} 
                    onValueChange={(value: 'home' | 'work' | 'billing' | 'shipping' | 'other') => 
                      setAddressForm({...addressForm, address_type: value})
                    }
                  >
                    <SelectTrigger className="h-11">
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

                <div className="col-span-2">
                  <Label htmlFor="street_address">Street Address</Label>
                  <Input
                    id="street_address"
                    value={addressForm.street_address}
                    onChange={(e) => setAddressForm({...addressForm, street_address: e.target.value})}
                    required
                    placeholder="123 Main St"
                    className="h-11"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="apartment_number">Apartment/Unit (Optional)</Label>
                  <Input
                    id="apartment_number"
                    value={addressForm.apartment_number}
                    onChange={(e) => setAddressForm({...addressForm, apartment_number: e.target.value})}
                    placeholder="Apt 4B"
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                    required
                    className="h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={addressForm.zip_code}
                    onChange={(e) => setAddressForm({...addressForm, zip_code: e.target.value})}
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({...addressForm, is_default: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                />
                <Label htmlFor="is_default" className="font-normal cursor-pointer">Set as default address</Label>
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddressDialog(false)}
                  className="h-11"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="h-11 min-w-[120px]">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    editingAddress ? "Update Address" : "Add Address"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
      
      <Footer />
    </div>
  );
}