import { X, Plus, Minus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { CheckoutModal } from "@/components/checkout/checkout-modal";

export function CartSidebar() {
  const { items, removeItem, updateQuantity, getTotalPrice, isOpen, setIsOpen } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return `NPR ${price.toLocaleString()}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />
      <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-xl z-50 transform transition-transform duration-300" data-testid="cart-sidebar">
        <div className="flex flex-col h-full">
          {/* Cart Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Shopping Cart</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-cart"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="flex items-center space-x-4 bg-background/50 p-4 rounded-lg" data-testid={`cart-item-${item.productId}`}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                    data-testid={`img-cart-${item.productId}`}
                  />
                  
                  <div className="flex-1 space-y-1">
                    <h3 className="font-medium text-foreground" data-testid={`text-cart-name-${item.productId}`}>
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-cart-price-${item.productId}`}>
                      {formatPrice(item.price)}
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        data-testid={`button-decrease-${item.productId}`}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-foreground font-medium w-8 text-center" data-testid={`text-quantity-${item.productId}`}>
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        data-testid={`button-increase-${item.productId}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {item.quantity >= item.stock && (
                      <p className="text-xs text-destructive">Max quantity reached</p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.productId)}
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-remove-${item.productId}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          {items.length > 0 && (
            <div className="border-t border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground font-medium">Subtotal:</span>
                <span className="text-xl font-bold text-foreground" data-testid="text-cart-total">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <Truck className="inline w-4 h-4 mr-2" />
                Cash on Delivery available across Nepal
              </div>

              <Button
                className="w-full"
                onClick={() => setShowCheckout(true)}
                data-testid="button-checkout"
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </div>
      </div>

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
      />
    </>
  );
}
