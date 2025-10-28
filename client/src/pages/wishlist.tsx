import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function WishlistPage() {
  const { items, remove, isLoading } = useWishlist();
  const { addItem } = useCart();
  const { toast } = useToast();

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading wishlist...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Wishlist</h1>

      {items.length === 0 ? (
        <div className="text-muted-foreground">
          Your wishlist is empty. <Link href="/products" className="text-primary">Browse products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(({ product }) => (
            <div key={product.id} className="border rounded-lg overflow-hidden">
              <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="font-bold">NPR {product.price.toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (product.stock <= 0) {
                          toast({ variant: "destructive", title: "Out of Stock", description: "This item is currently out of stock." });
                          return;
                        }
                        addItem({
                          productId: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                          stock: product.stock,
                        });
                        toast({ title: "Added to Cart", description: `${product.name} has been added to your cart.` });
                      }}
                      disabled={product.stock <= 0}
                    >
                      {product.stock > 0 ? 'Add to Cart' : 'Sold Out'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => remove(product.id)}>Remove</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


