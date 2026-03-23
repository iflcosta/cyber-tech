'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/product';
import type { PdvForm } from '@/types/admin';
import type { Executor } from '@/types/admin';

const defaultPdvForm: PdvForm = {
    customerName: '',
    discountType: 'fixed',
    discountValue: 0,
    ecosystemCaptured: false,
    isAssembly: false,
    executor: 'owner',
    customCommissionType: 'percent',
    customCommissionAmount: '',
    manualFinalValue: '',
    serviceDescription: '',
    consumedProducts: [],
};

interface UsePdvFormParams {
    products: Product[];
    currentExecutor: Executor;
    userEmail: string | null;
    onRefreshLeads: () => void;
    onRefreshProducts: () => void;
}

export function usePdvForm({
    products,
    currentExecutor,
    userEmail,
    onRefreshLeads,
    onRefreshProducts,
}: UsePdvFormParams) {
    const [showPdvModal, setShowPdvModal] = useState(false);
    const [pdvForm, setPdvForm] = useState<PdvForm>(defaultPdvForm);
    const [pdvProductSearch, setPdvProductSearch] = useState('');
    const [pdvProductCategory, setPdvProductCategory] = useState('');
    const [pdvProductQty, setPdvProductQty] = useState(1);
    const [manualProductSelect, setManualProductSelect] = useState('');

    const openPdvModal = () => setShowPdvModal(true);

    const closePdvModal = () => setShowPdvModal(false);

    const submitPdvForm = async (e: React.FormEvent) => {
        e.preventDefault();

        const productSubtotal = pdvForm.consumedProducts.reduce(
            (sum, item) => sum + ((item.price ?? 0) * item.quantity),
            0
        );
        const manualOverride = parseFloat(pdvForm.manualFinalValue) || 0;
        const subtotal = manualOverride > 0 ? manualOverride : productSubtotal;
        const discountAmount =
            pdvForm.discountType === 'percentage'
                ? subtotal * (pdvForm.discountValue / 100)
                : pdvForm.discountValue;
        const val = Math.max(0, subtotal - discountAmount);

        // Ecossistema: 8% padrão, ou 5% se valor bruto > 8000
        let baseRate = 0;
        if (pdvForm.ecosystemCaptured) {
            baseRate = subtotal > 8000 ? 0.05 : 0.08;
        }

        // Assembly Commission: always manual when isAssembly is active
        let assemblyCommission = 0;
        if (pdvForm.isAssembly) {
            const customAmt = parseFloat(pdvForm.customCommissionAmount) || 0;
            assemblyCommission =
                customAmt > 0
                    ? pdvForm.customCommissionType === 'percent'
                        ? subtotal * (customAmt / 100)
                        : customAmt
                    : 0;
        }

        const totalCommission = subtotal * baseRate + assemblyCommission;

        const { error } = await supabase.from('leads').insert([
            {
                client_name: pdvForm.customerName || 'Cliente Balcão',
                interest_type: 'venda',
                description: pdvForm.serviceDescription || null,
                status: 'converted',
                marketing_source: pdvForm.ecosystemCaptured ? 'site' : 'balcao',
                final_value: val,
                commission_value: totalCommission,
                commission_ecosystem: pdvForm.ecosystemCaptured,
                commission_service: pdvForm.isAssembly,
                performed_by_partner: currentExecutor === 'partner',
                converted_at: new Date().toISOString(),
                payment_status: 'paid',
                utm_parameters: { executor: userEmail },
            },
        ]);

        if (!error) {
            // Deduct stock for consumed products by specified quantity
            if (pdvForm.consumedProducts.length > 0) {
                for (const item of pdvForm.consumedProducts) {
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

            setShowPdvModal(false);
            setPdvForm(defaultPdvForm);
            setPdvProductSearch('');
            setPdvProductCategory('');
            setPdvProductQty(1);
            setManualProductSelect('');
            onRefreshLeads();
        } else {
            console.error('PDV Error:', error);
            alert('Erro ao registrar PDV.');
        }
    };

    return {
        showPdvModal,
        pdvForm,
        setPdvForm,
        pdvProductSearch,
        setPdvProductSearch,
        pdvProductCategory,
        setPdvProductCategory,
        pdvProductQty,
        setPdvProductQty,
        manualProductSelect,
        setManualProductSelect,
        openPdvModal,
        closePdvModal,
        submitPdvForm,
    };
}
