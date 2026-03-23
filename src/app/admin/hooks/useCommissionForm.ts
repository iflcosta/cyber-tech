'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Lead } from '@/types/lead';
import type { Product } from '@/types/product';
import type { CommissionForm, ConsumedProduct } from '@/types/admin';

const defaultCommissionForm: CommissionForm = {
    finalValue: '',
    costValue: '',
    ecosystemCaptured: true,
    isAssembly: false,
    executor: 'owner',
    customCommissionType: 'percent',
    customCommissionAmount: '',
    consumedProducts: [],
};

interface UseCommissionFormParams {
    leads: Lead[];
    products: Product[];
    userEmail: string | null;
    onRefreshLeads: () => void;
    onRefreshOrders: () => void;
    onRefreshProducts: () => void;
}

export function useCommissionForm({
    leads,
    products,
    userEmail,
    onRefreshLeads,
    onRefreshOrders,
    onRefreshProducts,
}: UseCommissionFormParams) {
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [selectedLeadForCommission, setSelectedLeadForCommission] = useState<any>(null);
    const [commissionForm, setCommissionForm] = useState<CommissionForm>(defaultCommissionForm);

    const isCelularLead = (lead: any) => {
        const t = (lead?.interest_type || lead?.equipment_type || '').toLowerCase();
        return (
            t.includes('celular') ||
            t.includes('smartphone') ||
            t.includes('phone') ||
            t.includes('mobile')
        );
    };

    const getAssemblyExecutor = (lead: any) =>
        isCelularLead(lead) ? 'partner' : 'owner';

    const openCommissionModal = (lead: any, preset: Partial<CommissionForm>) => {
        setSelectedLeadForCommission(lead);
        setCommissionForm({ ...defaultCommissionForm, ...preset });
        setShowCommissionModal(true);
    };

    const closeCommissionModal = () => {
        setShowCommissionModal(false);
    };

    const submitCommissionForm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeadForCommission) return;

        const val = parseFloat(commissionForm.finalValue) || 0;
        const cost = parseFloat(commissionForm.costValue) || 0;

        const digitalSources = ['site', 'instagram', 'facebook', 'insta', 'face', 'direct', 'direto'];
        const isDigital = digitalSources.includes(
            selectedLeadForCommission.marketing_source?.toLowerCase()
        );

        // Marketing (Iago): 8% padrão, 5% se valor > 8000
        let baseRate = 0;
        if (commissionForm.ecosystemCaptured) {
            baseRate = val > 8000 ? 0.05 : 0.08;
        }

        // Assembly commission
        let assemblyRate = 0;
        let techCommission = 0;
        const isCelular = isCelularLead(selectedLeadForCommission);

        if (commissionForm.isAssembly) {
            if (isCelular && commissionForm.executor === 'partner') {
                // Manutenção celular + Jefferson: 50% do lucro líquido
                techCommission = (val - cost) * 0.5;
            } else if (
                commissionForm.executor === 'iago' ||
                commissionForm.executor === 'partner'
            ) {
                // PC/notebook + Iago ou Jefferson: valor personalizado (R$ ou %)
                const customAmt = parseFloat(commissionForm.customCommissionAmount) || 0;
                const customComm =
                    commissionForm.customCommissionType === 'percent'
                        ? val * (customAmt / 100)
                        : customAmt;
                if (commissionForm.executor === 'iago')
                    assemblyRate = customAmt > 0 ? customComm / val : 0.03;
                else techCommission = customAmt > 0 ? customComm : val * 0.03;
            }
        }

        const totalIagoEarnings = val * baseRate + val * assemblyRate;

        // Determine which table to update
        const isLead = leads.some(l => l.id === selectedLeadForCommission.id);
        const tableName = isLead ? 'leads' : 'maintenance_orders';

        const updateData = isLead
            ? {
                  status: 'converted',
                  final_value: val,
                  cost_value: cost,
                  commission_value: totalIagoEarnings,
                  commission_ecosystem: isDigital || commissionForm.ecosystemCaptured,
                  commission_service: commissionForm.isAssembly,
                  performed_by_partner: commissionForm.executor === 'partner',
                  converted_at: new Date().toISOString(),
                  utm_parameters: {
                      ...(selectedLeadForCommission.utm_parameters || {}),
                      executor: userEmail,
                  },
              }
            : {
                  status: 'converted',
                  final_value: val,
                  cost_value: cost,
                  commission_value: totalIagoEarnings,
              };

        const { error } = await supabase
            .from(tableName)
            .update(updateData)
            .eq('id', selectedLeadForCommission.id);

        if (!error) {
            // Deduct stock for consumed products
            if (commissionForm.consumedProducts.length > 0) {
                for (const item of commissionForm.consumedProducts) {
                    const product = products.find(p => p.id === item.product_id);
                    if (product && product.stock_quantity >= item.quantity) {
                        await supabase
                            .from('products')
                            .update({ stock_quantity: product.stock_quantity - item.quantity })
                            .eq('id', item.product_id);
                    }
                }
                onRefreshProducts();
            }

            setShowCommissionModal(false);
            setCommissionForm({ ...commissionForm, consumedProducts: [] });
            onRefreshLeads();
            onRefreshOrders();
        } else {
            console.error('Supabase Error Details:', error);
            alert('Erro do Banco de Dados: ' + JSON.stringify(error, null, 2));
        }
    };

    return {
        showCommissionModal,
        selectedLeadForCommission,
        commissionForm,
        setCommissionForm,
        submitCommissionForm,
        openCommissionModal,
        closeCommissionModal,
        isCelularLead,
        getAssemblyExecutor,
    };
}
