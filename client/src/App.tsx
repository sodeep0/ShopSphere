import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/use-cart";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartSidebar } from "@/components/cart/cart-sidebar";
import Home from "@/pages/home";
import Products from "@/pages/products";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { useState } from "react";

function Router() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdminModal, setShowAdminModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onSearchChange={setSearchQuery} 
        onAdminClick={() => setShowAdminModal(true)}
      />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/products">
            <Products searchQuery={searchQuery} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <CartSidebar />
      
      {showAdminModal && (
        <Admin onClose={() => setShowAdminModal(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Router />
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
