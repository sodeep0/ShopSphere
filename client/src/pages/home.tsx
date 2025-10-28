import { Link } from "wouter";
import { Flag, HandHeart, Heart, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getProducts, getCategories } from "@/lib/api";
import { ProductCard } from "@/components/products/product-card";
import { useAuth } from "@/hooks/use-auth";
import type { Product, Category } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();

  const { data: allProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: () => getProducts(),
  });
  const featuredProducts = allProducts.slice(0, 4); // Show only first 4 as featured

  const { data: allCategories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: () => getCategories(),
  });
  const categories = allCategories.filter(cat => cat.isActive); // Only show active categories

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
                  Discover beautiful handcrafted treasures from Nepal. Each piece tells a story of tradition, culture, and craftsmanship.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg" data-testid="button-shop-now">
                    Shop Now
                  </Button>
                </Link>
                {/* {!user && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href="/register">
                      <Button variant="outline" size="lg">
                        <User className="w-4 h-4 mr-2" />
                        Sign Up
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="ghost" size="lg">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                )} */}
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
                  <div className="text-2xl font-bold text-foreground">20+</div>
                  <div className="text-sm text-muted-foreground">Categories</div>
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
                  src="https://plus.unsplash.com/premium_photo-1700558685091-626b62cefdf1?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600"
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
      <section className="py-16 flex justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-foreground">Shop by Category</h2>
            <p className="text-muted-foreground">Explore our handcrafted collections</p>
          </div>

          {categoriesLoading ? (
            <div className="flex flex-wrap justify-center gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-8 animate-pulse min-h-[200px] w-[280px] flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-muted rounded-xl mb-4"></div>
                  <div className="h-5 bg-muted rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6">
              {categories.map((category) => (
                <Link key={category.id} href={`/products?category=${category.slug}`}>
                  <div className="bg-card border border-border rounded-2xl p-8 text-center hover:border-primary/50 hover:shadow-2xl transition-all duration-200 cursor-pointer group min-h-[200px] w-[280px] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-200 bg-muted rounded-xl">
                      {category.icon || '🏺'}
                    </div>
                    <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors duration-200">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-foreground">Featured Products</h2>
            <p className="text-muted-foreground">Handpicked treasures from our collection</p>
          </div>

          {productsLoading ? (
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
    </div>
  );
}
