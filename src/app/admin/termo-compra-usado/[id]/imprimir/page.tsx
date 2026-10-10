import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { formatDateBR } from '@/app/admin/lib/datetime';
import { brand } from '@/lib/brand';
import { PrintButton } from './PrintButton';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function TermoCompraUsadoImprimirPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getAuthedProfile();
  if (!user) redirect('/admin/login');

  const { data: purchase, error } = await supabase
    .from('used_device_purchases')
    .select(`
      *,
      registrar:profiles!used_device_purchases_registered_by_fkey(full_name)
    `)
    .eq('id', id)
    .single();

  if (error || !purchase) {
    notFound();
  }

  const purchaseDate = new Date(purchase.created_at);
  const formattedDateFull = purchaseDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-zinc-100 p-4 sm:p-6 print:bg-white print:p-0">
      {/* BARRA DE AÇÕES (OCULTA NA IMPRESSÃO) */}
      <div className="mx-auto mb-6 max-w-4xl border-2 border-zinc-950 bg-white p-4 shadow-xs print:hidden flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/termo-compra-usado"
            className="border-2 border-zinc-950 bg-zinc-100 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 hover:bg-zinc-200 transition"
          >
            ← Voltar
          </Link>
          <div>
            <h2 className="font-mono text-xs font-bold uppercase text-zinc-950">
              Termo de Compra de Usado #{purchase.purchase_number}
            </h2>
            <p className="font-mono text-[11px] text-zinc-500">
              {purchase.seller_name} · {purchase.brand} {purchase.model}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PrintButton />
        </div>
      </div>

      {/* FOLHA A4 DO CONTRATO */}
      <div className="mx-auto max-w-[210mm] border-2 border-zinc-950 bg-white p-8 sm:p-10 font-sans text-zinc-950 shadow-md print:border-none print:shadow-none print:p-4 print:max-w-none">
        
        {/* CABEÇALHO DA LOJA */}
        <div className="border-b-2 border-zinc-950 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-zinc-950 font-mono">
                {brand.name.toUpperCase()}
              </h1>
              <p className="text-xs text-zinc-700 font-mono">
                {brand.address.street}, {brand.address.number} - Centro, {brand.address.city} - SP
              </p>
              <p className="text-xs text-zinc-700 font-mono">
                Telefone: {brand.phoneFormatted} · WhatsApp: {brand.whatsappFormatted}
              </p>
            </div>
            <div className="text-right border-2 border-zinc-950 p-2 bg-zinc-50">
              <span className="block font-mono text-[10px] uppercase font-bold text-zinc-500">TERMO Nº</span>
              <span className="font-mono text-base font-black text-zinc-950">
                #{purchase.purchase_number.toString().padStart(6, '0')}
              </span>
              <span className="block font-mono text-[10px] text-zinc-600 mt-0.5">
                {formatDateBR(purchase.created_at)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-300 text-center">
            <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-950">
              DECLARAÇÃO DE PROCEDÊNCIA LEGAL &amp; RECIBO DE COMPRA E VENDA DE EQUIPAMENTO USADO
            </h2>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              Instrumento Particular de Aquisição com Efeito de Quitação e Salvaguarda Legal (Art. 180 e 299 do Código Penal Brasileiro)
            </p>
          </div>
        </div>

        {/* 1. DADOS DO CLIENTE VENDEDOR */}
        <div className="mb-4 border border-zinc-950 p-3 bg-zinc-50">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 mb-2 border-b border-zinc-300 pb-1">
            1. DADOS DO VENDEDOR (PROPRIETÁRIO TRANSMITENTE)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="col-span-2">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Nome Completo:</span>
              <span className="font-bold text-zinc-950">{purchase.seller_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">CPF:</span>
              <span className="font-mono font-bold text-zinc-950">{purchase.seller_cpf}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">RG:</span>
              <span className="font-mono text-zinc-950">{purchase.seller_rg || 'Não informado'}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Telefone / WhatsApp:</span>
              <span className="font-mono text-zinc-950">{purchase.seller_phone}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Endereço Residencial:</span>
              <span className="text-zinc-950">{purchase.seller_address || 'Bragança Paulista - SP'}</span>
            </div>
          </div>
        </div>

        {/* 2. DADOS DO EQUIPAMENTO ADQUIRIDO */}
        <div className="mb-4 border border-zinc-950 p-3 bg-zinc-50">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 mb-2 border-b border-zinc-300 pb-1">
            2. ESPECIFICAÇÃO DO EQUIPAMENTO ADQUIRIDO
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Categoria:</span>
              <span className="font-bold uppercase text-zinc-950">{purchase.device_type}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Marca / Fabricante:</span>
              <span className="font-bold text-zinc-950">{purchase.brand}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Modelo / Versão:</span>
              <span className="font-bold text-zinc-950">{purchase.model} {purchase.color ? `· Cor: ${purchase.color}` : ''}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Número de Série (Serial):</span>
              <span className="font-mono font-bold text-zinc-950">{purchase.serial_number || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">IMEI 1:</span>
              <span className="font-mono font-bold text-zinc-950">{purchase.imei_1 || 'N/A'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">IMEI 2:</span>
              <span className="font-mono font-bold text-zinc-950">{purchase.imei_2 || 'N/A'}</span>
            </div>
            <div className="col-span-4 mt-1 pt-1 border-t border-zinc-200">
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Condição Física / Avarias / Acessórios:</span>
              <span className="text-zinc-800 italic">{purchase.condition_notes || 'Aparelho entregue nas condições visíveis e testadas no balcão.'}</span>
            </div>
          </div>
        </div>

        {/* 3. TRANSAÇÃO FINANCEIRA */}
        <div className="mb-4 border border-zinc-950 p-3 bg-zinc-50">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 mb-2 border-b border-zinc-300 pb-1">
            3. VALOR DA COMPRA E FORMA DE PAGAMENTO
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Valor Pago pelo Aparelho:</span>
              <span className="font-mono font-black text-sm text-zinc-950">{fmtBRL(purchase.purchase_price)}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Modalidade de Pagamento:</span>
              <span className="font-mono font-bold uppercase text-zinc-950">{purchase.payment_method}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Chave PIX Informada:</span>
              <span className="font-mono text-zinc-950">{purchase.pix_key || '—'}</span>
            </div>
          </div>
        </div>

        {/* 4. CLÁUSULAS JURÍDICAS E DECLARAÇÃO DE PROCEDÊNCIA */}
        <div className="mb-5 border border-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-800 space-y-2">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 border-b border-zinc-300 pb-1">
            4. CLÁUSULAS LEGAIS, DECLARAÇÃO DE PROCEDÊNCIA E ISENÇÃO DE RESPONSABILIDADE
          </h3>
          
          <p>
            <strong>CLÁUSULA 1ª (DA PROCEDÊNCIA E PROPRIEDADE LÍCITA):</strong> O <strong>VENDEDOR</strong> declara, sob as penas cabíveis do Código Penal Brasileiro (especialmente o Art. 180 que tipifica a Receptação e o Art. 299 de Falsidade Ideológica), que é o único e legítimo proprietário do equipamento qualificado neste termo, tendo-o adquirido por meios estritamente lícitos, encontrando-se o referido bem totalmente livre e desembaraçado de quaisquer ônus, litígios, dívidas, bloqueios, queixas de furto, roubo, perda ou apropriação indébita.
          </p>

          <p>
            <strong>CLÁUSULA 2ª (DA DESVINCULAÇÃO DE CONTAS E BLOQUEIOS):</strong> O <strong>VENDEDOR</strong> confirma expressamente que realizou o encerramento de sessão e a remoção definitiva de todas as contas vinculadas ao dispositivo (Apple ID / iCloud, Conta Google FRP, Samsung Account, Xiaomi Mi Cloud, contas corporativas MDM, senhas de inicialização e biometria), autorizando expressamente a formatação do aparelho e a restauração de seus padrões de fábrica para eventual revenda como seminovo.
          </p>

          <p>
            <strong>CLÁUSULA 3ª (DA EVICÇÃO E RESPONSABILIDADE FUTURA):</strong> Caso o aparelho venha a apresentar qualquer restrição superveniente (incluindo, mas não se limitando a bloqueios de IMEI junto à ANATEL/operadoras por queixa de roubo/furto/perda, pendências de leasing/financiamento ou ordem judicial), o <strong>VENDEDOR</strong> responderá civil e criminalmente por evicção e perdas e danos causados à adquirente <strong>CYBER INFORMÁTICA</strong> e a eventuais terceiros de boa-fé, ficando obrigado à restituição imediata e integral do valor recebido, corrigido monetariamente.
          </p>

          <p>
            <strong>CLÁUSULA 4ª (DO RECIBO E QUITAÇÃO):</strong> Com a conferência e pagamento do valor estipulado na Cláusula 3, o <strong>VENDEDOR</strong> confere à compradora plena, rasa, geral, irrevogável e irretratável quitação pela transação deste bem, transferindo a propriedade, posse e todos os direitos sobre o equipamento.
          </p>
        </div>

        {/* 5. DATA E ASSINATURAS */}
        <div className="pt-2">
          <p className="text-right text-xs font-mono text-zinc-700 mb-8">
            Bragança Paulista - SP, {formattedDateFull}.
          </p>

          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-t-2 border-zinc-950 pt-2">
                <p className="font-bold text-zinc-950 uppercase">{purchase.seller_name}</p>
                <p className="font-mono text-[11px] text-zinc-600">Vendedor (Cliente) · CPF: {purchase.seller_cpf}</p>
              </div>
            </div>

            <div>
              <div className="border-t-2 border-zinc-950 pt-2">
                <p className="font-bold text-zinc-950 uppercase">{brand.name.toUpperCase()}</p>
                <p className="font-mono text-[11px] text-zinc-600">
                  Responsável: {purchase.registrar?.full_name ?? 'Cyber Informática'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
