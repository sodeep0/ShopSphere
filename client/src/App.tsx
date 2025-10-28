import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/use-cart";
import { AuthProvider } from "@/hooks/use-auth";
import { WishlistProvider } from "@/hooks/use-wishlist";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import WishlistPage from "@/pages/wishlist";
import Admin from "@/pages/admin";
import AdminProductCreate from "@/pages/admin-product-create";
import AdminProductEdit from "@/pages/admin-product-edit";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";

function Router() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Extract search query from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location]);

  return location.startsWith("/admin") ? (
    // For admin pages, render only the Switch (no header/footer/sidebar/spacing)
    <Switch>
      <Route path="/admin" component={Admin} />
      <Route path="/admin/products/create" component={AdminProductCreate} />
      <Route path="/admin/products/edit" component={AdminProductEdit} />
      <Route component={NotFound} />
    </Switch>
  ) : (
    <div className="min-h-screen flex flex-col">
      <Header onSearchChange={setSearchQuery} />
      <main className="flex-1 pt-16">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/products/:id" component={ProductDetail} />
          <Route path="/products">
            <Products searchQuery={searchQuery} />
          </Route>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/profile" component={Profile} />
          <Route path="/wishlist" component={WishlistPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Toaster />
              <Router />
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
