import { Suspense } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { LeadModalProvider } from "@/contexts/LeadModalContext";
import CartSidebar from "@/components/CartSidebar";
import LeadModal from "@/components/LeadModal";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LeadModalProvider>
            <CartProvider>
                {children}
                <CartSidebar />
                <Suspense fallback={null}>
                    <LeadModal />
                </Suspense>
            </CartProvider>
        </LeadModalProvider>
    );
}
