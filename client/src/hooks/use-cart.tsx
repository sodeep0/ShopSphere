import { createContext, useContext, useState, useEffect } from "react";
import type { CartItem } from "@/lib/api";

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> | (Omit<CartItem, 'quantity'> & { quantity?: number })) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('krisha-cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('krisha-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'quantity'> | (Omit<CartItem, 'quantity'> & { quantity?: number })) => {
    setItems(prev => {
      const itemQuantity = ('quantity' in newItem && newItem.quantity) || 1;
      const existingItem = prev.find(item => item.productId === newItem.productId);
      
      if (existingItem) {
        // Check stock limit
        const newQuantity = existingItem.quantity + itemQuantity;
        if (newQuantity > newItem.stock) {
          return prev; // Don't add if would exceed stock limit
        }
        
        return prev.map(item =>
          item.productId === newItem.productId
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        return [...prev, { ...newItem, quantity: itemQuantity }];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          // Ensure quantity doesn't exceed stock
          const newQuantity = Math.min(quantity, item.stock);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
