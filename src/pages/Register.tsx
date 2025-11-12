import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { registerUser, checkUsername } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameCheckTimer = useRef<number | null>(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Debounced username availability check
  useEffect(() => {
    const username = formData.username?.trim();

    // reset if empty or too short
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      if (usernameCheckTimer.current) {
        window.clearTimeout(usernameCheckTimer.current);
        usernameCheckTimer.current = null;
      }
      return;
    }

    setCheckingUsername(true);
    if (usernameCheckTimer.current) {
      window.clearTimeout(usernameCheckTimer.current);
    }

    // debounce 500ms
    usernameCheckTimer.current = window.setTimeout(async () => {
      try {
        const res = await checkUsername(username);
        setUsernameAvailable(res.available);
      } catch (e) {
        // on error, don't block user; clear availability
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => {
      if (usernameCheckTimer.current) {
        window.clearTimeout(usernameCheckTimer.current);
        usernameCheckTimer.current = null;
      }
    };
  }, [formData.username]);

  const validateForm = (): string | null => {
    if (!formData.username.trim()) {
      return "Username is required";
    }
    if (formData.username.trim().length < 3) {
      return "Username must be at least 3 characters";
    }
    if (usernameAvailable === false) {
      return "Username is already taken";
    }
    if (!formData.email.trim()) {
      return "Email is required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "Please enter a valid email address";
    }
    if (!formData.password) {
      return "Password is required";
    }
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
    if (!termsAgreed) {
      return "You must agree to the terms and conditions";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast({ variant: "destructive", title: "Invalid input", description: validationError });
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser(
        formData.username,
        formData.email,
        formData.password
      );

      if (response.data?.user && response.data?.tokens) {
        // On registration we persist session by default
        login(response.data.user, response.data.tokens, true);

        toast({
          title: "Success",
          description: "Account created successfully! Welcome to NOTED STORE!",
        });

        // Use setTimeout to ensure state is updated before navigation
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 800);
      } else {
        const msg = "Registration failed. Please try again.";
        setError(msg);
        toast({ variant: "destructive", title: "Registration Failed", description: msg });
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      setLoading(false);

      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block mb-8">
            <h1 className="text-3xl font-serif font-bold tracking-tight">NOTED STORE</h1>
          </Link>
          <h2 className="text-2xl font-medium mb-2">Create your account</h2>
          <p className="text-muted-foreground">Join us for exclusive collections</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            {/* errors are shown via the global toast (bottom-right) */}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="john_doe"
                value={formData.username}
                onChange={handleInputChange}
                disabled={loading}
                required
                className={usernameAvailable === false ? 'border-destructive focus:border-destructive' : ''}
              />
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum 3 characters, letters, numbers, and underscores only
            </p>
            {usernameAvailable === false && (
              <div className="mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-destructive" />
                <p className="text-xs text-destructive">Username already taken</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum 6 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={termsAgreed}
              onCheckedChange={(checked) => setTermsAgreed(checked as boolean)}
              disabled={loading}
              required
            />
            <label
              htmlFor="terms"
              className="text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I agree to the{" "}
              <a href="#" className="text-accent hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-accent hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>

          <Button
            type="submit"
            className="w-full h-11"
            disabled={loading || usernameAvailable === false}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
