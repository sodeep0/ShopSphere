import { Link, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to your account to continue shopping
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
        
        <LoginForm 
          onSuccess={() => {
            // Redirect to home page after successful login
            setLocation('/');
          }}
          onSwitchToRegister={() => {
            setLocation('/register');
          }}
        />
      </div>
    </div>
  );
}
