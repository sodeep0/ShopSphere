import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl, getImageSrcSet, getImageAlt } from "@/lib/imageUtils";
import type { Product } from "@shared/schema";
import { memo } from "react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Link } from "wouter";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isInWishlist, add, remove } = useWishlist();
  const { user } = useAuth();
  const [isWishLoading, setIsWishLoading] = useState(false);

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: "This item is currently out of stock.",
      });
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Sign in required", description: "Please sign in to use the wishlist." });
      return;
    }
    try {
      setIsWishLoading(true);
      if (isInWishlist(product.id)) {
        await remove(product.id);
        toast({ title: "Removed from wishlist", description: `${product.name} was removed.` });
      } else {
        await add(product.id);
        toast({ title: "Added to wishlist", description: `${product.name} was saved.` });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Wishlist error", description: err?.message || "Please try again." });
    } finally {
      setIsWishLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `NPR ${price.toLocaleString()}`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    window.location.href = `/products/${product.id}`;
  };

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow duration-300 hover:shadow-md cursor-pointer"
      data-testid={`card-product-${product.id}`}
      onClick={handleCardClick}
    >
      {/* --- Image Section --- */}
      <div className="relative overflow-hidden">
        <div className="aspect-square">
          <img
            src={getImageUrl(product.image, 'medium')}
            srcSet={getImageSrcSet(product.image)}
            alt={getImageAlt(product.name)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-testid={`img-product-${product.id}`}
            loading="lazy"
          />
        </div>
      </div>

      {/* --- Content Section --- */}
      <div className="flex flex-1 flex-col p-4">
        <div>
          <h3 className="mt-1 text-lg font-medium text-foreground tracking-tight leading-tight" data-testid={`text-name-${product.id}`}>
            {product.name}
          </h3>
        </div>

        {/* Spacer to push content to the bottom */}
        <div className="flex-grow" />

        <div className="mt-4 space-y-3">
          {/* --- Price & Action Buttons --- */}
          <div>
            <div className="mb-2 text-2xl font-semibold text-foreground tracking-tight" data-testid={`text-price-${product.id}`}>
              {formatPrice(product.price)}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="flex-grow"
                disabled={product.stock <= 0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart();
                }}
                data-testid={`button-add-to-cart-${product.id}`}
              >
                {product.stock > 0 ? (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </>
                ) : (
                  'Sold Out'
                )}
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="shrink-0"
                aria-label="Toggle wishlist"
                disabled={isWishLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleWishlistToggle();
                }}
                data-testid={`button-wishlist-${product.id}`}
              >
                <Heart className={`h-4 w-4 transition-colors ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});