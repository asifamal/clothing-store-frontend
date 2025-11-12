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
  password: string
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
      role: "customer",
    }),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message || "Registration failed");
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
