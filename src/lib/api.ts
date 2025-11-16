/**
 * API Service Layer
 * Handles all authentication-related API calls to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: "manager" | "customer";
  phone_number?: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  data?: {
    user: User;
    tokens: AuthTokens;
  };
}

export interface ErrorResponse {
  status: string;
  message: string;
}

/**
 * Register a new user
 */
export async function registerUser(
  username: string,
  email: string,
  password: string,
  role: "customer" | "manager" = "customer"
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      username,
      email,
      password,
      role,
    }),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message || "Registration failed");
  }

  return response.json();
}

/**
 * Admin user management (manager-only endpoints)
 */
export async function adminListUsers(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/admin/users/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch users' }));
    throw new Error(err.message || 'Failed to fetch users');
  }

  return response.json();
}

export async function adminUpdateUser(accessToken: string, id: number, body: Record<string, any>) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to update user' }));
    throw new Error(err.message || 'Failed to update user');
  }

  return response.json();
}

export async function adminDeleteUser(accessToken: string, id: number) {
  const response = await fetch(`${API_BASE_URL}/admin/users/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to delete user' }));
    throw new Error(err.message || 'Failed to delete user');
  }

  return response.json();
}

/**
 * Login user with username and password
 */
export async function loginUser(
  username: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      username,
      password,
    }),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message || "Login failed");
  }

  return response.json();
}

/**
 * Reset password for a user
 */
export async function resetPassword(
  usernameOrEmail: string,
  newPassword: string
): Promise<AuthResponse> {
  const body: Record<string, string> = {
    new_password: newPassword,
  };

  if (usernameOrEmail.includes("@")) {
    body.email = usernameOrEmail;
  } else {
    body.username = usernameOrEmail;
  }

  const response = await fetch(`${API_BASE_URL}/reset-password/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message || "Password reset failed");
  }

  return response.json();
}

/**
 * Verify JWT token validity
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/verify-token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access: string }> {
  const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  return response.json();
}

/**
 * Request OTP for password reset
 */
export async function requestPasswordResetOTP(
  usernameOrEmail: string
): Promise<{
  status: string;
  message: string;
  data: { email_masked: string };
}> {
  const body: Record<string, string> = {};

  if (usernameOrEmail.includes("@")) {
    body.email = usernameOrEmail;
  } else {
    body.username = usernameOrEmail;
  }

  const response = await fetch(`${API_BASE_URL}/request-otp/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message || "Failed to request OTP");
  }

  return response.json();
}

/**
 * Verify OTP code
 */
export async function verifyPasswordOTP(
  usernameOrEmail: string,
  otp: string
): Promise<{ status: string; message: string }> {
  const body: Record<string, string> = { otp };

  if (usernameOrEmail.includes("@")) {
    body.email = usernameOrEmail;
  } else {
    body.username = usernameOrEmail;
  }

  const response = await fetch(`${API_BASE_URL}/verify-otp/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message || "Invalid or expired OTP");
  }

  return response.json();
}

/**
 * Reset password using OTP
 */
export async function resetPasswordWithOTP(
  usernameOrEmail: string,
  otp: string,
  newPassword: string
): Promise<{ status: string; message: string }> {
  const body: Record<string, string> = { otp, new_password: newPassword };

  if (usernameOrEmail.includes("@")) {
    body.email = usernameOrEmail;
  } else {
    body.username = usernameOrEmail;
  }

  const response = await fetch(`${API_BASE_URL}/reset-password-otp/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message || "Password reset failed");
  }

  return response.json();
}

/**
 * Check username availability
 */
export async function checkUsername(
  username: string
): Promise<{ available: boolean }>
{
  const url = `${API_BASE_URL}/check-username/?username=${encodeURIComponent(username)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json().catch(() => ({ status: 'error', message: 'Failed to check username' } as ErrorResponse));
    throw new Error(error.message || "Username check failed");
  }

  return response.json();
}

/**
 * Admin Dashboard Stats
 */
export async function getAdminDashboardStats(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch stats' }));
    throw new Error(err.message || 'Failed to fetch stats');
  }

  return response.json();
}

