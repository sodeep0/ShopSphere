import { useState } from "react";
import { Link } from "wouter";
import { Flag, HandHeart, Heart, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/products/product-card";
import type { Product } from "@shared/schema";

const categories = [
  {
    id: 'felt-crafts',
    name: 'Felt Crafts',
    icon: '🧶',
    count: 25
  },
  {
    id: 'statues',
    name: 'Statues', 
    icon: '🗿',
    count: 18
  },
  {
    id: 'prayer-wheels',
    name: 'Prayer Wheels',
    icon: '☸️',
    count: 12
  },
  {
    id: 'handlooms',
    name: 'Handlooms',
    icon: '🧵',
    count: 30
  }
];

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <img src={product.image} alt={product.name} className="w-full rounded-lg" />
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
              <p className="text-muted-foreground">{product.description}</p>
              <div className="text-xl font-bold text-foreground">NPR {parseFloat(product.price).toLocaleString()}</div>
              {product.artisan && <p className="text-sm text-muted-foreground">By {product.artisan}</p>}
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const { data: featuredProducts = [], isLoading } = useQuery({
    queryKey: ['/api/products'],
    select: (data: Product[]) => data.slice(0, 4), // Show only first 4 as featured
  });

  return (
    <div className="min-h-screen bg-background nepal-pattern">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 to-accent/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-sm font-medium">
                  <Flag className="w-4 h-4 mr-2" />
                  Made in Nepal
                </span>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Authentic Nepali 
                  <span className="text-primary"> Handicrafts</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Discover beautiful handcrafted treasures from skilled Nepali artisans. Each piece tells a story of tradition, culture, and craftsmanship.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg" data-testid="button-shop-now">
                    Shop Now
                  </Button>
                </Link>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Heart className="w-4 h-4 text-primary" />
                  <span>Cash on Delivery available across Nepal</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">150+</div>
                  <div className="text-sm text-muted-foreground">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">50+</div>
                  <div className="text-sm text-muted-foreground">Artisans</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">1000+</div>
                  <div className="text-sm text-muted-foreground">Happy Customers</div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Hero image showcasing Nepali handicrafts */}
              <div className="relative overflow-hidden rounded-2xl shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
                  alt="Traditional Nepali handicrafts and prayer wheels"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -bottom-4 -left-4 bg-card p-4 rounded-xl shadow-lg border border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <HandHeart className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Handcrafted</div>
                    <div className="text-sm text-muted-foreground">With Love</div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-accent/90 text-accent-foreground p-3 rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-lg font-bold">NPR 500+</div>
                  <div className="text-xs">Starting Price</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-foreground">Shop by Category</h2>
            <p className="text-muted-foreground">Explore our carefully curated collection of traditional Nepali handicrafts</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`}>
                <div className="group cursor-pointer" data-testid={`category-${category.id}`}>
                  <div className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="text-4xl mb-4">{category.icon}</div>
                    <h3 className="font-semibold text-foreground mb-2">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count} items</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-foreground">Featured Products</h2>
            <p className="text-muted-foreground">Handpicked treasures from our artisan collection</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(product) => setQuickViewProduct(product)}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/products">
              <Button variant="outline" size="lg" data-testid="button-view-all">
                View All Products
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <QuickViewModal 
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
