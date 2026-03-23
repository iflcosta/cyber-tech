'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import type { Executor } from '@/types/admin';

type AppRouter = ReturnType<typeof useRouter>;

export function useAdminAuth(router: AppRouter) {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [installable, setInstallable] = useState(false);

    const currentExecutor: Executor = userEmail?.toLowerCase().includes('iago')
        ? 'iago'
        : userEmail?.toLowerCase().includes('jefferson')
        ? 'partner'
        : 'owner';

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    const handleInstallPWA = async () => {
        const promptEvent = (window as any).deferredPrompt;
        if (!promptEvent) return;
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
            (window as any).deferredPrompt = null;
            setInstallable(false);
        }
    };

    useEffect(() => {
        async function checkUser() {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email ?? null);
            }
        }
        checkUser();

        const handleInstallable = () => setInstallable(true);
        window.addEventListener('pwa-installable', handleInstallable);
        if ((window as any).deferredPrompt) setInstallable(true);

        return () => {
            window.removeEventListener('pwa-installable', handleInstallable);
        };
    }, []);

    return {
        userEmail,
        installable,
        currentExecutor,
        handleLogout,
        handleInstallPWA,
    };
}