/**
 * Admin Orders List with filters
 */
export async function getAdminOrders(
  accessToken: string,
  status?: string,
  limit: number = 10,
  offset: number = 0
) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_BASE_URL}/admin/orders/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch orders' }));
    throw new Error(err.message || 'Failed to fetch orders');
  }

  return response.json();
}

/**
 * Admin Products List with filters
 */
export async function getAdminProducts(
  accessToken: string,
  category?: string,
  search?: string,
  limit: number = 10,
  offset: number = 0
) {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (search) params.append('search', search);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_BASE_URL}/admin/products/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch products' }));
    throw new Error(err.message || 'Failed to fetch products');
  }

  return response.json();
}

/**
 * Admin Sales Chart Data
 */
export async function getAdminSalesChart(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/admin/sales-chart/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch chart data' }));
    throw new Error(err.message || 'Failed to fetch chart data');
  }

  return response.json();
}

/**
 * Admin Categories CRUD
 */
export async function getAdminCategories(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/admin/categories/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch categories' }));
    throw new Error(err.message || 'Failed to fetch categories');
  }

  return response.json();
}

export async function getAdminAllCategories(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/admin/categories-all/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch categories' }));
    throw new Error(err.message || 'Failed to fetch categories');
  }

  return response.json();
}

export async function createAdminCategory(accessToken: string, name: string, description: string) {
  const response = await fetch(`${API_BASE_URL}/admin/categories/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, description }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to create category' }));
    throw new Error(err.message || 'Failed to create category');
  }

  return response.json();
}

export async function updateAdminCategory(accessToken: string, id: number, name: string, description: string) {
  const response = await fetch(`${API_BASE_URL}/admin/categories/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, description }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to update category' }));
    throw new Error(err.message || 'Failed to update category');
  }

  return response.json();
}

export async function deleteAdminCategory(accessToken: string, id: number) {
  const response = await fetch(`${API_BASE_URL}/admin/categories/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to delete category' }));
    throw new Error(err.message || 'Failed to delete category');
  }

  return response.json();
}

/**
 * Admin Products CRUD
 */
export async function createAdminProduct(
  accessToken: string,
  name: string,
  description: string,
  price: number,
  stock: number,
  category_id: number | null,
  image?: File,
  attributes?: Record<number, string>
) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', price.toString());
  formData.append('stock', stock.toString());
  if (category_id) formData.append('category_id', category_id.toString());
  if (image) formData.append('image', image);
  
  // Add attributes with attr_ prefix
  if (attributes) {
    console.log('=== DEBUG: createAdminProduct API ===');
    console.log('Attributes received:', attributes);
    Object.entries(attributes).forEach(([attrId, value]) => {
      console.log(`Processing attribute ${attrId}: "${value}" (trimmed: "${value.trim()}")`);
      if (value.trim()) {
        formData.append(`attr_${attrId}`, value);
        console.log(`✓ Added attr_${attrId} = "${value}"`);
      } else {
        console.log(`✗ Skipped empty attribute ${attrId}`);
      }
    });
  } else {
    console.log('No attributes provided to API');
  }

  const response = await fetch(`${API_BASE_URL}/admin/products/create/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to create product' }));
    throw new Error(err.message || 'Failed to create product');
  }

  return response.json();
}

