'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

export function ToggleSupplierActive({ supplierId, active }: { supplierId: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const supabase = createCRMBrowserClient();
      await supabase.from('suppliers').update({ active: !active }).eq('id', supplierId);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded px-2 py-0.5 text-xs font-medium ${
        active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {active ? 'Ativo' : 'Inativo'}
    </button>
  );
}
