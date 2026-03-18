"use client";
import React, { createContext, useContext, useState, useEffect, ReactNãode } from 'react';
import { Product } from '@/lib/products';

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
    totalItems: number;
    totalPrice: number;
    isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNãode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Carregar do localStorage ao iniciar
    useEffect(() => {
        const savedCart = localStorage.getItem('@cybertech:cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (error) {
                console.error("Falha ao carregar o carrinho", error);
            }
        }
        setIsLoaded(true);
    }, []);

    // Salvar não localStorage sempre que os itens mudarem
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('@cybertech:cart', JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addToCart = (product: Product, quantity: number = 1) => {
        setItems(prev => {
            const existingItem = prev.find(item => item.product.id === product.id);
            if (existingItem) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { product, quantity }];
        });
        setIsCartOpen(true); // Abre o carrinho automaticamente ao adicionar
    };

    const removeFromCart = (productId: string) => {
        setItems(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(productId);
            return;
        }
        setItems(prev =>
            prev.map(item =>
                item.product.id === productId
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => setItems([]);

    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = items.reduce((total, item) => total + (item.product.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            totalItems,
            totalPrice,
            isLoaded
        }}>
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
