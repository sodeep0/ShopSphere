import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, Menu, Mountain, User, LogOut, Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onSearchChange: (search: string) => void;
}

export function Header({ onSearchChange }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { getTotalItems, setIsOpen } = useCart();
  const { user, logout } = useAuth();
  const { count } = useWishlist();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="bg-card border-b border-border fixed top-0 left-0 right-0 z-50 shadow-sm min-h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3" data-testid="link-home">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Mountain className="text-primary-foreground text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Krisha Krafts</h1>
              <p className="text-xs text-muted-foreground">Authentic Nepal</p>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearchSubmit} className="relative w-full flex">
              <Input
                type="text"
                placeholder="Search handicrafts..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-12 py-2"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1 h-8 px-3"
                data-testid="button-search"
              >
                Search
              </Button>
            </form>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/" 
                className={`text-foreground hover:text-primary transition-colors ${location === "/" ? "text-primary" : ""}`}
                data-testid="link-nav-home"
              >
                Home
              </Link>
              <Link 
                href="/products" 
                className={`text-foreground hover:text-primary transition-colors ${location === "/products" ? "text-primary" : ""}`}
                data-testid="link-nav-products"
              >
                Products
              </Link>
            </nav>
            
            {/* User Authentication */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden md:flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden lg:inline">{user.name}</span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="hidden md:flex"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden md:flex"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
            
            {/* Cart */}
            <Link href="/wishlist">
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                data-testid="button-wishlist"
              >
                <Heart className="w-5 h-5 text-red-500" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {count}
                  </span>
                )}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => setIsOpen(true)}
              data-testid="button-cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Button>


            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border bg-card">
            <div className="space-y-4">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search handicrafts..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="flex-1"
                  data-testid="input-search-mobile"
                />
                <Button
                  type="submit"
                  size="sm"
                  data-testid="button-search-mobile"
                >
                  Search
                </Button>
              </form>
              <nav className="flex flex-col space-y-2">
                <Link 
                  href="/" 
                  className="text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="link-nav-home-mobile"
                >
                  Home
                </Link>
                <Link 
                  href="/products" 
                  className="text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="link-nav-products-mobile"
                >
                  Products
                </Link>
                {user ? (
                  <>
                    <Link 
                      href="/profile"
                      className="text-foreground hover:text-primary transition-colors py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      className="text-foreground hover:text-primary transition-colors py-2 text-left"
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/login"
                    className="text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}