export async function updateAdminProduct(
  accessToken: string,
  id: number,
  updates: Record<string, any>,
  image?: File,
  attributes?: Record<number, string>
) {
  const formData = new FormData();
  Object.keys(updates).forEach((key) => {
    formData.append(key, updates[key]);
  });
  if (image) formData.append('image', image);
  
  // Add attributes with attr_ prefix
  if (attributes) {
    Object.entries(attributes).forEach(([attrId, value]) => {
      if (value.trim()) {
        formData.append(`attr_${attrId}`, value);
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}/admin/products/${id}/`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to update product' }));
    throw new Error(err.message || 'Failed to update product');
  }

  return response.json();
}

export async function getAdminProductDetail(accessToken: string, id: number) {
  const response = await fetch(`${API_BASE_URL}/admin/products/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch product' }));
    throw new Error(err.message || 'Failed to fetch product');
  }

  return response.json();
}

export async function deleteAdminProduct(accessToken: string, id: number) {
  const response = await fetch(`${API_BASE_URL}/admin/products/${id}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to delete product' }));
    throw new Error(err.message || 'Failed to delete product');
  }

  return response.json();
}

/**
 * Admin Orders Detail
 */
export async function getAdminOrderDetail(accessToken: string, id: number) {
  const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch order' }));
    throw new Error(err.message || 'Failed to fetch order');
  }

  return response.json();
}

export async function updateAdminOrder(accessToken: string, id: number, status: string, awbNumber?: string, courierPartner?: string) {
  const body: any = { status };
  
  if (awbNumber) {
    body.awb_number = awbNumber;
  }
  if (courierPartner) {
    body.courier_partner = courierPartner;
  }
  
  const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to update order' }));
    throw new Error(err.message || 'Failed to update order');
  }

  const data = await response.json();
  
  // Check if the API returned an error in the response body
  if (data.status === 'error') {
    throw new Error(data.message || 'Failed to update order');
  }

  return data;
}

export async function getCourierPartners() {
  const response = await fetch(`${API_BASE_URL}/orders/courier-partners/`);

  if (!response.ok) {
    throw new Error('Failed to fetch courier partners');
  }

  return response.json();
}

/**
 * Public Products API (no auth required)
 */
export async function getPublicProducts(
  page = 1, 
  limit = 12, 
  categoryId?: number, 
  search?: string, 
  attributeFilters?: Record<number, string>,
  minPrice?: string,
  maxPrice?: string
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (categoryId) params.append('category_id', categoryId.toString());
  if (search) params.append('search', search);
  if (minPrice && minPrice.trim()) params.append('min_price', minPrice.trim());
  if (maxPrice && maxPrice.trim()) params.append('max_price', maxPrice.trim());
  
  // Add attribute filters (e.g., attr_1=Long Sleeve&attr_2=Cotton)
  if (attributeFilters) {
    Object.entries(attributeFilters).forEach(([attrId, value]) => {
      if (value.trim()) {
        params.append(`attr_${attrId}`, value);
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}/products/?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch products' }));
    throw new Error(err.message || 'Failed to fetch products');
  }

  return response.json();
}

export async function getFeaturedProducts(limit = 8) {
  const response = await fetch(`${API_BASE_URL}/products/featured/?limit=${limit}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch featured products' }));
    throw new Error(err.message || 'Failed to fetch featured products');
  }

  return response.json();
}

export async function getPublicCategories() {
  const response = await fetch(`${API_BASE_URL}/products/categories/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch categories' }));
    throw new Error(err.message || 'Failed to fetch categories');
  }

  return response.json();
}

/**
 * Public: Get category attributes for filtering
 */
export async function getPublicCategoryAttributes(categoryId: number) {
  const response = await fetch(`${API_BASE_URL}/products/categories/${categoryId}/attributes/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch category attributes' }));
    throw new Error(err.message || 'Failed to fetch category attributes');
  }

  return response.json();
}

export async function getPublicProductDetail(productId: number) {
  const response = await fetch(`${API_BASE_URL}/products/${productId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch product details' }));
    throw new Error(err.message || 'Failed to fetch product details');
  }

  return response.json();
}

/**
 * Admin: Update product variants
 */
export async function updateProductVariants(
  accessToken: string,
  productId: number,
  variants: Array<{ size: string; stock: number }>
) {
  const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/variants/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ variants }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to update variants' }));
    throw new Error(err.message || 'Failed to update variants');
  }

  return response.json();
}

/**
 * Admin: Get category attributes
 */
export async function getCategoryAttributes(accessToken: string, categoryId: number) {
  const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}/attributes/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch category attributes' }));
    throw new Error(err.message || 'Failed to fetch category attributes');
  }

  return response.json();
}

/**
 * Admin: Create category attribute
 */
export async function createCategoryAttribute(
  accessToken: string, 
  categoryId: number, 
  data: {
    name: string;
    field_type: 'text' | 'number' | 'select';
    is_required: boolean;
    options?: string[];
  }
) {
  const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}/attributes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to create category attribute' }));
    throw new Error(err.message || 'Failed to create category attribute');
  }

  return response.json();
}

/**
 * Admin: Delete category attribute
 */
export async function deleteCategoryAttribute(accessToken: string, categoryId: number, attributeId: number) {
  const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}/attributes/${attributeId}/delete/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to delete category attribute' }));
    throw new Error(err.message || 'Failed to delete category attribute');
  }

  return response.json();
}

// User Profile API Functions

/**
 * Get user profile
 */
export async function getUserProfile(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/profile/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch profile' }));
    throw new Error(err.message || 'Failed to fetch profile');
  }

  return response.json();
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  accessToken: string,
  profileData: {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    phone_number?: string;
    bio?: string;
  },
  avatar?: File
) {
  // Use FormData if avatar is provided, otherwise JSON
  if (avatar) {
    const formData = new FormData();
    Object.entries(profileData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    formData.append('avatar', avatar);

    const response = await fetch(`${API_BASE_URL}/profile/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Failed to update profile' }));
      throw new Error(err.message || 'Failed to update profile');
    }

    return response.json();
  } else {
    const response = await fetch(`${API_BASE_URL}/profile/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Failed to update profile' }));
      throw new Error(err.message || 'Failed to update profile');
    }

    return response.json();
  }
}

/**
 * Get user addresses
 */
export async function getUserAddresses(accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/addresses/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch addresses' }));
    throw new Error(err.message || 'Failed to fetch addresses');
  }

  return response.json();
}

/**
 * Create new address
 */
export async function createUserAddress(
  accessToken: string,
  addressData: {
    address_type: 'home' | 'work' | 'billing' | 'shipping' | 'other';
    street_address: string;
    apartment_number?: string;
    city: string;
    state: string;
    zip_code: string;
    country?: string;
    is_default?: boolean;
  }
) {
  const response = await fetch(`${API_BASE_URL}/addresses/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(addressData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to create address' }));
    throw new Error(err.message || 'Failed to create address');
  }

  return response.json();
}

/**
 * Get specific address
 */
export async function getUserAddress(accessToken: string, addressId: number) {
  const response = await fetch(`${API_BASE_URL}/addresses/${addressId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to fetch address' }));
    throw new Error(err.message || 'Failed to fetch address');
  }

  return response.json();
}

/**
 * Update address
 */
export async function updateUserAddress(
  accessToken: string,
  addressId: number,
  addressData: Partial<{
    address_type: 'home' | 'work' | 'billing' | 'shipping' | 'other';
    street_address: string;
    apartment_number: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    is_default: boolean;
  }>
) {
  const response = await fetch(`${API_BASE_URL}/addresses/${addressId}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(addressData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to update address' }));
    throw new Error(err.message || 'Failed to update address');
  }

  return response.json();
}

/**
 * Delete address
 */
export async function deleteUserAddress(accessToken: string, addressId: number) {
  const response = await fetch(`${API_BASE_URL}/addresses/${addressId}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to delete address' }));
    throw new Error(err.message || 'Failed to delete address');
  }

  return response.json();
}

/**
 * Set default address
 */
export async function setDefaultAddress(accessToken: string, addressId: number) {
  const response = await fetch(`${API_BASE_URL}/addresses/${addressId}/set-default/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to set default address' }));
    throw new Error(err.message || 'Failed to set default address');
  }

  return response.json();
}
