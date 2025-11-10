import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Mail } from "lucide-react";

const ResetPassword = () => {
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSent(true);
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
            {emailSent
              ? "Check your email for reset instructions"
              : "Enter your email to receive reset instructions"}
          </p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <Button type="submit" className="w-full h-11">
              Send reset link
            </Button>

            <Link
              to="/login"
              className="inline-flex items-center text-sm text-accent hover:underline transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to sign in
            </Link>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-accent/10 p-4">
                <Mail className="h-8 w-8 text-accent" />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">
                We've sent password reset instructions to your email address.
                Please check your inbox and follow the link to reset your password.
              </p>
              <p className="text-sm text-muted-foreground">
                Didn't receive the email?{" "}
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-accent hover:underline font-medium"
                >
                  Try again
                </button>
              </p>
            </div>
            <Link to="/login">
              <Button className="w-full h-11" variant="outline">
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
