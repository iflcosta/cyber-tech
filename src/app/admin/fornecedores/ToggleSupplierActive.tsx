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
      className={`border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ${
        active
          ? 'border-emerald-700 bg-emerald-100 text-emerald-950 hover:bg-emerald-200'
          : 'border-zinc-300 bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
      }`}
    >
      {active ? 'Ativo' : 'Inativo'}
    </button>
  );
}
