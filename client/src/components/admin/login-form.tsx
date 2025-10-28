import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { adminLogin, setAuthToken } from "@/lib/api";

interface LoginFormProps {
  onLogin: (token: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => adminLogin(data.email, data.password),
    onSuccess: (data) => {
      setAuthToken(data.data.token);
      onLogin(data.data.token);
      toast({
        title: "Login Successful",
        description: "Welcome to the admin panel!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(credentials);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <ShieldQuestion className="text-primary-foreground w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="text-muted-foreground">Access the Krisha Krafts admin panel</p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@krishakrafts.com"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  required
                  data-testid="input-admin-email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  required
                  data-testid="input-admin-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
