'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Lead } from '@/types/lead';
import type { MaintenanceOrder } from '@/types/maintenance';
import type { Product } from '@/types/product';
import type { Review } from '@/types/review';
import type { AdminStats, DiscountCoupon } from '@/types/admin';

export function useAdminData() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [maintenanceOrders, setMaintenanceOrders] = useState<MaintenanceOrder[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<AdminStats>({
        totalLeadValue: 0,
        convertedCount: 0,
        pendingCount: 0,
        avgTicket: 0,
    });

    async function fetchLeads() {
        setLoading(true);
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar leads não Admin:', error.message);
        }
        if (data) {
            console.log('Leads carregados:', data.length);
            setLeads(data as Lead[]);
        }
        setLoading(false);
    }

    async function fetchMaintenanceOrders() {
        const { data } = await supabase
            .from('maintenance_orders')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setMaintenanceOrders(data as MaintenanceOrder[]);
    }

    async function fetchProducts() {
        const { data } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setProducts(data as Product[]);
    }

    async function fetchReviews() {
        const { data } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setReviews(data as Review[]);
    }

    async function fetchCoupons() {
        const { data } = await supabase
            .from('discount_coupons')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setCoupons(data as DiscountCoupon[]);
    }

    useEffect(() => {
        fetchLeads();
        fetchMaintenanceOrders();
        fetchProducts();
        fetchReviews();
        fetchCoupons();

        const channel = supabase
            .channel('db-leads-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leads' },
                () => {
                    fetchLeads();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        if (leads.length > 0) {
            const converted = leads.filter(l => l.status === 'converted');
            const total = converted.reduce((acc, l) => acc + (l.final_value || 0), 0);
            setStats({
                totalLeadValue: total,
                convertedCount: converted.length,
                pendingCount: leads.filter(l => l.status === 'pending').length,
                avgTicket: converted.length > 0 ? total / converted.length : 0,
            });
        }
    }, [leads]);

    return {
        leads,
        maintenanceOrders,
        products,
        reviews,
        coupons,
        loading,
        setLoading,
        stats,
        fetchLeads,
        fetchMaintenanceOrders,
        fetchProducts,
        fetchReviews,
        fetchCoupons,
    };
}
