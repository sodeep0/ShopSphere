import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { addToWishlist as apiAdd, getWishlist as apiGet, removeFromWishlist as apiRemove } from "@/lib/api";
import type { Product } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface WishlistEntry {
  id: string;
  userId: string;
  productId: string;
  product: Product;
}

interface WishlistContextType {
  items: WishlistEntry[];
  isInWishlist: (productId: string) => boolean;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  count: number;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load wishlist when user logs in or token changes
  useEffect(() => {
    let isCancelled = false;
    async function load() {
      if (!token) {
        setItems([]);
        return;
      }
      setIsLoading(true);
      try {
        const list = await apiGet();
        if (!isCancelled) setItems(list);
      } catch (e) {
        if (!isCancelled) setItems([]);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }
    load();
    return () => { isCancelled = true; };
  }, [token]);

  const isInWishlist = (productId: string) => items.some(i => i.productId === productId);

  const add = async (productId: string) => {
    if (!token) return; // silently ignore when not logged in
    try {
      await apiAdd(productId);
      // Optimistic update if not present
      if (!isInWishlist(productId)) {
        const list = await apiGet();
        setItems(list);
      }
    } catch (e) {
      // no-op
    }
  };

  const remove = async (productId: string) => {
    if (!token) return;
    try {
      await apiRemove(productId);
      setItems(prev => prev.filter(i => i.productId !== productId));
    } catch (e) {
      // no-op
    }
  };

  const value = useMemo(() => ({
    items,
    isInWishlist,
    add,
    remove,
    count: items.length,
    isLoading,
  }), [items, isLoading]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}


