import { ShoppingCart, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();

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
      price: parseFloat(product.price),
      image: product.image,
      stock: product.stock,
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const formatPrice = (price: string) => {
    return `NPR ${parseFloat(price).toLocaleString()}`;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'felt-crafts': 'Felt Crafts',
      'prayer-wheels': 'Prayer Wheels',
      'statues': 'Statues',
      'handlooms': 'Handlooms',
    };
    return labels[category] || category;
  };

  return (
    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1" data-testid={`card-product-${product.id}`}>
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          data-testid={`img-product-${product.id}`}
        />
        
        {/* Made in Nepal Badge */}
        <div className="absolute top-3 left-3 bg-accent/90 text-accent-foreground px-2 py-1 rounded-md text-xs font-medium">
          Made in Nepal
        </div>

        {/* Stock Status */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-medium ${
          product.stock > 0 
            ? 'bg-primary/90 text-primary-foreground' 
            : 'bg-destructive/90 text-destructive-foreground'
        }`} data-testid={`text-stock-${product.id}`}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </div>

        {/* Quick Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onQuickView(product)}
            data-testid={`button-quick-view-${product.id}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            Quick View
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors" data-testid={`text-name-${product.id}`}>
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground" data-testid={`text-category-${product.id}`}>
            {getCategoryLabel(product.category)}
          </p>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-description-${product.id}`}>
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-lg font-bold text-foreground" data-testid={`text-price-${product.id}`}>
              {formatPrice(product.price)}
            </div>
            <div className="flex items-center space-x-1">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-current" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">(4.8)</span>
            </div>
          </div>

          <Button
            size="sm"
            disabled={product.stock <= 0}
            onClick={handleAddToCart}
            className={`${product.stock <= 0 ? 'cursor-not-allowed' : ''}`}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            {product.stock > 0 ? (
              <>
                <ShoppingCart className="w-4 h-4 mr-1" />
                Add
              </>
            ) : (
              'Sold Out'
            )}
          </Button>
        </div>

        {product.artisan && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Crafted by <span className="font-medium">{product.artisan}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
