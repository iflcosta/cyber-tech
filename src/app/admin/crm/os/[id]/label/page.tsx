import { notFound, redirect } from 'next/navigation';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { LabelPrintButton } from './LabelPrintButton';
import { EQUIPMENT_TYPES, type EquipmentTypeValue } from '@/app/admin/crm/types/database';

export const dynamic = 'force-dynamic';

// Impressora alvo: Bematech MPT-II (termica fiscal) via Bluetooth COM9.
// Outras opcoes compativeis: qualquer termica 58mm (Elgin i9, Daruma, GENXP).
// NOTA: driver Generic / Text Only so' imprime ASCII. Sem acentos,
// sem emoji. Veja normalizacoes em normalize().
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

  ;(so as any).customer_name = (so as any).customer?.name ?? '(cliente removido)';
  ;(so as any).customer_phone = (so as any).customer?.phone ?? '';
  ;(so as any).assigned_to_name = (so as any).assigned?.full_name ?? null;

  const typeMeta = EQUIPMENT_TYPES.find((t) => t.value === (so.equipment_type as EquipmentTypeValue));
  const equip = [so.equipment_brand, so.equipment_model, so.equipment_color]
    .filter(Boolean)
    .join(' ');
  const created = new Date(so.created_at).toLocaleDateString('pt-BR');

  // Normaliza texto pra ASCII puro (compativel com driver Generic / Text Only)
  // IMPORTANTE: chamadas de normalize sao feitas ANTES do JSX porque
  // mudam a string que vai pro DOM. Nao altera acentuacao do CSS.
  const norm = (s: string) => (s ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove diacriticos
    .replace(/[^\x20-\x7E\n]/g, '?')                  // remove qualquer nao-ASCII
    .trim();

  const customerName = norm((so as any).customer_name);
  const customerPhone = norm((so as any).customer_phone);
  const equipNorm = norm(equip);
  const shortId = norm((so as any).short_id ?? '');
  const osNumber = norm((so as any).os_number ?? '');
  const createdNorm = norm(created);

  return (
    <>
      {/* Banner so na tela — some na impressao */}
      <div className="print:hidden mx-auto mb-4 max-w-2xl rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Etiqueta ASCII 58mm</strong> — otimizada pra impressora termica via
          driver Generic / Text Only (MPT-II Bluetooth, Elgin i9, etc).
        </p>
        <p className="mt-1 text-xs text-blue-700">
          Texto sem acentos e sem emoji pra compatibilidade com drivers basicos.
          Cola no notebook com fita adesiva.
        </p>
        <LabelPrintButton />
      </div>

      {/* ============ ETIQUETA ============ */}
      <article
        className="label mx-auto bg-white text-slate-900 shadow print:shadow-none"
        style={{
          width: '58mm',
          padding: '2mm 3mm',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        }}
      >
        {/* Margem de rasgo no topo: 10mm de papel em branco */}
        {/* pra voce poder segurar e rasgar no dente da impressora */}
        <div style={{ height: '10mm' }} aria-hidden="true" />

        {/* Linha de corte sutil (visual) — ajuda a saber ONDE rasgar */}
        <div
          style={{
            borderTop: '0.5pt dashed #cbd5e1',
            marginBottom: '1.5mm',
          }}
          aria-hidden="true"
        />

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
          <span style={{ fontSize: '8pt', fontWeight: 700, letterSpacing: '0.05em' }}>
            CYBER INFORMATICA
          </span>
          <span style={{ fontSize: '7.5pt', color: '#64748b' }}>
            {createdNorm}
          </span>
        </header>

        {/* OS: destaque absoluto */}
        <div style={{ marginBottom: '1.5mm' }}>
          <div
            style={{
              fontSize: '22pt',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: '#0f172a',
            }}
          >
            {shortId}
          </div>
          {osNumber && (
            <div
              style={{
                fontSize: '6.5pt',
                color: '#64748b',
                marginTop: '0.3mm',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ({osNumber})
            </div>
          )}
        </div>

        {/* Cliente (nome grande) + telefone (logo abaixo) */}
        <div style={{ marginBottom: '1mm' }}>
          <div
            style={{
              fontSize: '6.5pt',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#64748b',
              textTransform: 'uppercase',
            }}
          >
            CLIENTE
          </div>
          <div
            style={{
              fontSize: '11pt',
              fontWeight: 700,
              lineHeight: 1.1,
              marginTop: '0.4mm',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {customerName}
          </div>
          {customerPhone && (
            <div
              style={{
                fontSize: '9pt',
                fontWeight: 500,
                lineHeight: 1.2,
                marginTop: '0.5mm',
                color: '#0f172a',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Tel: {customerPhone}
            </div>
          )}
        </div>

        {/* Aparelho */}
        {equipNorm && (
          <div style={{ marginBottom: '1mm' }}>
            <div
              style={{
                fontSize: '6.5pt',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: '#64748b',
                textTransform: 'uppercase',
              }}
            >
              APARELHO
            </div>
            <div style={{ fontSize: '9pt', fontWeight: 500, lineHeight: 1.15, marginTop: '0.4mm' }}>
              {norm(typeMeta?.label ?? '')}
              {equipNorm ? ` - ${equipNorm}` : ''}
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
              fontSize: '7.5pt',
              lineHeight: 1.2,
              color: '#475569',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {norm(so.reported_defect)}
          </div>
        )}
      </article>

      <style>{`
        @page {
          size: 58mm auto;
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
            /* A margem de rasgo (10mm) ja' esta' dentro do article */
          }
        }
      `}</style>
    </>
  );
}
