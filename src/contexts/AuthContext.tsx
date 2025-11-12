import React, { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import { User, AuthTokens } from "@/lib/api";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  // `remember` determines whether auth is persisted to localStorage (true)
  // or to sessionStorage (false). If omitted, defaults to true.
  login: (user: User, tokens: AuthTokens, remember?: boolean) => void;
  logout: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: "LOGIN"; user: User; tokens: AuthTokens }
  | { type: "LOGOUT" }
  | { type: "SET_ERROR"; error: string }
  | { type: "CLEAR_ERROR" }
  | { type: "UPDATE_USER"; user: User }
  | { type: "RESTORE_SESSION"; user: User; tokens: AuthTokens }
  | { type: "INIT_COMPLETE" };

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        isAuthenticated: true,
        user: action.user,
        tokens: action.tokens,
        loading: false,
        error: null,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.error,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.user,
      };
    case "RESTORE_SESSION":
      return {
        ...state,
        isAuthenticated: true,
        user: action.user,
        tokens: action.tokens,
        loading: false,
        error: null,
      };
    case "INIT_COMPLETE":
      return {
        ...state,
        loading: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session from localStorage first (persistent), then sessionStorage.
  // This allows support for "remember me" (localStorage) and non-remembered
  // sessions (sessionStorage).
  useEffect(() => {
    const restore = (raw: string | null) => {
      if (!raw) return false;
      try {
        const { user, tokens } = JSON.parse(raw);
        if (user && tokens) {
          dispatch({ type: "RESTORE_SESSION", user, tokens });
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    };

    const local = localStorage.getItem("auth");
    if (restore(local)) return;

    const session = sessionStorage.getItem("auth");
    if (restore(session)) return;

    // No session found — mark initialization complete to set loading to false
    dispatch({ type: "INIT_COMPLETE" });
  }, []);

  const login = useCallback((user: User, tokens: AuthTokens, remember = true) => {
    const authData = { user, tokens };
    try {
      if (remember) {
        localStorage.setItem("auth", JSON.stringify(authData));
      } else {
        // sessionStorage will be cleared when the browser/tab is closed
        sessionStorage.setItem("auth", JSON.stringify(authData));
      }
    } catch (e) {
      // Fallback to localStorage on quota errors — still attempt to log in
      localStorage.setItem("auth", JSON.stringify(authData));
    }

    dispatch({ type: "LOGIN", user, tokens });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth");
    sessionStorage.removeItem("auth");
    dispatch({ type: "LOGOUT" });
  }, []);

  const setError = useCallback((error: string | null) => {
    if (error) {
      dispatch({ type: "SET_ERROR", error });
    } else {
      dispatch({ type: "CLEAR_ERROR" });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const updateUser = useCallback((user: User) => {
    dispatch({ type: "UPDATE_USER", user });
    // Update localStorage
    const storedLocal = localStorage.getItem("auth");
    if (storedLocal) {
      const authData = JSON.parse(storedLocal);
      authData.user = user;
      localStorage.setItem("auth", JSON.stringify(authData));
      return;
    }

    const storedSession = sessionStorage.getItem("auth");
    if (storedSession) {
      const authData = JSON.parse(storedSession);
      authData.user = user;
      sessionStorage.setItem("auth", JSON.stringify(authData));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        setError,
        clearError,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
