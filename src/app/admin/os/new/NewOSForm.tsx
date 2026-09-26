'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import {
  EQUIPMENT_TYPES,
  ENTRY_CHECKLIST_FIELDS,
  type EquipmentTypeValue,
} from '@/app/admin/types/database';
import { CameraSyncModal } from './CameraSyncModal';

const QUICK_SYMPTOM_CHIPS = [
  'Formatação & Backup de Dados',
  'Limpeza Preventiva + Pasta Térmica',
  'Lento / Travando (Upgrade SSD/RAM)',
  'Não Liga / Sem Sinal de Vídeo',
  'Superaquecendo / Desligando em Jogo',
  'Troca de Tela / Remanufatura Óptica OCA',
  'Reparo de Placa de Vídeo (GPU / BGA)',
] as const;

const QUICK_ACCESSORY_CHIPS = [
  'Carregador / Fonte Original',
  'Cabo de Força Tripolar',
  'Sem Acessórios (Só Aparelho)',
  'Case / Mochila / Capa',
] as const;

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
  const [cameraSyncOpen, setCameraSyncOpen] = useState(false);

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [customerMatches, setCustomerMatches] = useState<CustomerMatch[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerMatch | null>(
    initialCustomer ?? null,
  );

  const [technicians, setTechnicians] = useState<
    Array<{ id: string; full_name: string; commission_rate: number }>
  >([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(currentUserId);

  useEffect(() => {
    async function loadTechs() {
      try {
        const supabase = createCRMBrowserClient();
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('active', true);
        if (data && data.length > 0) {
          setTechnicians(
            data.map((p: { id: string; full_name: string; commission_rate?: number }) => ({
              id: p.id,
              full_name: p.full_name,
              commission_rate:
                p.commission_rate ??
                (p.full_name?.toLowerCase().includes('iago')
                  ? 0.3
                  : p.full_name?.toLowerCase().includes('jefferson')
                  ? 0.5
                  : 0),
            })),
          );
        }
      } catch (err) {
        console.error('Erro ao carregar técnicos:', err);
      }
    }
    loadTechs();
  }, []);

  // Atalho de teclado Alt+C para abrir o Cyber Camera Sync em qualquer etapa
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setCameraSyncOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Busca cliente já cadastrado enquanto digita telefone ou nome
  useEffect(() => {
    if (selectedCustomer) return;
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
        query =
          digits.length >= 4
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
    }, 300);
    return () => clearTimeout(t);
  }, [customer.phone, customer.name, selectedCustomer]);

  function pickCustomer(match: CustomerMatch) {
    setSelectedCustomer(match);
    setCustomer({
      name: match.name,
      phone: match.phone ?? '',
      email: match.email ?? '',
    });
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
  const [blocking, setBlocking] = useState('');
  const [estimatedReady, setEstimatedReady] = useState('');

  const handleSyncedPhotos = useCallback((newPhotos: string[]) => {
    setPhotos((prev) => Array.from(new Set([...prev, ...newPhotos])));
  }, []);

  function next() {
    if (step === 1 && !customer.name.trim()) {
      setError('Nome do cliente é obrigatório.');
      return;
    }
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

  function appendChipText(current: string, chip: string): string {
    if (!current.trim()) return chip;
    if (current.toLowerCase().includes(chip.toLowerCase())) return current;
    return `${current.trim()}; ${chip}`;
  }

  async function submit(redirectToLabel = false) {
    if (!defect.trim()) {
      setError('Defeito relatado é obrigatório.');
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

      // 2. OS (com fallback caso a coluna technician_id da migration 0034 ainda não tenha sido aplicada)
      const basePayload = {
        customer_id: customerId,
        equipment_type: equipment.type,
        equipment_brand: equipment.brand.trim() || null,
        equipment_model: equipment.model.trim() || null,
        equipment_color: equipment.color.trim() || null,
        equipment_serial: equipment.serial.trim() || null,
        equipment_password: equipment.password.trim() || null,
        reported_defect: defect.trim(),
        entry_checklist: checklist,
        accessories_in: accessories.trim() || null,
        equipment_photos: photos,
        blocking_reason: blocking.trim() || null,
        estimated_ready_at: estimatedReady || null,
        created_by: currentUserId,
      };

      let { data: newOS, error: osErr } = await supabase
        .from('service_orders')
        .insert({
          ...basePayload,
          technician_id: selectedTechnicianId || null,
        })
        .select('id, os_number')
        .single();

      if (osErr && osErr.message?.includes('technician_id')) {
        const retry = await supabase
          .from('service_orders')
          .insert(basePayload)
          .select('id, os_number')
          .single();
        newOS = retry.data;
        osErr = retry.error;
      }

      if (osErr || !newOS) throw osErr ?? new Error('Erro ao criar OS');

      // 3. evento inicial
      await supabase.from('service_order_events').insert({
        service_order_id: newOS.id,
        event_type: 'created',
        to_value: 'awaiting_approval',
        author_id: currentUserId,
      });

      if (redirectToLabel) {
        router.push(`/admin/os/${newOS.id}/label`);
      } else {
        router.push(`/admin/os/${newOS.id}`);
      }
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs text-slate-900 sm:p-6">
        {/* Stepper Modern Retail Studio */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (n < step) setStep(n);
                }}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                  n === step
                    ? 'bg-sky-600 text-white shadow-xs'
                    : n < step
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}
              >
                {n < step ? '✓' : n}
              </button>
              <div
                className={`text-sm ${
                  n === step
                    ? 'font-bold text-slate-900'
                    : n < step
                      ? 'font-semibold text-emerald-700'
                      : 'font-medium text-slate-400'
                }`}
              >
                {n === 1 ? '1. Cliente' : n === 2 ? '2. Aparelho & Fotos' : '3. Sintoma & Etiqueta'}
              </div>
              {n < 3 && <div className="h-px flex-1 bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* PASSO 1: CLIENTE */}
        {step === 1 && (
          <div className="space-y-4">
            {selectedCustomer ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    ✓ Cliente Recorrente Identificado
                  </p>
                  {selectedCustomer.osCount > 0 && (
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800 border border-emerald-200">
                      {selectedCustomer.osCount} OS anterior{selectedCustomer.osCount === 1 ? '' : 'es'}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-base font-bold text-slate-900">{selectedCustomer.name}</p>
                <p className="text-sm text-slate-600">{selectedCustomer.phone || 'Sem telefone'}</p>
                <button
                  type="button"
                  onClick={clearCustomerSelection}
                  className="mt-2 text-xs font-semibold text-sky-700 underline hover:text-sky-800"
                >
                  Não é esse cliente — trocar
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Telefone / WhatsApp (busca automática)">
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="form-input"
                      placeholder="(11) 99999-9999"
                    />
                  </Field>
                  <Field label="Nome do cliente *">
                    <input
                      autoFocus
                      autoComplete="name"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="form-input"
                      placeholder="Ex: Maria Silva"
                    />
                  </Field>
                </div>

                {searchingCustomer && (
                  <p className="text-xs text-slate-500">Buscando cliente cadastrado…</p>
                )}
                {customerMatches.length > 0 && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-sky-800">
                      Encontramos {customerMatches.length === 1 ? 'este cadastro' : 'estes cadastros'} (clique para preencher em 1s):
                    </p>
                    <ul className="space-y-1.5">
                      {customerMatches.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => pickCustomer(m)}
                            className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 shadow-2xs hover:border-sky-300 hover:bg-sky-50/40 transition"
                          >
                            <span>
                              <span className="font-semibold text-slate-900">{m.name}</span>
                              {m.phone && <span className="ml-2 text-slate-500">{m.phone}</span>}
                            </span>
                            {m.osCount > 0 && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
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
                    placeholder="cliente@email.com"
                  />
                </Field>
              </>
            )}
          </div>
        )}

        {/* PASSO 2: APARELHO, CHECKLIST & CYBER CAMERA SYNC */}
        {step === 2 && (
          <div className="space-y-4">
            <Field label="Tipo de aparelho *">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {EQUIPMENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setEquipment({ ...equipment, type: t.value })}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold transition ${
                      equipment.type === t.value
                        ? 'border-sky-600 bg-sky-50 text-sky-800 shadow-2xs'
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
                      ? 'Ex: Pichau / Custom / Dell'
                      : 'Ex: Samsung / Apple / Acer'
                  }
                />
              </Field>
              <Field label={equipment.type === 'computador' ? 'Modelo / Gabinete (se souber)' : 'Modelo *'}>
                <input
                  value={equipment.model}
                  onChange={(e) => setEquipment({ ...equipment, model: e.target.value })}
                  className="form-input"
                  placeholder={
                    equipment.type === 'computador'
                      ? 'Ex: Gabinete Aquário Branco / RTX 4060'
                      : 'Ex: Nitro 5 / Galaxy S23'
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
                      ? 'Ex: Preto, lateral vidro temperado'
                      : 'Ex: Grafite'
                  }
                />
              </Field>
              <Field label={equipment.type === 'computador' ? 'Nº de série (se tiver etiqueta)' : 'IMEI / Serial'}>
                <input
                  value={equipment.serial}
                  onChange={(e) => setEquipment({ ...equipment, serial: e.target.value })}
                  className="form-input font-mono"
                  placeholder="Opcional"
                />
              </Field>
            </div>

            <Field label="Senha / PIN de teste (se o cliente informar)">
              <input
                type="text"
                value={equipment.password}
                onChange={(e) => setEquipment({ ...equipment, password: e.target.value })}
                className="form-input"
                placeholder="Ex: 1234 / Sem senha"
              />
            </Field>

            <Field label="Checklist de integridade na entrada">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {ENTRY_CHECKLIST_FIELDS.map((f) => {
                  const checked = checklist[f.key] ?? false;
                  return (
                    <label
                      key={f.key}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        checked
                          ? 'border-sky-300 bg-sky-50/70 text-sky-900 font-semibold'
                          : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100/70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setChecklist({ ...checklist, [f.key]: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600"
                      />
                      <span>{f.label}</span>
                    </label>
                  );
                })}
              </div>
            </Field>

            <Field label="Acessórios deixados no balcão (digite livremente ou use os atalhos)">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-400 mr-1">
                  Atalhos opcionais:
                </span>
                {QUICK_ACCESSORY_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setAccessories((prev) => appendChipText(prev, chip))}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 transition"
                  >
                    + {chip}
                  </button>
                ))}
                {accessories.trim() && (
                  <button
                    type="button"
                    onClick={() => setAccessories('')}
                    className="ml-auto text-[11px] font-medium text-slate-400 underline hover:text-slate-700"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <input
                value={accessories}
                onChange={(e) => setAccessories(e.target.value)}
                className="form-input"
                placeholder="Digite livremente qualquer acessório (ex: Fonte Dell 65W, mouse USB, mochila preta…)"
              />
            </Field>

            {/* BLOCO DE FOTOS DA CARCAÇA COM CYBER CAMERA SYNC (OPÇÃO 1) */}
            <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                    📸 Fotos da Carcaça no Check-in ({photos.length})
                  </span>
                  <p className="text-xs text-slate-600">
                    Tire fotos em 15 segundos com seu celular escaneando o QR Code na tela ou selecione arquivos.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCameraSyncOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition"
                  >
                    <span>📱 Cyber Camera Sync (QR Code)</span>
                    <span className="rounded bg-sky-800/60 px-1.5 py-0.5 font-mono text-[10px]">
                      Alt+C
                    </span>
                  </button>

                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                    <span>{uploadingPhotos ? 'Enviando…' : '💻 Upload do PC'}</span>
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
                </div>
              </div>

              {photoError && <p className="mt-2 text-xs text-red-600">{photoError}</p>}

              {photos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {photos.map((url, idx) => (
                    <div
                      key={`${idx}-${url.slice(0, 24)}`}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Foto do aparelho" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/75 text-xs text-white hover:bg-red-600"
                        aria-label="Remover foto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASSO 3: SINTOMA / DEFEITO & TÉCNICO */}
        {step === 3 && (
          <div className="space-y-4">
            <Field label="Defeito / Serviço relatado pelo cliente * (digite livremente ou use os atalhos)">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-400 mr-1">
                  Atalhos opcionais:
                </span>
                {QUICK_SYMPTOM_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setDefect((prev) => appendChipText(prev, chip))}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 transition"
                  >
                    + {chip}
                  </button>
                ))}
                {defect.trim() && (
                  <button
                    type="button"
                    onClick={() => setDefect('')}
                    className="ml-auto text-[11px] font-medium text-slate-400 underline hover:text-slate-700"
                  >
                    Limpar texto
                  </button>
                )}
              </div>
              <textarea
                autoFocus
                value={defect}
                onChange={(e) => setDefect(e.target.value)}
                rows={4}
                className="form-input"
                placeholder="Digite livremente qualquer defeito, sintoma ou pedido específico do cliente (ou clique nos atalhos acima para complementar)…"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Técnico Responsável">
                <select
                  value={selectedTechnicianId}
                  onChange={(e) => setSelectedTechnicianId(e.target.value)}
                  className="form-input"
                >
                  <option value="">Sem técnico atribuído (Loja / Geral)</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}{' '}
                      {t.commission_rate > 0
                        ? `(${Math.round(t.commission_rate * 100)}% comissão)`
                        : '(Margem Loja)'}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Iago (30% balcão) · Jefferson (50/50 mezanino) · Felipe/Loja (100% retido).
                </p>
              </Field>

              <Field label="Previsão de entrega / diagnóstico (opcional)">
                <input
                  type="date"
                  value={estimatedReady}
                  onChange={(e) => setEstimatedReady(e.target.value)}
                  className="form-input"
                />
              </Field>
            </div>

            <Field label="Observação ou pendência imediata (opcional)">
              <input
                value={blocking}
                onChange={(e) => setBlocking(e.target.value)}
                className="form-input"
                placeholder="Ex: Cliente pediu prioridade para hoje às 17h"
              />
            </Field>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || submitting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-30"
          >
            ← Voltar
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition"
            >
              Próximo passo →
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => submit(false)}
                disabled={submitting}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                {submitting ? 'Salvando…' : 'Criar OS e Abrir Ficha'}
              </button>
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={submitting}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {submitting ? 'Salvando…' : '🖨️ Criar OS + Etiqueta 58mm'}
              </button>
            </div>
          )}
        </div>

        <style jsx global>{`
          .form-input {
            width: 100%;
            border-radius: 0.5rem;
            border: 1px solid rgb(203 213 225);
            padding: 0.55rem 0.85rem;
            font-size: 1rem; /* text-base em mobile — evita zoom iOS */
            line-height: 1.5;
            color: rgb(15 23 42);
            background: white;
            transition: border-color 0.15s ease;
          }
          @media (min-width: 640px) {
            .form-input {
              font-size: 0.9rem; /* sm:text-sm */
            }
          }
          .form-input:focus {
            outline: none;
            border-color: rgb(2 132 199);
            box-shadow: 0 0 0 1px rgb(2 132 199);
          }
          .form-input::placeholder {
            color: rgb(148 163 184);
          }
        `}</style>
      </div>

      <CameraSyncModal
        open={cameraSyncOpen}
        onClose={() => setCameraSyncOpen(false)}
        onPhotosSynced={handleSyncedPhotos}
        existingPhotos={photos}
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
