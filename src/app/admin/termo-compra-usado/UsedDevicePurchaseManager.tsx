'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { formatDateBR } from '@/app/admin/lib/datetime';

export type PurchaseRecord = {
  id: string;
  purchase_number: number;
  seller_name: string;
  seller_cpf: string;
  seller_rg: string | null;
  seller_phone: string;
  seller_address: string | null;
  device_type: string;
  brand: string;
  model: string;
  color: string | null;
  serial_number: string | null;
  imei_1: string | null;
  imei_2: string | null;
  purchase_price: number;
  payment_method: string;
  pix_key: string | null;
  condition_notes: string | null;
  icloud_google_removed: boolean;
  legal_declaration_accepted: boolean;
  stock_item_id: string | null;
  created_at: string;
  registrar?: { full_name: string } | null;
};

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseBRL(v: string): number {
  if (!v.trim()) return 0;
  const normalized = v.includes(',')
    ? v.replace(/\./g, '').replace(',', '.')
    : v;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function UsedDevicePurchaseManager({
  purchases,
  currentUserId,
  currentUserName,
}: {
  purchases: PurchaseRecord[];
  currentUserId: string;
  currentUserName: string;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vendedor
  const [sellerName, setSellerName] = useState('');
  const [sellerCpf, setSellerCpf] = useState('');
  const [sellerRg, setSellerRg] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');

  // Aparelho
  const [deviceType, setDeviceType] = useState('celular');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [imei1, setImei1] = useState('');
  const [imei2, setImei2] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');

  // Financeiro
  const [priceStr, setPriceStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [pixKey, setPixKey] = useState('');

  // Compliance
  const [icloudRemoved, setIcloudRemoved] = useState(true);
  const [legalAccepted, setLegalAccepted] = useState(true);
  const [addToStock, setAddToStock] = useState(true);

  async function handleRegisterPurchase(e: React.FormEvent) {
    e.preventDefault();
    const price = parseBRL(priceStr);

    if (!sellerName.trim() || !sellerCpf.trim() || !sellerPhone.trim()) {
      setError('Preencha os dados obrigatórios do cliente vendedor (Nome, CPF e Telefone).');
      return;
    }
    if (!brand.trim() || !model.trim()) {
      setError('Preencha a marca e modelo do aparelho.');
      return;
    }
    if (price <= 0) {
      setError('O valor pago pelo aparelho deve ser maior que zero.');
      return;
    }
    if (!legalAccepted || !icloudRemoved) {
      setError('É obrigatório confirmar a procedência lícita e a remoção de contas iCloud/Google.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createCRMBrowserClient();

      let createdStockItemId: string | null = null;

      // 1. Opcional: cadastra no estoque de vitrine como seminovo
      if (addToStock) {
        const stockName = `${deviceType.toUpperCase()}: ${brand} ${model}${color ? ` (${color})` : ''} - SEMINOVO`;
        const { data: stockItem, error: stockErr } = await supabase
          .from('stock_items')
          .insert({
            name: stockName,
            brand: brand.trim(),
            model: model.trim(),
            unit_price: price * 1.4, // Sugestão de margem bruta inicial de 40%
            cost_price: price,
            current_stock: 1,
            min_stock: 0,
            active: true,
          })
          .select()
          .single();

        if (!stockErr && stockItem) {
          createdStockItemId = stockItem.id;
        }
      }

      // 2. Cria registro de compra e compliance
      const { data: purchase, error: purchaseErr } = await supabase
        .from('used_device_purchases')
        .insert({
          seller_name: sellerName.trim(),
          seller_cpf: sellerCpf.trim(),
          seller_rg: sellerRg.trim() || null,
          seller_phone: sellerPhone.trim(),
          seller_address: sellerAddress.trim() || null,
          device_type: deviceType,
          brand: brand.trim(),
          model: model.trim(),
          color: color.trim() || null,
          serial_number: serialNumber.trim() || null,
          imei_1: imei1.trim() || null,
          imei_2: imei2.trim() || null,
          purchase_price: price,
          payment_method: paymentMethod,
          pix_key: pixKey.trim() || null,
          condition_notes: conditionNotes.trim() || null,
          icloud_google_removed: icloudRemoved,
          legal_declaration_accepted: legalAccepted,
          registered_by: currentUserId,
          stock_item_id: createdStockItemId,
        })
        .select()
        .single();

      if (purchaseErr) throw purchaseErr;

      setShowModal(false);
      router.push(`/admin/termo-compra-usado/${purchase.id}/imprimir`);
    } catch (err) {
      setError(`Erro ao cadastrar compra: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="border-2 border-zinc-950 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-zinc-950 text-white font-mono text-xs font-bold px-2 py-0.5 uppercase tracking-widest">
                COMPLIANCE // SEMINOVOS
              </span>
              <span className="font-mono text-xs text-zinc-500">
                Blindagem Jurídica contra Receptação (Art. 180 do Código Penal)
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-zinc-950">
              Compra de Aparelhos Usados &amp; Termos de Procedência
            </h1>
            <p className="mt-1 font-mono text-xs text-zinc-600">
              Emissão de Declaração de Procedência Legal e Recibo de Compra de Celulares, Notebooks e PCs de clientes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="border-2 border-zinc-950 bg-zinc-950 px-4 py-2 font-mono text-xs font-black uppercase tracking-wider text-white hover:bg-zinc-800 transition shadow-xs flex items-center gap-2"
          >
            <span>📄</span> + Nova Compra de Usado (Gerar Contrato)
          </button>
        </div>
      </div>

      {/* LISTAGEM DE COMPRAS DE USADOS */}
      <div className="border-2 border-zinc-950 bg-white shadow-xs">
        <div className="border-b-2 border-zinc-950 p-4 bg-zinc-50 flex items-center justify-between">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
            Aparelhos Adquiridos de Clientes ({purchases.length} registros)
          </h3>
          <span className="font-mono text-xs text-zinc-500">Termos Assinados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-xs font-mono">
            <thead className="bg-zinc-100 text-zinc-700 font-bold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-2.5">Nº Termo</th>
                <th className="px-4 py-2.5">Data</th>
                <th className="px-4 py-2.5">Vendedor (Cliente)</th>
                <th className="px-4 py-2.5">Aparelho Adquirido</th>
                <th className="px-4 py-2.5">Serial / IMEI</th>
                <th className="px-4 py-2.5 text-right">Valor Pago</th>
                <th className="px-4 py-2.5 text-center">Contrato A4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500 font-mono">
                    Nenhuma compra de usado registrada ainda. Clique acima para emitir o primeiro termo legal.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-2.5 font-bold text-zinc-950">#{p.purchase_number}</td>
                    <td className="px-4 py-2.5 text-zinc-500 whitespace-nowrap">{formatDateBR(p.created_at)}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-zinc-950">{p.seller_name}</div>
                      <div className="text-[10px] text-zinc-500">CPF: {p.seller_cpf} · Tel: {p.seller_phone}</div>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-zinc-950">
                      {p.brand} {p.model} {p.color ? `(${p.color})` : ''}
                      <span className="block text-[10px] text-zinc-500 uppercase">{p.device_type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600 text-[11px]">
                      {p.imei_1 ? `IMEI: ${p.imei_1}` : p.serial_number ? `Serial: ${p.serial_number}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-black text-sm text-zinc-950 whitespace-nowrap">
                      {fmtBRL(p.purchase_price)}
                    </td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <Link
                        href={`/admin/termo-compra-usado/${p.id}/imprimir`}
                        target="_blank"
                        className="border border-zinc-950 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 px-2.5 py-1 text-[11px] font-bold uppercase transition"
                      >
                        🖨️ Imprimir Termo
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO DE COMPRA DE USADO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl border-2 border-zinc-950 bg-white p-6 font-mono text-xs shadow-2xl my-8">
            <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-3">
              <div>
                <h3 className="font-black uppercase text-zinc-950 text-base">
                  Nova Compra de Aparelho Usado // Declaração de Procedência
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Preencha os dados do cliente vendedor para gerar o contrato legal de aquisição.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-black font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 border border-red-300 bg-red-50 p-2.5 text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterPurchase} className="mt-4 space-y-4">
              {/* DADOS DO VENDEDOR */}
              <div className="border border-zinc-300 p-3 bg-zinc-50 space-y-3">
                <p className="font-black uppercase text-zinc-900 text-[11px] border-b border-zinc-200 pb-1">
                  1. Dados Pessoais do Vendedor (Cliente)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">CPF *</label>
                    <input
                      type="text"
                      value={sellerCpf}
                      onChange={(e) => setSellerCpf(e.target.value)}
                      placeholder="Ex: 123.456.789-00"
                      className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">Telefone WhatsApp *</label>
                    <input
                      type="text"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      placeholder="Ex: 11 99999-9999"
                      className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">RG (opcional)</label>
                    <input
                      type="text"
                      value={sellerRg}
                      onChange={(e) => setSellerRg(e.target.value)}
                      placeholder="Ex: 12.345.678-9"
                      className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      value={sellerAddress}
                      onChange={(e) => setSellerAddress(e.target.value)}
                      placeholder="Ex: Rua das Flores, 120 - Centro, Bragança Paulista - SP"
                      className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* DADOS DO APARELHO */}
              <div className="border border-zinc-300 p-3 bg-zinc-50 space-y-3">
                <p className="font-black uppercase text-zinc-900 text-[11px] border-b border-zinc-200 pb-1">
                  2. Dados do Equipamento Adquirido
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">Tipo de Aparelho</label>
                    <select
                      value={deviceType}
                      onChange={(e) => setDeviceType(e.target.value)}
                      className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                    >
                      <option value="celular">Celular / Smartphone</option>
                      <option value="notebook">Notebook</option>
                      <option value="computador">Computador / Desktop</option>
                      <option value="tablet">Tablet / iPad</option>
                      <option value="outro">Outro Equipamento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">Marca *</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Ex: Apple, Samsung, Dell..."
                      className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">Modelo *</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Ex: iPhone 13, Inspiron 15..."
                      className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">Cor</label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="Ex: Azul Meia-Noite, Prata..."
                      className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">Número de Série</label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="Ex: C02G91..."
                      className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">IMEI 1 (se celular)</label>
                    <input
                      type="text"
                      value={imei1}
                      onChange={(e) => setImei1(e.target.value)}
                      placeholder="Ex: 356789123456789"
                      className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* FINANCEIRO & COMPLIANCE */}
              <div className="border border-zinc-300 p-3 bg-zinc-50 space-y-3">
                <p className="font-black uppercase text-zinc-900 text-[11px] border-b border-zinc-200 pb-1">
                  3. Valor da Compra &amp; Blindagem Jurídica
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">Valor Pago (R$) *</label>
                    <input
                      type="text"
                      value={priceStr}
                      onChange={(e) => setPriceStr(e.target.value)}
                      placeholder="Ex: 1.200,00"
                      className="w-full border-2 border-zinc-950 bg-white p-2 text-sm font-black text-zinc-950 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">Forma de Pagamento</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                    >
                      <option value="pix">PIX (Recomendado)</option>
                      <option value="dinheiro">Dinheiro em Espécie</option>
                      <option value="troca">Abatimento / Base de Troca</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">Chave Pix do Vendedor</label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Ex: CPF ou celular do titular..."
                      className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                {/* CHECKBOXES DE SEGURANÇA */}
                <div className="mt-3 space-y-2 pt-2 border-t border-zinc-200">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={icloudRemoved}
                      onChange={(e) => setIcloudRemoved(e.target.checked)}
                      className="mt-0.5 rounded-none"
                      required
                    />
                    <span className="text-[11px] text-zinc-800">
                      <strong>Contas e Senhas Removidas:</strong> O vendedor confirma a desvinculação completa de contas iCloud, Google, Samsung e senhas de bloqueio de BIOS/sistema.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={legalAccepted}
                      onChange={(e) => setLegalAccepted(e.target.checked)}
                      className="mt-0.5 rounded-none"
                      required
                    />
                    <span className="text-[11px] text-zinc-800">
                      <strong>Declaração de Procedência Lícita (Art. 180 CP):</strong> O vendedor declara ser o legítimo proprietário do bem, assumindo responsabilidade civil e criminal pela licitude do equipamento.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={addToStock}
                      onChange={(e) => setAddToStock(e.target.checked)}
                      className="mt-0.5 rounded-none"
                    />
                    <span className="text-[11px] text-emerald-900 font-bold">
                      Cadastrar automaticamente este seminovo no Estoque de vitrine da loja (`/admin/estoque`).
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="border border-zinc-300 bg-white px-4 py-2 text-zinc-700 font-bold hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-zinc-950 px-5 py-2 text-white font-bold uppercase hover:bg-zinc-800 transition disabled:opacity-50"
                >
                  {saving ? 'Registrando e Gerando Contrato...' : 'Salvar e Imprimir Contrato A4'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
