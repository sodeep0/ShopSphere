import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getProductsPaginated, getCategories } from "@/lib/api";
import { ProductCard } from "@/components/products/product-card";
import type { Product, Category } from "@shared/schema";


interface ProductsProps {
  searchQuery?: string;
}

export default function Products({ searchQuery = "" }: ProductsProps) {
  const [location] = useLocation();
  const [searchParams, setSearchParams] = useState("");


  // Parse URL params and create filters state
  const params = new URLSearchParams(searchParams);
  const urlCategory = params.get('category');
  const urlSearch = params.get('search');
  
  const [filters, setFilters] = useState({
    category: urlCategory || "all",
    minPrice: "",
    maxPrice: "",
    inStock: false,
    search: urlSearch || searchQuery,
    sortBy: "best-match",
  });


  // Update search params state when URL changes
  useEffect(() => {
    setSearchParams(window.location.search);
  }, [location]);


  // Update filters when search params change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const category = params.get('category');
    const search = params.get('search');
    
    setFilters(prev => ({
      ...prev,
      category: category || "all",
      search: search || searchQuery
    }));
  }, [searchParams, searchQuery]);


  const pageSize = 12;


  const fetchProductsPage = ({ pageParam = 1 }: { pageParam?: number }) =>
    getProductsPaginated({
      category: (filters.category && filters.category !== 'all') ? filters.category : undefined,
      inStock: filters.inStock || undefined,
      search: filters.search || undefined,
      sortBy: filters.sortBy !== 'best-match' ? filters.sortBy : undefined,
      page: pageParam,
      limit: pageSize,
    });


  const productsQuery = useInfiniteQuery({
    queryKey: ['/api/products', filters],
    queryFn: ({ pageParam = 1 }) => fetchProductsPage({ pageParam }),
    getNextPageParam: (lastPage: any, pages) => {
      const total = lastPage?.total ?? (Array.isArray(lastPage) ? lastPage.length : 0);
      const currentPage = pages.length;
      const maxPage = Math.max(1, Math.ceil(total / pageSize));
      return currentPage < maxPage ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: true,
  });


  const isLoading = productsQuery.isLoading;
  const productsPages = productsQuery.data?.pages || [];
  const flattenedProducts: Product[] = productsPages.flatMap((p: any) => p.items || p || []);


  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => getCategories(),
  });


  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      if (key === 'minPrice' || key === 'maxPrice') {
        const minPrice = key === 'minPrice' ? parseFloat(value) || 0 : parseFloat(prev.minPrice) || 0;
        const maxPrice = key === 'maxPrice' ? parseFloat(value) || Infinity : parseFloat(prev.maxPrice) || Infinity;
        
        if (minPrice > maxPrice && maxPrice !== Infinity) {
          newFilters.maxPrice = value;
        }
      }
      
      return newFilters;
    });
  };


  const clearFilters = () => {
    setFilters({
      category: "all",
      minPrice: "",
      maxPrice: "",
      inStock: false,
      search: searchQuery,
      sortBy: "best-match",
    });
  };


  const filteredProducts = flattenedProducts.filter((product: Product) => {
    if (product.price == null) return false;
    
    const price = typeof product.price === 'number' ? product.price : parseFloat(String(product.price));
    const minPrice = filters.minPrice ? parseFloat(filters.minPrice) : 0;
    const maxPrice = filters.maxPrice ? parseFloat(filters.maxPrice) : Infinity;
    
    return price >= minPrice && price <= maxPrice;
  });


  useEffect(() => {
    productsQuery.refetch();
  }, [filters.category, filters.inStock, filters.search, filters.sortBy]);


  const hasMore = Boolean(productsQuery.hasNextPage);


  return (
    <div className="min-h-screen bg-background nepal-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {filters.search ? `Search Results for "${filters.search}"` : "Our Products"}
          </h1>
          <p className="text-muted-foreground">
            {filters.search ? `Found ${filteredProducts.length} products matching your search` : "Handcrafted with tradition and love"}
          </p>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Filters</h2>
                <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                  Clear All
                </Button>
              </div>


              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">Category</Label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger data-testid="select-category-filter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoriesLoading ? (
                        <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                      ) : (
                        categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.slug}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>


                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">Price Range (NPR)</Label>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="min-price" className="text-xs text-muted-foreground">Minimum Price</Label>
                      <Input
                        id="min-price"
                        type="number"
                        placeholder="0"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        data-testid="input-min-price"
                        min="0"
                        step="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-price" className="text-xs text-muted-foreground">Maximum Price</Label>
                      <Input
                        id="max-price"
                        type="number"
                        placeholder="No limit"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        data-testid="input-max-price"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>
                </div>


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


                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">Search</Label>
                  <Input
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    data-testid="input-product-search"
                  />
                </div>


                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                    <SelectTrigger data-testid="select-sort-by">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best-match">Best Match</SelectItem>
                      <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                      <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>


          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground" data-testid="text-results-count">
                Showing {flattenedProducts.length} of {productsQuery.data?.pages?.[0]?.total ?? flattenedProducts.length} products
              </p>
            </div>


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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product: Product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            )}


            <div className="text-center mt-12">
              {productsQuery.isFetchingNextPage ? (
                <div className="text-muted-foreground">Loading more...</div>
              ) : hasMore ? (
                <Button
                  variant="outline"
                  size="lg"
                  data-testid="button-load-more"
                  onClick={() => productsQuery.fetchNextPage()}
                >
                  Load More Products
                </Button>
              ) : (
                <div className="text-sm text-muted-foreground">End of results</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
