import { Link, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
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
            <h1 className="text-2xl font-bold text-foreground mb-2">Create Account</h1>
            <p className="text-muted-foreground">
              Join us to start shopping for authentic Nepali handicrafts
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
        
        <RegisterForm 
          onSuccess={() => {
            // Redirect to home page after successful registration
            setLocation('/');
          }}
          onSwitchToLogin={() => {
            setLocation('/login');
          }}
        />
      </div>
    </div>
  );
}
