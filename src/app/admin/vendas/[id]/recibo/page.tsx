import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { formatDateBR, formatTimeBR } from '@/app/admin/lib/datetime';
import type { Sale, SaleItem } from '@/app/admin/types/database';
import { buildReciboText } from '@/app/admin/lib/reciboText';
import { ReciboPrintButton } from './ReciboPrintButton';
import { AutoPrint } from './AutoPrint';

export const dynamic = 'force-dynamic';

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: sale } = await supabase
    .from('sales')
    .select('*')
    .eq('id', id)
    .single();

  if (!sale) notFound();

  const { data: items } = await supabase
    .from('sale_items')
    .select('*')
    .eq('sale_id', id)
    .order('created_at');

  const reciboText = buildReciboText(sale, items ?? []);

  return (
    <div className="space-y-4">
      {/* Auto-print dispara impressão silenciosa na MPT-II via print-agent ou fallback window.print() */}
      <AutoPrint reciboText={reciboText} />

      <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b-2 border-zinc-950 pb-4">
        <div>
          <Link
            href={`/admin/vendas/${sale.id}`}
            className="font-mono text-xs font-bold uppercase text-zinc-600 hover:text-zinc-950 hover:underline"
          >
            ← Detalhes da venda
          </Link>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-zinc-950">Recibo</h1>
          <p className="text-xs font-mono uppercase text-zinc-600">
            Janela aberta automaticamente — impressão deve ter disparado.
            Se cancelou, clique em <strong>Imprimir novamente</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/vendas/${sale.id}/nota`}
            className="border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition"
          >
            📄 Nota / Comprovante (PDF / A4)
          </Link>
          <ReciboPrintButton />
        </div>
      </div>

      {/* Preview do recibo */}
      <div className="mx-auto max-w-md border-2 border-zinc-950 bg-white p-4 shadow-xs">
        <pre className="whitespace-pre font-mono text-xs leading-tight text-black">
          {reciboText}
        </pre>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 4mm !important; }
          main { max-width: none !important; padding: 0 !important; }
          div[class*="space-y"] > *:not(.no-print):not(pre):not(div) { display: none !important; }
          div[class*="border"][class*="bg-white"] {
            box-shadow: none !important;
            border: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
          pre {
            font-family: 'Courier New', monospace !important;
            font-size: 8pt !important;
            line-height: 1.1 !important;
            white-space: pre !important;
            color: black !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
