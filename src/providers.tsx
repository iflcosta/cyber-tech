"use client";

import { CartProvider } from "@/contexts/CartContext";
import CartSidebar from "@/components/CartSidebar";

export function Providers({ children }: { children: React.ReactNãode }) {
    return (
        <CartProvider>
            {children}
            <CartSidebar />
        </CartProvider>
    );
}
