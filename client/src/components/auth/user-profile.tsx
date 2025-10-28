import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, User, LogOut, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfileProps {
  onViewOrders?: () => void;
}

export function UserProfile({ onViewOrders }: UserProfileProps) {
  const { user, logout, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    district: user?.district || "",
    road: user?.road || "",
    additionalLandmark: user?.additionalLandmark || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    setError("");
    setIsLoading(true);

    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      phone: user?.phone || "",
      district: user?.district || "",
      road: user?.road || "",
      additionalLandmark: user?.additionalLandmark || "",
    });
    setIsEditing(false);
    setError("");
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onViewOrders}>
                <Package className="w-4 h-4 mr-2" />
                View Orders
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your personal information and address
              </CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
                placeholder="Enter your district"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="road">Road/Area</Label>
              <Input
                id="road"
                name="road"
                value={formData.road}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
                placeholder="Enter your road or area"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="additionalLandmark">Additional Landmark</Label>
              <Input
                id="additionalLandmark"
                name="additionalLandmark"
                value={formData.additionalLandmark}
                onChange={handleChange}
                disabled={!isEditing || isLoading}
                placeholder="Enter additional landmark (optional)"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
