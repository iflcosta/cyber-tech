import { notFound, redirect } from 'next/navigation';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { LabelPrintButton } from './LabelPrintButton';
import { EQUIPMENT_TYPES, type EquipmentTypeValue } from '@/app/admin/crm/types/database';

export const dynamic = 'force-dynamic';

// Impressora alvo: Brother QL-600 / QL-800 com rolo DK-22210
// (papel continuo 62mm, recorte automatico).
// Outras opcoes compativeis: qualquer impressora termica 58-62mm
// (Mercado Livre, AliExpress, R$150-300) — o conteudo escala.
//
// @page size: 62mm x altura variavel (Brother recorta automaticamente).
// Margem 2mm pra nao cortar conteudo nas bordas.
export default async function OSLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/crm/login');

  const { data: so } = await supabase
    .from('service_orders')
    .select(`
      *,
      customer:customers(name, phone),
      assigned:profiles!service_orders_assigned_to_fkey(full_name)
    `)
    .eq('id', id)
    .single();
  if (!so) notFound();

  // Normalizar campos que vinham da view
  ;(so as any).customer_name = (so as any).customer?.name ?? '(cliente removido)';
  ;(so as any).customer_phone = (so as any).customer?.phone ?? '';
  ;(so as any).assigned_to_name = (so as any).assigned?.full_name ?? null;

  const typeMeta = EQUIPMENT_TYPES.find((t) => t.value === (so.equipment_type as EquipmentTypeValue));
  const equip = [so.equipment_brand, so.equipment_model, so.equipment_color]
    .filter(Boolean)
    .join(' ');
  const created = new Date(so.created_at).toLocaleDateString('pt-BR');

  return (
    <>
      {/* Banner so na tela — some na impressao */}
      <div className="print:hidden mx-auto mb-4 max-w-2xl rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Etiqueta física 62mm</strong> — otimizada pra impressora de etiqueta
          (Brother QL-600/800 com rolo DK-22210, ou similar).
        </p>
        <p className="mt-1 text-xs text-blue-700">
          Conteúdo: <strong>short_id</strong> (OS-0001) em destaque, nome do cliente,
          telefone, aparelho, data de entrada. Sem QR (conforme decisão).
        </p>
        <LabelPrintButton />
      </div>

      {/* ============ ETIQUETA ============ */}
      {/* 62mm de largura; altura variavel (~50mm) — Brother recorta automaticamente */}
      <article
        className="label mx-auto bg-white text-slate-900 shadow print:shadow-none"
        style={{
          width: '62mm',
          padding: '2mm 3mm',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header: marca + data (linha fina) */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderBottom: '0.5pt solid #cbd5e1',
            paddingBottom: '1mm',
            marginBottom: '1.5mm',
          }}
        >
          <span style={{ fontSize: '7pt', fontWeight: 600, letterSpacing: '0.05em' }}>
            CYBER INFORMÁTICA
          </span>
          <span style={{ fontSize: '6.5pt', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
            {created}
          </span>
        </header>

        {/* OS: destaque absoluto */}
        <div style={{ marginBottom: '1.5mm' }}>
          <div
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '22pt',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: '#0f172a',
            }}
          >
            {so.short_id}
          </div>
        </div>

        {/* Cliente (nome grande) + telefone (logo abaixo) */}
        <div style={{ marginBottom: '1mm' }}>
          <div
            style={{
              fontSize: '6pt',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#64748b',
              textTransform: 'uppercase',
            }}
          >
            Cliente
          </div>
          <div
            style={{
              fontSize: '11pt',
              fontWeight: 700,
              lineHeight: 1.1,
              marginTop: '0.5mm',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {so.customer_name}
          </div>
          {so.customer_phone && (
            <div
              style={{
                fontSize: '9pt',
                fontWeight: 500,
                lineHeight: 1.2,
                marginTop: '0.5mm',
                color: '#0f172a',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.01em',
              }}
            >
              📞 {so.customer_phone}
            </div>
          )}
        </div>

        {/* Aparelho */}
        {equip && (
          <div style={{ marginBottom: '1mm' }}>
            <div
              style={{
                fontSize: '6pt',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              Aparelho
            </div>
            <div style={{ fontSize: '8.5pt', fontWeight: 500, lineHeight: 1.1, marginTop: '0.5mm' }}>
              {typeMeta?.label}
              {equip ? ` · ${equip}` : ''}
            </div>
          </div>
        )}

        {/* Defeito (1 linha, truncate) — opcional mas util no balcao */}
        {so.reported_defect && (
          <div
            style={{
              marginTop: '1.5mm',
              paddingTop: '1mm',
              borderTop: '0.3pt dashed #e2e8f0',
              fontSize: '7pt',
              lineHeight: 1.15,
              color: '#475569',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {so.reported_defect}
          </div>
        )}
      </article>

      <style>{`
        @page {
          size: 62mm auto;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0;
            padding: 0;
            background: white;
          }
          body * { visibility: hidden; }
          .label, .label * { visibility: visible; }
          .label {
            position: absolute;
            top: 0;
            left: 0;
            margin: 0;
            box-shadow: none;
          }
        }
      `}</style>
    </>
  );
}
