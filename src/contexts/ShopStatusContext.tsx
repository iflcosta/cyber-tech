"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type StoreStatus = 'open' | 'closing' | 'closed';

interface ShopStatus {
    status: StoreStatus;
    message: string;
}

interface ShopStatusContextType {
    storeStatus: ShopStatus;
}

const ShopStatusContext = createContext<ShopStatusContextType | undefined>(undefined);

export function ShopStatusProvider({ children }: { children: ReactNode }) {
    const [storeStatus, setStoreStatus] = useState<ShopStatus>({ status: 'closed', message: 'Verificando status...' });

    useEffect(() => {
        const checkStatus = () => {
            const now = new Date();
            const day = now.getDay();
            const hour = now.getHours();
            const minutes = now.getMinutes();
            const time = hour + minutes / 60;

            const HOURS = {
                weekdays: { open: 9, close: 18 },
                saturday: { open: 9, close: 13 },
                sunday: null
            };

            let status: StoreStatus = 'closed';
            let message = '';

            if (day === 0) {
                status = 'closed';
                message = 'Fechado · Abrimos amanhã às 9h';
            } else if (day === 6) {
                if (time >= HOURS.saturday.open && time < HOURS.saturday.close) {
                    status = (HOURS.saturday.close - time <= 0.5) ? 'closing' : 'open';
                    message = status === 'closing' ? 'Fechamos em 30 min' : `Aberto · Fecha às 13h`;
                } else {
                    status = 'closed';
                    message = 'Fechado · Abrimos segunda às 9h';
                }
            } else {
                if (time >= HOURS.weekdays.open && time < HOURS.weekdays.close) {
                    status = (HOURS.weekdays.close - time <= 0.5) ? 'closing' : 'open';
                    message = status === 'closing' ? 'Fechamos em 30 min' : `Aberto · Fecha às 18h`;
                } else {
                    status = 'closed';
                    message = `Fechado · Abrimos amanhã às 9h`;
                }
            }

            setStoreStatus({ status, message });

            // Apply theme class to document
            if (typeof document !== 'undefined') {
                const root = document.documentElement;
                if (status === 'open' || status === 'closing') {
                    root.classList.add('theme-open');
                    root.classList.remove('theme-closed');
                } else {
                    root.classList.add('theme-closed');
                    root.classList.remove('theme-open');
                }
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <ShopStatusContext.Provider value={{ storeStatus }}>
            {children}
        </ShopStatusContext.Provider>
    );
}

export function useShopStatus() {
    const context = useContext(ShopStatusContext);
    if (context === undefined) {
        throw new Error('useShopStatus must be used within a ShopStatusProvider');
    }
    return context;
}
