import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Mail, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { resetPassword } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [stage, setStage] = useState<"enter-username" | "reset-password" | "success">(
    "enter-username"
  );
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const handleSubmitUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!usernameOrEmail.trim()) {
      const msg = "Please enter your username or email";
      setError(msg);
      toast({ variant: "destructive", title: "Input required", description: msg });
      return;
    }

    setStage("reset-password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!newPassword) {
        const msg = "Please enter a new password";
        setError(msg);
        toast({ variant: "destructive", title: "Input required", description: msg });
        return;
      }

      if (newPassword.length < 6) {
        const msg = "Password must be at least 6 characters";
        setError(msg);
        toast({ variant: "destructive", title: "Invalid password", description: msg });
        return;
      }

      if (newPassword !== confirmPassword) {
        const msg = "Passwords do not match";
        setError(msg);
        toast({ variant: "destructive", title: "Mismatch", description: msg });
        return;
      }

      const response = await resetPassword(usernameOrEmail, newPassword);

      if (response.status === "success") {
        setStage("success");

        toast({
          title: "Success",
          description: "Your password has been reset successfully!",
        });
      } else {
        setError(response.message || "Password reset failed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Password reset failed";
      setError(errorMessage);

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStage("enter-username");
    setUsernameOrEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block mb-8">
            <h1 className="text-3xl font-serif font-bold tracking-tight">NOTED STORE</h1>
          </Link>
          <h2 className="text-2xl font-medium mb-2">Reset your password</h2>
          <p className="text-muted-foreground">
            {stage === "success"
              ? "Your password has been reset"
              : stage === "reset-password"
                ? "Enter your new password"
                : "Enter your username or email to reset your password"}
          </p>
        </div>

        {stage === "enter-username" ? (
          <form onSubmit={handleSubmitUsername} className="space-y-6">
                {/* errors are shown via the global toast (bottom-right) */}

            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail">Username or Email</Label>
              <Input
                id="usernameOrEmail"
                type="text"
                placeholder="john_doe or you@example.com"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue"
              )}
            </Button>

            <Link
              to="/login"
              className="inline-flex items-center text-sm text-accent hover:underline transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to sign in
            </Link>
          </form>
        ) : stage === "reset-password" ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* page-level errors are shown via the global toast (bottom-right) */}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center text-sm text-accent hover:underline transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Change username/email
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
            </div>
            <Link to="/login" className="block">
              <Button className="w-full h-11">
                Return to sign in
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
