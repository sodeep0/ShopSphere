import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getProduct, getProducts, getCategories } from "@/lib/api";
import { ShoppingCart, Heart, ChevronRight, ArrowLeft, Package, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl, getImageAlt, getImageSrcSet as getResponsiveSrcSet } from "@/lib/imageUtils";
import { ProductCard } from "@/components/products/product-card";
import type { Product, Category } from "@shared/schema";
import { useState } from "react";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const productId = params?.id;
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isInWishlist, add, remove } = useWishlist();
  const { user } = useAuth();
  const [isWishLoading, setIsWishLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Fetch product details
  const { data: product, isLoading, error } = useQuery({
    queryKey: [`/api/products/${productId}`],
    queryFn: () => getProduct(productId!),
    enabled: !!productId,
  });

  // Fetch all categories to get category slugs
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: () => getCategories(),
  });

  // Fetch related products (products from same category)
  const { data: allProducts = [], isLoading: relatedLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: () => getProducts(),
    enabled: true,
  });

  // Get related products from the same category
  const relatedProducts = product && categories.length > 0 && allProducts.length > 0
    ? allProducts.filter((p) => p.categoryId === product.categoryId && p.id !== productId).slice(0, 4)
    : [];

  const handleAddToCart = () => {
    if (!product) return;

    if (product.stock <= 0) {
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: "This item is currently out of stock.",
      });
      return;
    }

    const cartItem = {
      productId: product.id,
      name: product.name,
      price: typeof product.price === 'number' ? product.price : parseFloat(product.price.toString()),
      image: product.image,
      stock: product.stock,
    };
    (cartItem as any).quantity = quantity;
    addItem(cartItem as any);

    toast({
      title: "Added to Cart",
      description: `${quantity} x ${product.name} added to your cart.`,
    });
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (product) {
      const maxQuantity = Math.min(product.stock, newQuantity);
      setQuantity(Math.max(1, Math.min(maxQuantity, newQuantity)));
    } else {
      setQuantity(Math.max(1, newQuantity));
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;

    if (!user) {
      toast({ 
        variant: "destructive", 
        title: "Sign in required", 
        description: "Please sign in to use the wishlist." 
      });
      return;
    }

    try {
      setIsWishLoading(true);
      if (isInWishlist(product.id)) {
        await remove(product.id);
        toast({ 
          title: "Removed from wishlist", 
          description: `${product.name} was removed.` 
        });
      } else {
        await add(product.id);
        toast({ 
          title: "Added to wishlist", 
          description: `${product.name} was saved.` 
        });
      }
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Wishlist error", 
        description: err?.message || "Please try again." 
      });
    } finally {
      setIsWishLoading(false);
    }
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price.toString());
    return `NPR ${numPrice.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-muted rounded-xl"></div>
              <div className="space-y-6">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-full"></div>
                <div className="h-6 bg-muted rounded w-2/3"></div>
                <div className="h-12 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Product Not Found</h1>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
          <Link href="/products">
            <Button>View All Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            </li>
            <ChevronRight className="w-4 h-4" />
            <li>
              <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
            </li>
            <ChevronRight className="w-4 h-4" />
            <li className="text-foreground font-medium">{product.name}</li>
          </ol>
        </nav>

      

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-16">
          {/* Product Image */}
          <div className="flex items-start justify-center lg:justify-start p-4">
            <div className="aspect-square w-full max-w-md overflow-hidden rounded-xl border border-border shadow-sm">
              <img
                src={getImageUrl(product.image, 'large')}
                srcSet={getResponsiveSrcSet(product.image)}
                alt={getImageAlt(product.name)}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-2xl font-bold text-foreground">
                  {formatPrice(product.price)}
                </span>
                <div className={`flex items-center text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-destructive'}`}>
                  <span className={`mr-2 inline-block h-2 w-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-destructive'}`} />
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </div>
              </div>
              
              {/* Description in right column */}
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Controls aligned to bottom of image */}
            <div className="flex items-center gap-3 pt-4 border-t border-border mt-auto mb-8">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="shrink-0 h-10"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-base font-semibold w-10 text-center">{quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.stock}
                  className="shrink-0 h-10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="w-auto px-6 h-10 text-sm"
              >
                {product.stock > 0 ? (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Out of Stock
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleWishlistToggle}
                disabled={isWishLoading}
                className="shrink-0 h-10"
              >
                <Heart className={`h-4 w-4 transition-colors ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-foreground mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
