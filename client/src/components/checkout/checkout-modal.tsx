import { useState, useEffect } from "react";
import { X, CheckCircle, Truck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { createOrder } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    district: "",
    road: "",
    additionalLandmark: "",
    specialInstructions: "",
  });

  // Auto-fill form with user data when user is logged in
  useEffect(() => {
    if (user && isOpen) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || "",
        customerPhone: user.phone || "",
        customerEmail: user.email || "",
        district: user.district || "",
        road: user.road || "",
        additionalLandmark: user.additionalLandmark || "",
      }));
    }
  }, [user, isOpen]);

  const orderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      // Invalidate ALL product-related queries (exact and partial matches)
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/products'],
        exact: false // This will match ['/api/products', filters] and ['/api/products', productId]
      });
      
      toast({
        title: "Order Placed Successfully!",
        description: "You will receive a confirmation call shortly. Payment is due on delivery.",
      });
      clearCart();
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
      });
    },
  });

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return `NPR ${price.toLocaleString()}`;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const required = ['customerName', 'customerPhone', 'district', 'road'];
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: `Please fill in all required fields.`,
        });
        return;
      }
    }

    const orderData = {
      ...formData,
      userId: user?.id, // Include user ID if logged in
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    orderMutation.mutate(orderData);
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="checkout-modal">
      <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Checkout - Cash on Delivery</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-checkout"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-background/50 p-4 rounded-lg">
            <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between" data-testid={`order-item-${item.productId}`}>
                  <span className="text-muted-foreground">
                    {item.name} (x{item.quantity})
                  </span>
                  <span className="text-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span className="text-foreground">Total:</span>
                <span className="text-foreground" data-testid="text-order-total">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Customer Information</h3>
              {user && (
                <div className="flex items-center space-x-2 text-sm text-primary">
                  <User className="w-4 h-4" />
                  <span>Logged in as {user.name}</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  placeholder="Enter your full name"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  required
                  data-testid="input-customer-name"
                />
              </div>
              
              <div>
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="98xxxxxxxx"
                  value={formData.customerPhone}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  required
                  data-testid="input-customer-phone"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="your.email@gmail.com"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                data-testid="input-customer-email"
              />
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Delivery Address (Nepal Only)</h3>
            
            <div>
              <Label htmlFor="district">District *</Label>
              <Input
                id="district"
                placeholder="e.g., Kathmandu"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                required
                data-testid="input-district"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="road">Road/Street *</Label>
                <Input
                  id="road"
                  placeholder="e.g., New Baneshwor Road, Thamel Street"
                  value={formData.road}
                  onChange={(e) => handleInputChange('road', e.target.value)}
                  required
                  data-testid="input-road"
                />
              </div>
              
              <div>
                <Label htmlFor="additionalLandmark">Additional Landmark (Optional)</Label>
                <Input
                  id="additionalLandmark"
                  placeholder="e.g., Near Durbar High School, Behind City Mall"
                  value={formData.additionalLandmark}
                  onChange={(e) => handleInputChange('additionalLandmark', e.target.value)}
                  data-testid="input-additional-landmark"
                />
              </div>
            </div>

          </div>

          {/* COD Information */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-0.5">
                <Truck className="text-primary-foreground w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Cash on Delivery</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pay in cash when your order is delivered</li>
                  <li>• Available across all major cities in Nepal</li>
                  <li>• Delivery within 3-7 business days</li>
                  <li>• No advance payment required</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
            <Textarea
              id="specialInstructions"
              placeholder="Any special delivery instructions..."
              rows={2}
              value={formData.specialInstructions}
              onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
              data-testid="textarea-special-instructions"
            />
          </div>

          {/* Place Order Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full text-lg py-6"
              disabled={orderMutation.isPending}
              data-testid="button-place-order"
            >
              {orderMutation.isPending ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Place Order - {formatPrice(getTotalPrice())} (COD)
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              By placing this order, you agree to pay the full amount in cash upon delivery.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
