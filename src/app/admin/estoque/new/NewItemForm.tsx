'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { STOCK_CATEGORY_SUGGESTIONS } from '@/app/admin/types/database';

function formatBRLInput(v: string): string {
  return v.replace(/\./g, '').replace(',', '.');
}

function parseBRLInput(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(formatBRLInput(v));
  return Number.isFinite(n) ? n : null;
}

export function NewItemForm({ initialShowroom = false }: { initialShowroom?: boolean }) {
  const router = useRouter();
  const [isShowroomMode, setIsShowroomMode] = useState(initialShowroom);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ean13, setEan13] = useState('');
  const [internalSku, setInternalSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(initialShowroom ? 'PC Pronta-Entrega' : '');
  const [shelfLocation, setShelfLocation] = useState(
    initialShowroom ? 'Showroom Térreo (Bancada)' : '',
  );
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [minStock, setMinStock] = useState(initialShowroom ? '1' : '5');
  const [notes, setNotes] = useState('');

  // Campos estruturados para o Modo Showroom
  const [pcCpu, setPcCpu] = useState('');
  const [pcGpu, setPcGpu] = useState('');
  const [pcRam, setPcRam] = useState('16GB DDR4 3200MHz Dual-Channel');
  const [pcSsd, setPcSsd] = useState('SSD 1TB NVMe M.2');
  const [pcCase, setPcCase] = useState('Fonte 600W 80 Plus + Gabinete Aquário Vidro');
  const [pcSummary, setPcSummary] = useState('');
  const [pcRuns, setPcRuns] = useState('CS2, Valorant, Warzone, GTA V / FiveM, Fortnite');
  const [pcImageUrl, setPcImageUrl] = useState('');
  const [pcInstallment, setPcInstallment] = useState('');

  function toggleMode(showroom: boolean) {
    setIsShowroomMode(showroom);
    if (showroom) {
      setCategory('PC Pronta-Entrega');
      setShelfLocation('Showroom Térreo (Bancada)');
      setMinStock('1');
    } else if (category === 'PC Pronta-Entrega') {
      setCategory('');
      setShelfLocation('');
      setMinStock('5');
    }
  }

  async function submit() {
    if (!name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    const price = parseBRLInput(unitPrice);
    if (price === null || price <= 0) {
      setError('Preço de venda é obrigatório e deve ser maior que zero.');
      return;
    }
    const cost = unitCost.trim() ? parseBRLInput(unitCost) : null;
    const minN = parseInt(minStock, 10);
    const eanClean = ean13.trim().replace(/\s/g, '') || null;
    if (eanClean && !/^\d{8,13}$/.test(eanClean)) {
      setError('EAN-13 inválido (deve ter 8 a 13 dígitos).');
      return;
    }

    const compiledNotes = isShowroomMode
      ? [
          pcSummary.trim() ? `Resumo: ${pcSummary.trim()}` : '',
          pcCpu.trim() ? `CPU: ${pcCpu.trim()}` : '',
          pcGpu.trim() ? `GPU: ${pcGpu.trim()}` : '',
          pcRam.trim() ? `RAM: ${pcRam.trim()}` : '',
          pcSsd.trim() ? `SSD: ${pcSsd.trim()}` : '',
          pcCase.trim() ? `Gabinete: ${pcCase.trim()}` : '',
          pcRuns.trim() ? `Roda: ${pcRuns.trim()}` : '',
          pcImageUrl.trim() ? `Foto: ${pcImageUrl.trim()}` : '',
          pcInstallment.trim() ? `Parcelamento: ${pcInstallment.trim()}` : '',
          notes.trim() ? `Obs: ${notes.trim()}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      : notes.trim() || null;

    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { data, error: insErr } = await supabase
        .from('stock_items')
        .insert({
          ean13: eanClean,
          internal_sku: internalSku.trim() || null,
          name: name.trim(),
          category: isShowroomMode ? 'PC Pronta-Entrega' : category.trim() || null,
          shelf_location: shelfLocation.trim() || null,
          brand: isShowroomMode ? pcCpu.trim() || brand.trim() || 'Custom Cyber' : brand.trim() || null,
          model: isShowroomMode ? pcSummary.trim() || model.trim() || 'Pronta-Entrega' : model.trim() || null,
          unit_cost: cost,
          unit_price: price,
          current_stock: isShowroomMode ? 1 : 0,
          min_stock: Number.isFinite(minN) ? minN : 1,
          notes: compiledNotes,
        })
        .select('id')
        .single();
      if (insErr) throw insErr;

      router.push(`/admin/estoque/${data.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="border-2 border-zinc-950 bg-white p-4 sm:p-6">
      {/* Seletor de Modo: Item Comum vs PC Showroom Pronta-Entrega */}
      <div className="mb-6 grid grid-cols-2 border border-zinc-950">
        <button
          type="button"
          onClick={() => toggleMode(false)}
          className={`py-2.5 px-3 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer ${
            !isShowroomMode ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          Peça / Cabo / Periférico
        </button>
        <button
          type="button"
          onClick={() => toggleMode(true)}
          className={`py-2.5 px-3 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer ${
            isShowroomMode ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          PC Montado (Publicar no Showroom do Site)
        </button>
      </div>

      <div className="space-y-4">
        <Field label={isShowroomMode ? 'Título da Máquina no Showroom *' : 'Nome do Item *'}>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            placeholder={
              isShowroomMode
                ? 'Ex: PC Gamer Cyber Stealth RTX 4060 / Ryzen 5'
                : 'Ex: Cabo DisplayPort 1.4 8K 1.8m'
            }
          />
        </Field>

        {isShowroomMode ? (
          <div className="border border-zinc-300 bg-zinc-50 p-4 space-y-3">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
              FICHA TÉCNICA PARA EXIBIÇÃO NO SITE (#SHOWROOM)
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Processador (CPU) *">
                <input
                  value={pcCpu}
                  onChange={(e) => setPcCpu(e.target.value)}
                  className="form-input"
                  placeholder="Ex: AMD Ryzen 5 5600 (6-Core / 12-Thread)"
                />
              </Field>
              <Field label="Placa de Vídeo (GPU) *">
                <input
                  value={pcGpu}
                  onChange={(e) => setPcGpu(e.target.value)}
                  className="form-input"
                  placeholder="Ex: GeForce RTX 4060 8GB ou Radeon Vega Integrada"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Memória RAM">
                <input
                  value={pcRam}
                  onChange={(e) => setPcRam(e.target.value)}
                  className="form-input"
                  placeholder="Ex: 16GB DDR4 3200MHz Dual-Channel"
                />
              </Field>
              <Field label="Armazenamento (SSD / NVMe)">
                <input
                  value={pcSsd}
                  onChange={(e) => setPcSsd(e.target.value)}
                  className="form-input"
                  placeholder="Ex: SSD 1TB NVMe M.2 Gen4"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Fonte & Gabinete">
                <input
                  value={pcCase}
                  onChange={(e) => setPcCase(e.target.value)}
                  className="form-input"
                  placeholder="Ex: Fonte 600W 80 Plus + Gabinete Aquário Vidro"
                />
              </Field>
              <Field label="Resumo / Destaque Curto">
                <input
                  value={pcSummary}
                  onChange={(e) => setPcSummary(e.target.value)}
                  className="form-input"
                  placeholder="Ex: Pronto para Full HD Ultra, BIOS atualizada e Windows 11 Pro"
                />
              </Field>
            </div>

            <Field label="Jogos ou Programas que Roda (Separados por vírgula)">
              <input
                value={pcRuns}
                onChange={(e) => setPcRuns(e.target.value)}
                className="form-input"
                placeholder="Ex: CS2, Valorant, Warzone, GTA V / FiveM, Fortnite"
              />
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setPcRuns('CS2, Valorant, Warzone, GTA V / FiveM, Fortnite, EA FC')}
                  className="px-2 py-0.5 border border-zinc-400 bg-white font-mono text-[10px] font-bold text-zinc-800 hover:bg-zinc-200 cursor-pointer"
                >
                  + Preset Gamer
                </button>
                <button
                  type="button"
                  onClick={() => setPcRuns('AutoCAD, Revit, SketchUp, Lumion, Premiere Pro, Render 3D')}
                  className="px-2 py-0.5 border border-zinc-400 bg-white font-mono text-[10px] font-bold text-zinc-800 hover:bg-zinc-200 cursor-pointer"
                >
                  + Preset Workstation
                </button>
                <button
                  type="button"
                  onClick={() => setPcRuns('Sistemas ERP, Pacote Office, Contabilidade, Estudos, 2 Monitores')}
                  className="px-2 py-0.5 border border-zinc-400 bg-white font-mono text-[10px] font-bold text-zinc-800 hover:bg-zinc-200 cursor-pointer"
                >
                  + Preset Office
                </button>
              </div>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Condição de Parcelamento (Opcional — Automático se vazio)">
                <input
                  value={pcInstallment}
                  onChange={(e) => setPcInstallment(e.target.value)}
                  className="form-input"
                  placeholder="Ex: ou em até 12x de R$ 369,00 no cartão"
                />
              </Field>
              <Field label="Foto Real da Máquina (URL Opcional)">
                <input
                  value={pcImageUrl}
                  onChange={(e) => setPcImageUrl(e.target.value)}
                  className="form-input"
                  placeholder="https://..."
                />
              </Field>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="EAN-13 (código de barras)">
                <input
                  value={ean13}
                  onChange={(e) => setEan13(e.target.value)}
                  className="form-input font-mono"
                  placeholder="7891234567890"
                  maxLength={13}
                />
              </Field>
              <Field label="SKU interno (auto se vazio)">
                <input
                  value={internalSku}
                  onChange={(e) => setInternalSku(e.target.value)}
                  className="form-input font-mono"
                  placeholder="CY-RAM-DDR4-8G-00001"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Categoria">
                <input
                  list="stock-category-suggestions"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-input"
                  placeholder="Ex: Memórias, Cabos ou PC Pronta-Entrega"
                />
                <datalist id="stock-category-suggestions">
                  {STOCK_CATEGORY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label="Localização / Gaveta">
                <input
                  value={shelfLocation}
                  onChange={(e) => setShelfLocation(e.target.value)}
                  className="form-input"
                  placeholder="Ex: Gaveta 04 / Showroom Térreo"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Marca">
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="form-input"
                  placeholder="Ex: Kingston / Ugreen"
                />
              </Field>
              <Field label="Modelo">
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="form-input"
                  placeholder="Ex: NV2 1TB"
                />
              </Field>
            </div>
          </>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Custo de Montagem/Compra (R$)">
            <input
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="form-input font-mono"
              placeholder="0,00"
              inputMode="decimal"
            />
          </Field>
          <Field label="Preço de Venda à Vista / Pix (R$) *">
            <input
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="form-input font-mono font-bold"
              placeholder="Ex: 3890,00"
              inputMode="decimal"
            />
          </Field>
          <Field label="Estoque mínimo (alerta)">
            <input
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="form-input font-mono"
            />
          </Field>
        </div>

        <Field label="Observações internas (opcional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input"
            rows={2}
            placeholder="Anotações internas sobre o item ou números de série das peças"
          />
        </Field>

        <p className="border border-zinc-300 bg-zinc-100 p-3 font-mono text-xs text-zinc-700">
          {isShowroomMode ? (
            <>
              <strong>Publicação Imediata:</strong> Ao salvar neste modo, a máquina já entra com{' '}
              <strong>1 unidade disponível</strong> e aparece automaticamente na seção{' '}
              <strong>#showroom</strong> da página inicial do site.
            </>
          ) : (
            <>
              <strong>Estoque inicial:</strong> começa em 0. Depois de cadastrar, registre uma
              movimentação de <em>Entrada</em> na página do item para adicionar o saldo.
            </>
          )}
        </p>
      </div>

      {error && (
        <p className="mt-3 border-2 border-zinc-950 bg-zinc-100 p-2.5 font-mono text-xs font-bold text-zinc-950">
          [ERRO] {error}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="border border-zinc-400 bg-white px-4 py-2 font-mono text-xs font-bold uppercase text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="bg-zinc-950 px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
        >
          {submitting
            ? 'Salvando…'
            : isShowroomMode
              ? 'Publicar Máquina no Showroom'
              : 'Cadastrar Item'}
        </button>
      </div>

      <style jsx global>{`
        .form-input {
          width: 100%;
          border-radius: 0px;
          border: 1px solid rgb(161 161 170);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          line-height: 1.5;
          color: rgb(9 9 11);
          background: white;
        }
        .form-input:focus {
          outline: none;
          border-color: rgb(9 9 11);
          box-shadow: 0 0 0 1px rgb(9 9 11);
        }
        .form-input::placeholder {
          color: rgb(161 161 170);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-xs font-bold uppercase text-zinc-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
