import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  requestPasswordResetOTP,
  verifyPasswordOTP,
  resetPasswordWithOTP,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type Stage = "enter-email" | "enter-otp" | "reset-password" | "success";

const ForgotPassword = () => {
  const [stage, setStage] = useState<Stage>("enter-email");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailMasked, setEmailMasked] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (otpTimer === 0 && stage === "enter-otp" && emailMasked) {
      setCanResendOtp(true);
    }
  }, [otpTimer, stage, emailMasked]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!usernameOrEmail.trim()) {
        const msg = "Please enter your username or email";
        setError(msg);
        toast({ variant: "destructive", title: "Input required", description: msg });
        setLoading(false);
        return;
      }

      const response = await requestPasswordResetOTP(usernameOrEmail);

      if (response.status === "success") {
        setEmailMasked(response.data.email_masked);
        setStage("enter-otp");
        setOtpTimer(300); // 5 minutes
        setCanResendOtp(false);

        toast({
          title: "OTP Sent",
          description: "Check your email for the one-time password.",
        });
      } else {
        const msg = response.message || "Failed to send OTP";
        setError(msg);
        toast({ variant: "destructive", title: "Error", description: msg });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send OTP";
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

  const handleResendOTP = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await requestPasswordResetOTP(usernameOrEmail);

      if (response.status === "success") {
        setOtpTimer(300); // 5 minutes
        setCanResendOtp(false);
        setOtp("");

        toast({
          title: "OTP Resent",
          description: "Check your email for the new one-time password.",
        });
      } else {
        const msg = response.message || "Failed to resend OTP";
        setError(msg);
        toast({ variant: "destructive", title: "Error", description: msg });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to resend OTP";
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!otp.trim()) {
        const msg = "Please enter the OTP";
        setError(msg);
        toast({ variant: "destructive", title: "Input required", description: msg });
        setLoading(false);
        return;
      }

      if (otp.length !== 6) {
        const msg = "OTP must be 6 digits";
        setError(msg);
        toast({ variant: "destructive", title: "Invalid OTP", description: msg });
        setLoading(false);
        return;
      }

      const response = await verifyPasswordOTP(usernameOrEmail, otp);

      if (response.status === "success") {
        setStage("reset-password");

        toast({
          title: "OTP Verified",
          description: "You can now set your new password.",
        });
      } else {
        const msg = response.message || "Invalid OTP";
        setError(msg);
        toast({ variant: "destructive", title: "Invalid OTP", description: msg });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid or expired OTP";
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!newPassword) {
        const msg = "Please enter a new password";
        setError(msg);
        toast({ variant: "destructive", title: "Input required", description: msg });
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        const msg = "Password must be at least 6 characters";
        setError(msg);
        toast({ variant: "destructive", title: "Invalid password", description: msg });
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        const msg = "Passwords do not match";
        setError(msg);
        toast({ variant: "destructive", title: "Mismatch", description: msg });
        setLoading(false);
        return;
      }

      const response = await resetPasswordWithOTP(
        usernameOrEmail,
        otp,
        newPassword
      );

      if (response.status === "success") {
        setStage("success");

        toast({
          title: "Success",
          description: "Your password has been reset successfully!",
        });

        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      } else {
        const msg = response.message || "Password reset failed";
        setError(msg);
        toast({ variant: "destructive", title: "Error", description: msg });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Password reset failed";
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

  const handleBack = () => {
    if (stage === "enter-otp") {
      setStage("enter-email");
      setOtp("");
      setOtpTimer(0);
      setEmailMasked("");
    } else if (stage === "reset-password") {
      setStage("enter-otp");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block mb-8">
            <h1 className="text-3xl font-serif font-bold tracking-tight">
              NOTED STORE
            </h1>
          </Link>
          <h2 className="text-2xl font-medium mb-2">
            {stage === "success"
              ? "Password Reset Successful"
              : stage === "reset-password"
                ? "Set New Password"
                : stage === "enter-otp"
                  ? "Enter OTP"
                  : "Forgot Password"}
          </h2>
          <p className="text-muted-foreground">
            {stage === "success"
              ? "Your password has been reset. Redirecting to login..."
              : stage === "reset-password"
                ? "Create a strong password"
                : stage === "enter-otp"
                  ? `OTP sent to ${emailMasked}`
                  : "Enter your email to receive a password reset code"}
          </p>
        </div>

        {stage === "success" ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-center text-sm text-muted-foreground">
              Redirecting you to login...
            </p>
          </div>
        ) : stage === "enter-email" ? (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            {/* page-level errors are shown via the global toast (bottom-right) */}

            <div className="space-y-2">
              <Label htmlFor="email">Email or Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="you@example.com or john_doe"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                We'll send you a code to reset your password
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send OTP
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBack}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to sign in
            </Button>
          </form>
        ) : stage === "enter-otp" ? (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {/* page-level errors are shown via the global toast (bottom-right) */}

            <div className="space-y-2">
              <Label htmlFor="otp">One-Time Password</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={loading}
                maxLength={6}
                required
                className="text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Code expires in:{" "}
                <span className="font-semibold text-foreground">
                  {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}
                </span>
              </span>
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendOTP}
              disabled={!canResendOtp || loading}
            >
              {canResendOtp ? "Resend OTP" : `Resend in ${otpTimer}s`}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBack}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
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
                  placeholder="Create a strong password"
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
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
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
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
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

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBack}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
};

export default ForgotPassword;
