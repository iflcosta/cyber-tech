"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

export type LeadGoal = 'compra' | 'manutencao' | 'duvida';

interface LeadModalContextType {
    isOpen: boolean;
    goal: LeadGoal | null;
    customDescription?: string;
    whatsappMessage?: string;
    productIds?: string[];
    openModal: (goal?: LeadGoal, customDescription?: string, whatsappMessage?: string, productIds?: string[]) => void;
    closeModal: () => void;
}

const LeadModalContext = createContext<LeadModalContextType | undefined>(undefined);

export function LeadModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [goal, setGoal] = useState<LeadGoal | null>(null);
    const [customDescription, setCustomDescription] = useState<string | undefined>();
    const [whatsappMessage, setWhatsappMessage] = useState<string | undefined>();
    const [productIds, setProductIds] = useState<string[] | undefined>();

    const openModal = useCallback((g?: LeadGoal, desc?: string, message?: string, pIds?: string[]) => {
        if (g) setGoal(g);
        setCustomDescription(desc);
        setWhatsappMessage(message);
        setProductIds(pIds);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        // Save to localStorage to avoid showing for 24h if it was an auto-open or exit-intent
        // But if it was triggered by user button, maybe we don't block? 
        // Let's block anyway to be respectful.
        const expiry = new Date().getTime() + 24 * 60 * 60 * 1000;
        localStorage.setItem('lead_modal_expiry', expiry.toString());
        
        setTimeout(() => {
            setGoal(null);
            setCustomDescription(undefined);
            setWhatsappMessage(undefined);
            setProductIds(undefined);
        }, 300);
    }, []);

    return (
        <LeadModalContext.Provider value={{ isOpen, goal, customDescription, whatsappMessage, productIds, openModal, closeModal }}>
            {children}
        </LeadModalContext.Provider>
    );
}

export function useLeadModal() {
    const context = useContext(LeadModalContext);
    if (!context) throw new Error('useLeadModal must be used within LeadModalProvider');
    return context;
}
