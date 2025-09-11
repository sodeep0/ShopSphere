import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, ShieldQuestion, Menu, Mountain } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onSearchChange: (search: string) => void;
  onAdminClick: () => void;
}

export function Header({ onSearchChange, onAdminClick }: HeaderProps) {
  const [location] = useLocation();
  const { getTotalItems, setIsOpen } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  return (
    <header className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
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
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search handicrafts..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
            </div>
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
            
            {/* Cart */}
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

            {/* Admin Login */}
            <Button
              variant="default"
              size="sm"
              className="hidden sm:flex items-center space-x-2"
              onClick={onAdminClick}
              data-testid="button-admin"
            >
              <ShieldQuestion className="w-4 h-4" />
              <span>Admin</span>
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
          <div className="md:hidden py-4 border-t border-border">
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Search handicrafts..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
                data-testid="input-search-mobile"
              />
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
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    onAdminClick();
                    setIsMobileMenuOpen(false);
                  }}
                  data-testid="button-admin-mobile"
                >
                  <ShieldQuestion className="w-4 h-4 mr-2" />
                  Admin Login
                </Button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
