import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Filter, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/api";
import { ProductCard } from "@/components/products/product-card";
import type { Product } from "@shared/schema";

interface ProductsProps {
  searchQuery?: string;
}

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  if (!product) return null;

  const formatPrice = (price: string) => {
    return `NPR ${parseFloat(price).toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full rounded-lg object-cover"
              />
            </div>
            <div className="space-y-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground">{product.name}</h2>
                <p className="text-sm text-muted-foreground">{product.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              </div>
              
              <p className="text-muted-foreground">{product.description}</p>
              
              <div className="text-2xl font-bold text-foreground">
                {formatPrice(product.price)}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stock:</span>
                  <span className={`text-sm font-medium ${product.stock > 0 ? 'text-primary' : 'text-destructive'}`}>
                    {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                  </span>
                </div>
                
                {product.artisan && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Artisan:</span>
                    <span className="text-sm font-medium text-foreground">{product.artisan}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 space-y-3">
                <Button 
                  className="w-full" 
                  disabled={product.stock <= 0}
                  onClick={onClose}
                >
                  {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </Button>
                <Button variant="outline" className="w-full" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Products({ searchQuery = "" }: ProductsProps) {
  const [location] = useLocation();
  const [filters, setFilters] = useState({
    category: "",
    priceRange: "",
    inStock: false,
    search: searchQuery,
  });
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Update search when prop changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: searchQuery }));
  }, [searchQuery]);

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const category = params.get('category');
    if (category) {
      setFilters(prev => ({ ...prev, category }));
    }
  }, [location]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products', filters],
    queryFn: () => getProducts({
      category: filters.category || undefined,
      inStock: filters.inStock || undefined,
      search: filters.search || undefined,
    }),
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      priceRange: "",
      inStock: false,
      search: searchQuery,
    });
  };

  // Filter products by price range locally
  const filteredProducts = products.filter(product => {
    if (!filters.priceRange) return true;
    
    const price = parseFloat(product.price);
    switch (filters.priceRange) {
      case "0-1000":
        return price <= 1000;
      case "1000-5000":
        return price > 1000 && price <= 5000;
      case "5000-10000":
        return price > 5000 && price <= 10000;
      case "10000+":
        return price > 10000;
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-background nepal-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Our Products</h1>
          <p className="text-muted-foreground">Handcrafted with tradition and love</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Filters</h2>
                <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                  Clear All
                </Button>
              </div>

              <div className="space-y-6">
                {/* Category Filter */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">Category</Label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger data-testid="select-category-filter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      <SelectItem value="felt-crafts">Felt Crafts</SelectItem>
                      <SelectItem value="statues">Statues</SelectItem>
                      <SelectItem value="prayer-wheels">Prayer Wheels</SelectItem>
                      <SelectItem value="handlooms">Handlooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">Price Range</Label>
                  <Select value={filters.priceRange} onValueChange={(value) => handleFilterChange('priceRange', value)}>
                    <SelectTrigger data-testid="select-price-filter">
                      <SelectValue placeholder="All Prices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Prices</SelectItem>
                      <SelectItem value="0-1000">NPR 0 - 1,000</SelectItem>
                      <SelectItem value="1000-5000">NPR 1,000 - 5,000</SelectItem>
                      <SelectItem value="5000-10000">NPR 5,000 - 10,000</SelectItem>
                      <SelectItem value="10000+">NPR 10,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock Filter */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in-stock"
                    checked={filters.inStock}
                    onCheckedChange={(checked) => handleFilterChange('inStock', checked)}
                    data-testid="checkbox-in-stock"
                  />
                  <Label htmlFor="in-stock" className="text-sm font-medium text-foreground">
                    In Stock Only
                  </Label>
                </div>

                {/* Search */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">Search</Label>
                  <Input
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    data-testid="input-product-search"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground" data-testid="text-results-count">
                {filteredProducts.length} products found
              </p>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  data-testid="button-grid-view"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  data-testid="button-list-view"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Products */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                    <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters-empty">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={(product) => setQuickViewProduct(product)}
                  />
                ))}
              </div>
            )}

            {/* Load More */}
            {filteredProducts.length > 0 && filteredProducts.length >= 12 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg" data-testid="button-load-more">
                  Load More Products
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <QuickViewModal 
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
