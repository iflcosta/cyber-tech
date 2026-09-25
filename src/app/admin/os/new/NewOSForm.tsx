'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { EQUIPMENT_TYPES, ENTRY_CHECKLIST_FIELDS, type EquipmentTypeValue } from '@/app/admin/types/database';

/**
 * Foto de defeito é tirada direto do celular do técnico — câmeras
 * modernas geram 3-12MB por arquivo (vários megapixels), muito além
 * do necessário pra uma foto de referência exibida como thumbnail na
 * OS. Sem compressão, isso ia direto pro Storage e voltava do
 * tamanho original toda vez que alguém abria a OS depois — parte do
 * porquê o sistema tava "lento" (auditoria de performance).
 *
 * Reduz no navegador antes do upload: redimensiona pro maior lado
 * não passar de 1600px e reencoda em JPEG a 80% — dá pra zoom
 * confortável na tela sem carregar o arquivo original inteiro.
 * Se der qualquer problema (arquivo não é imagem, Canvas falha),
 * cai pro arquivo original em vez de travar o upload.
 */
async function compressImage(file: File, maxDimension = 1600, quality = 0.8): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

type CustomerMatch = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  osCount: number;
};

export function NewOSForm({
  currentUserId,
  initialCustomer,
}: {
  currentUserId: string;
  /** Pré-seleciona o cliente (ex: veio do botão "+ Nova OS" na ficha do cliente). */
  initialCustomer?: CustomerMatch;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [customerMatches, setCustomerMatches] = useState<CustomerMatch[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMatch | null>(initialCustomer ?? null);

  // Busca cliente já cadastrado enquanto digita telefone ou nome —
  // evita criar um customer novo pra quem já veio na loja antes.
  useEffect(() => {
    if (selectedCustomer) return; // já escolheu, não busca mais
    const digits = customer.phone.replace(/\D/g, '');
    const nameQuery = customer.name.trim();
    if (digits.length < 4 && nameQuery.length < 3) {
      setCustomerMatches([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchingCustomer(true);
      try {
        const supabase = createCRMBrowserClient();
        let query = supabase
          .from('customers')
          .select('id, name, phone, email')
          .limit(5);
        query = digits.length >= 4
          ? query.ilike('phone_search', `%${digits}%`)
          : query.ilike('name', `%${nameQuery}%`);
        const { data } = await query;
        const withCounts = await Promise.all(
          (data ?? []).map(async (c) => {
            const { count } = await supabase
              .from('service_orders')
              .select('id', { count: 'exact', head: true })
              .eq('customer_id', c.id);
            return { ...c, osCount: count ?? 0 };
          }),
        );
        setCustomerMatches(withCounts);
      } finally {
        setSearchingCustomer(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [customer.phone, customer.name, selectedCustomer]);

  function pickCustomer(match: CustomerMatch) {
    setSelectedCustomer(match);
    setCustomer({ name: match.name, phone: match.phone ?? '', email: match.email ?? '' });
    setCustomerMatches([]);
  }

  function clearCustomerSelection() {
    setSelectedCustomer(null);
    setCustomer({ name: '', phone: '', email: '' });
  }
  const [equipment, setEquipment] = useState({
    type: 'notebook' as EquipmentTypeValue,
    brand: '',
    model: '',
    color: '',
    serial: '',
    password: '',
  });
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    Object.fromEntries(ENTRY_CHECKLIST_FIELDS.map((f) => [f.key, false])),
  );
  const [accessories, setAccessories] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [defect, setDefect] = useState('');
  const [initialLaborCost, setInitialLaborCost] = useState('');
  const [approvedOnCounter, setApprovedOnCounter] = useState(false);
  const [blocking, setBlocking] = useState('');
  const [estimatedReady, setEstimatedReady] = useState('');

  function next() {
    if (step === 1 && !customer.name.trim()) {
      setError('Nome do cliente é obrigatório.');
      return;
    }
    // Computador (principalmente montado) não tem "modelo" de fábrica —
    // só notebook/celular/tablet costumam ter um modelo real e conhecido.
    if (step === 2 && !equipment.model.trim() && !['outro', 'computador'].includes(equipment.type)) {
      setError('Modelo do aparelho é obrigatório.');
      return;
    }
    setError(null);
    setStep((s) => Math.min(3, s + 1));
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingPhotos(true);
    setPhotoError(null);
    try {
      const supabase = createCRMBrowserClient();
      const uploaded: string[] = [];
      for (const rawFile of Array.from(files)) {
        const file = await compressImage(rawFile);
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('equipment-photos')
          .upload(path, file, { contentType: file.type || 'image/jpeg' });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('equipment-photos').getPublicUrl(path);
        uploaded.push(pub.publicUrl);
      }
      setPhotos((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setPhotoError((e as Error).message);
    } finally {
      setUploadingPhotos(false);
    }
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  async function submit() {
    if (!defect.trim()) {
      setError('Defeito relatado é obrigatório.');
      return;
    }
    const parsedLabor = initialLaborCost.trim()
      ? Number(initialLaborCost.replace(/\./g, '').replace(',', '.'))
      : 0;
    if (!Number.isFinite(parsedLabor) || parsedLabor < 0) {
      setError('Valor do serviço inválido.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      // 1. cliente — reaproveita se já foi selecionado na busca, senão cria novo
      let customerId = selectedCustomer?.id;
      if (!customerId) {
        const { data: newCustomer, error: custErr } = await supabase
          .from('customers')
          .insert({
            name: customer.name.trim(),
            phone: customer.phone.trim() || null,
            email: customer.email.trim() || null,
          })
          .select('id')
          .single();
        if (custErr) throw custErr;
        customerId = newCustomer.id;
      }

      const initialStatus = approvedOnCounter ? 'in_progress' : 'awaiting_approval';

      // 2. OS
      const { data: newOS, error: osErr } = await supabase
        .from('service_orders')
        .insert({
          customer_id: customerId,
          status: initialStatus,
          equipment_type: equipment.type,
          equipment_brand: equipment.brand.trim() || null,
          equipment_model: equipment.model.trim() || null,
          equipment_color: equipment.color.trim() || null,
          equipment_serial: equipment.serial.trim() || null,
          equipment_password: equipment.password.trim() || null,
          reported_defect: defect.trim(),
          labor_cost: parsedLabor,
          estimated_value: parsedLabor > 0 ? parsedLabor : null,
          entry_checklist: checklist,
          accessories_in: accessories.trim() || null,
          equipment_photos: photos,
          blocking_reason: blocking.trim() || null,
          estimated_ready_at: estimatedReady || null,
          created_by: currentUserId,
        })
        .select('id, os_number')
        .single();
      if (osErr) throw osErr;

      // 3. evento inicial
      await supabase.from('service_order_events').insert({
        service_order_id: newOS.id,
        event_type: 'created',
        to_value: initialStatus,
        note: approvedOnCounter
          ? `Aprovado na abertura (balcão)${parsedLabor > 0 ? ` — Serviço R$ ${parsedLabor.toFixed(2).replace('.', ',')}` : ''}`
          : parsedLabor > 0
            ? `Valor pré-informado: R$ ${parsedLabor.toFixed(2).replace('.', ',')}`
            : null,
        author_id: currentUserId,
      });

      router.push(`/admin/os/${newOS.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                n <= step ? 'bg-black text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {n}
            </div>
            <div className={`text-sm font-medium ${n === step ? 'text-slate-900' : 'text-slate-500'}`}>
              {n === 1 ? 'Cliente' : n === 2 ? 'Aparelho' : 'Serviço'}
            </div>
            {n < 3 && <div className="h-px flex-1 bg-slate-200" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          {selectedCustomer ? (
            <div className="rounded-md border-2 border-zinc-900 bg-zinc-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-900">
                ✓ Cliente já cadastrado
              </p>
              <p className="mt-1 font-semibold text-zinc-950">{selectedCustomer.name}</p>
              <p className="text-sm text-zinc-600">
                {selectedCustomer.phone}
                {selectedCustomer.osCount > 0 && (
                  <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-900">
                    {selectedCustomer.osCount} OS anterior{selectedCustomer.osCount === 1 ? '' : 'es'}
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={clearCustomerSelection}
                className="mt-2 text-xs font-medium text-zinc-600 underline hover:text-black"
              >
                Não é esse cliente — trocar
              </button>
            </div>
          ) : (
            <>
              <Field label="Nome do cliente *">
                <input
                  autoFocus
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Maria Silva"
                />
              </Field>
              <Field label="Telefone">
                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="form-input"
                  placeholder="(11) 99999-9999"
                />
              </Field>

              {searchingCustomer && (
                <p className="text-xs text-slate-500">Buscando cliente cadastrado…</p>
              )}
              {customerMatches.length > 0 && (
                <div className="rounded-md border border-zinc-300 bg-zinc-50 p-2">
                  <p className="mb-1.5 text-xs font-semibold text-zinc-900">
                    Encontramos {customerMatches.length === 1 ? 'este cadastro' : 'estes cadastros'}:
                  </p>
                  <ul className="space-y-1.5">
                    {customerMatches.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => pickCustomer(m)}
                          className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-950 hover:border-black hover:bg-zinc-100"
                        >
                          <span>
                            <span className="font-semibold text-zinc-950">{m.name}</span>
                            <span className="ml-2 text-zinc-500">{m.phone}</span>
                          </span>
                          {m.osCount > 0 && (
                            <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-800">
                              {m.osCount} OS
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Field label="E-mail (opcional)">
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="form-input"
                />
              </Field>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <Field label="Tipo de aparelho *">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {EQUIPMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setEquipment({ ...equipment, type: t.value })}
                  className={`rounded-md border-2 px-3 py-2 text-sm font-medium transition ${
                    equipment.type === t.value
                      ? 'border-black bg-zinc-100 text-black font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Marca">
              <input
                value={equipment.brand}
                onChange={(e) => setEquipment({ ...equipment, brand: e.target.value })}
                className="form-input"
                placeholder={
                  equipment.type === 'computador'
                    ? 'Ex: Dell/HP (se de marca) — vazio se for montado'
                    : 'Ex: Samsung'
                }
              />
            </Field>
            <Field label={equipment.type === 'computador' ? 'Modelo (se souber)' : 'Modelo *'}>
              <input
                value={equipment.model}
                onChange={(e) => setEquipment({ ...equipment, model: e.target.value })}
                className="form-input"
                placeholder={
                  equipment.type === 'computador' ? 'Ex: OptiPlex 3020 (se tiver etiqueta)' : 'Ex: Galaxy S21'
                }
              />
            </Field>
            <Field label={equipment.type === 'computador' ? 'Cor / sinais distintivos' : 'Cor'}>
              <input
                value={equipment.color}
                onChange={(e) => setEquipment({ ...equipment, color: e.target.value })}
                className="form-input"
                placeholder={
                  equipment.type === 'computador'
                    ? 'Ex: Preto, adesivo lateral, LED azul'
                    : 'Preto'
                }
              />
            </Field>
            <Field label={equipment.type === 'computador' ? 'Nº de série (se tiver etiqueta)' : 'IMEI / Serial'}>
              <input value={equipment.serial} onChange={(e) => setEquipment({ ...equipment, serial: e.target.value })} className="form-input" />
            </Field>
          </div>
          {equipment.type === 'computador' && (
            <p className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-800">
              💡 Processador, placa de vídeo, RAM etc não precisam ser perguntados aqui — o
              cliente raramente sabe de cabeça, e não ajuda a identificar a máquina. Isso o
              técnico levanta na bancada e registra em &quot;Anotações de reparo&quot; quando começar.
              Pra identificar qual máquina é qual, a <strong>foto</strong> abaixo vale mais que
              qualquer campo de texto — capriche.
            </p>
          )}
          <Field label="Senha / padrão (se souber)">
            <input
              type="text"
              value={equipment.password}
              onChange={(e) => setEquipment({ ...equipment, password: e.target.value })}
              className="form-input"
              placeholder="Para teste do aparelho"
            />
          </Field>
          <Field label="Checklist de entrada">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ENTRY_CHECKLIST_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900">
                  <input
                    type="checkbox"
                    checked={checklist[f.key] ?? false}
                    onChange={(e) => setChecklist({ ...checklist, [f.key]: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 accent-black text-black"
                  />
                  <span className="text-slate-900">{f.label}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="Acessórios que entraram">
            <input value={accessories} onChange={(e) => setAccessories(e.target.value)} className="form-input" placeholder="Ex: carregador + capa" />
          </Field>
          <Field label="Foto do aparelho (opcional, mas recomendado)">
            <label className="flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm font-medium text-slate-600 hover:bg-slate-100">
              {uploadingPhotos ? 'Enviando…' : '📷 Tirar foto / escolher da galeria'}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={(e) => uploadPhotos(e.target.files)}
                disabled={uploadingPhotos}
                className="hidden"
              />
            </label>
            <p className="mt-1 text-xs text-slate-500">
              Prova do estado em que o aparelho chegou (tela trincada, riscos, etc).
            </p>
            {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
            {photos.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((url) => (
                  <div key={url} className="group relative aspect-square overflow-hidden rounded-md border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Foto do aparelho" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(url)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
                      aria-label="Remover foto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <Field label="Defeito relatado / serviço solicitado pelo cliente *">
            <textarea
              autoFocus
              value={defect}
              onChange={(e) => setDefect(e.target.value)}
              rows={3}
              className="form-input"
              placeholder="Ex: tela trincada após queda, não carrega, formatação com backup"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Valor do serviço / mão de obra R$ (opcional)">
              <input
                value={initialLaborCost}
                onChange={(e) => setInitialLaborCost(e.target.value)}
                inputMode="decimal"
                className="form-input font-mono"
                placeholder="0,00 (pode definir depois na bancada)"
              />
            </Field>
            <Field label="Previsão de entrega (opcional)">
              <input
                type="date"
                value={estimatedReady}
                onChange={(e) => setEstimatedReady(e.target.value)}
                className="form-input"
              />
            </Field>
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900">
            <input
              type="checkbox"
              checked={approvedOnCounter}
              onChange={(e) => setApprovedOnCounter(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-black text-black"
            />
            <div>
              <span className="font-semibold text-zinc-950">
                Cliente já aprovou o serviço no balcão (iniciar direto em bancada)
              </span>
              <p className="mt-0.5 text-xs text-zinc-600">
                Marque para serviços tabelados (formatação, limpeza, película, etc.) em que não é necessário aguardar aprovação posterior.
              </p>
            </div>
          </label>
          <Field label="Já trava em algo? (opcional)">
            <input
              value={blocking}
              onChange={(e) => setBlocking(e.target.value)}
              className="form-input"
              placeholder="Ex: aguardando cabo iPhone 4"
            />
          </Field>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-5 flex justify-between gap-2">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || submitting}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
        >
          Voltar
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Próximo →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? 'Salvando…' : 'Criar OS'}
          </button>
        )}
      </div>

      <style jsx global>{`
        .form-input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
          line-height: 1.5;
          color: rgb(9 9 11);
          background: white;
        }
        .form-input:focus {
          outline: none;
          border-color: rgb(0 0 0);
          box-shadow: 0 0 0 1px rgb(0 0 0);
        }
        .form-input::placeholder {
          color: rgb(148 163 184);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
