"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type CartItem = {
  id: number;
  title: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  editCartItem: (id: number, newTitle: string, newPrice: number, newImageUrl?: string | null) => void; // NEW
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isLoaded: boolean;
};

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      cart: [],
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      editCartItem: () => {},
      clearCart: () => {},
      cartTotal: 0,
      cartCount: 0,
      isLoaded: false,
    };
  }
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("store_cart");
      if (stored) setCart(JSON.parse(stored));
    } catch {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("store_cart", JSON.stringify(cart));
  }, [cart, isLoaded]);

  function addToCart(item: Omit<CartItem, "quantity">) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeFromCart(id: number) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function updateQuantity(id: number, quantity: number) {
    if (quantity <= 0) { removeFromCart(id); return; }
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i));
  }

  // NEW: Edit Cart Item
  function editCartItem(id: number, newTitle: string, newPrice: number, newImageUrl?: string | null) {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, title: newTitle, price: newPrice, imageUrl: newImageUrl !== undefined ? newImageUrl : i.imageUrl } : i));
  }

  function clearCart() { setCart([]); }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, editCartItem, clearCart, cartTotal, cartCount, isLoaded }}>
      {children}
    </CartContext.Provider>
  );
}
