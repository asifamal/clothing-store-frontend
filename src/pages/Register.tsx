import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from "lucide-react";
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

    usernameCheckTimer.current = window.setTimeout(async () => {
      try {
        const res = await checkUsername(username);
        setUsernameAvailable(res.available);
      } catch (e) {
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
    if (!formData.username.trim()) return "Username is required";
    if (formData.username.trim().length < 3) return "Username must be at least 3 characters";
    if (usernameAvailable === false) return "Username is already taken";
    if (!formData.email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Please enter a valid email address";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 6) return "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    if (!termsAgreed) return "You must agree to the terms and conditions";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
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
        login(response.data.user, response.data.tokens, true);

        toast({
          title: "Welcome to NOTED.",
          description: "Your account has been created successfully.",
        });

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 800);
      } else {
        toast({ variant: "destructive", title: "Registration Failed", description: "Could not create account. Please try again." });
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block w-1/2 relative bg-black">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-16 text-white">
          <h2 className="text-4xl font-serif font-bold mb-4">Join the Community</h2>
          <p className="text-lg text-white/80 max-w-md">
            Be the first to know about new arrivals, exclusive offers, and fashion inspiration.
          </p>
        </div>
        <div className="absolute top-8 left-8">
          <Link to="/" className="text-white font-serif text-2xl font-bold tracking-wider">
            NOTED.
          </Link>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 sm:px-12 lg:px-24 bg-background relative py-12 overflow-y-auto">
        <div className="absolute top-8 right-8 lg:hidden">
           <Link to="/" className="font-serif text-2xl font-bold tracking-wider">
            NOTED.
          </Link>
        </div>

        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-serif font-bold tracking-tight mb-2">Create Account</h1>
            <p className="text-muted-foreground">
              Enter your details to create your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                  className={`h-11 ${usernameAvailable === false ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {checkingUsername && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {usernameAvailable === false && (
                <div className="flex items-center gap-1 text-destructive text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Username already taken</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                required
                className="h-11"
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
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={termsAgreed}
                onCheckedChange={(checked) => setTermsAgreed(checked as boolean)}
                disabled={loading}
                required
                className="mt-1"
              />
              <label
                htmlFor="terms"
                className="text-sm leading-relaxed text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the{" "}
                <a href="#" className="text-primary hover:underline font-medium">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={loading || usernameAvailable === false}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
