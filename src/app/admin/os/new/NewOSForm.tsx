'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import {
  EQUIPMENT_TYPES,
  ENTRY_CHECKLIST_FIELDS,
  getChecklistFieldsForEquipment,
  getQuickSymptomChips,
  getQuickAccessoryChips,
  shouldPrintAccessoryLabel,
  type EquipmentTypeValue,
} from '@/app/admin/types/database';
import { CameraSyncModal } from './CameraSyncModal';

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
  const [hasOpenedCameraSync, setHasOpenedCameraSync] = useState(false);
  const [cameraSessionToken] = useState(
    () => `sync_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  );

  function openCameraSync() {
    setHasOpenedCameraSync(true);
    setCameraSyncOpen(true);
  }

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
        setHasOpenedCameraSync(true);
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
    customType: '',
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
  const [printAccessoryLabel, setPrintAccessoryLabel] = useState(false);
  const [userToggledAccessoryLabel, setUserToggledAccessoryLabel] = useState(false);

  // Sincroniza automaticamente a necessidade de 2ª etiqueta (ignora capinhas/películas)
  // a menos que o operador tenha marcado/desmarcado manualmente.
  useEffect(() => {
    if (!userToggledAccessoryLabel) {
      setPrintAccessoryLabel(
        shouldPrintAccessoryLabel(Boolean(checklist.carregador), accessories),
      );
    }
  }, [checklist.carregador, accessories, userToggledAccessoryLabel]);

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [defect, setDefect] = useState('');
  const [blocking, setBlocking] = useState('');
  const [estimatedReady, setEstimatedReady] = useState('');

  const effectiveEquipmentType =
    equipment.type === 'outro' ? equipment.customType.trim() || 'outro' : equipment.type;
  const activeChecklistFields = getChecklistFieldsForEquipment(
    effectiveEquipmentType,
    equipment.brand,
    equipment.model,
  );
  const QUICK_ACCESSORY_CHIPS = getQuickAccessoryChips(
    effectiveEquipmentType,
    equipment.brand,
    equipment.model,
  );
  const QUICK_SYMPTOM_CHIPS = getQuickSymptomChips(
    effectiveEquipmentType,
    equipment.brand,
    equipment.model,
  );

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

      // Garante sincronização final das fotos caso o Cyber Camera Sync tenha sido usado
      let finalPhotos = [...photos];
      if (hasOpenedCameraSync) {
        try {
          const syncRes = await fetch(
            `/api/camera-sync?token=${encodeURIComponent(cameraSessionToken)}&_t=${Date.now()}`,
            { cache: 'no-store' },
          );
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (Array.isArray(syncData.photos) && syncData.photos.length > 0) {
              finalPhotos = Array.from(new Set([...finalPhotos, ...syncData.photos]));
              setPhotos(finalPhotos);
            }
          }
        } catch {
          // Segue com as fotos já carregadas em estado
        }
      }

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
        equipment_type: effectiveEquipmentType,
        equipment_brand: equipment.brand.trim() || null,
        equipment_model: equipment.model.trim() || null,
        equipment_color: equipment.color.trim() || null,
        equipment_serial: equipment.serial.trim() || null,
        equipment_password: equipment.password.trim() || null,
        reported_defect: defect.trim(),
        entry_checklist: checklist,
        accessories_in: accessories.trim() || null,
        equipment_photos: finalPhotos,
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

      // Vincula sessão do Cyber Camera Sync à OS criada (para fotos tardias do celular caírem direto na OS)
      if (hasOpenedCameraSync) {
        fetch('/api/camera-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            token: cameraSessionToken,
            action: 'link_os',
            osId: newOS.id,
          }),
        }).catch(() => {});
      }

      // Dispara notificação automática de WhatsApp (com keepalive e await para garantir envio antes da navegação)
      try {
        await fetch('/api/notify/os-created', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({ osId: newOS.id }),
          keepalive: true,
          signal: AbortSignal.timeout(3500),
        });
      } catch (err) {
        console.warn('[WhatsApp Auto] Falha ao disparar notificação:', err);
      }

      // 3. evento inicial
      await supabase.from('service_order_events').insert({
        service_order_id: newOS.id,
        event_type: 'created',
        to_value: 'awaiting_approval',
        author_id: currentUserId,
      });

      if (redirectToLabel) {
        const copiesParam = printAccessoryLabel ? '&copies=2' : '&copies=1';
        router.push(`/admin/os/${newOS.id}/label?autoprint=1${copiesParam}`);
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
      <div className="border-2 border-zinc-950 bg-white p-5 shadow-xs text-zinc-950 sm:p-6">
        {/* Stepper Modern Retail Studio */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (n < step) setStep(n);
                }}
                className={`flex h-7 w-7 shrink-0 items-center justify-center font-mono text-xs font-bold transition ${
                  n === step
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : n < step
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-100 text-zinc-500 border border-zinc-300'
                }`}
              >
                {n < step ? '✓' : n}
              </button>
              <div
                className={`font-mono text-xs uppercase tracking-wider ${
                  n === step
                    ? 'font-bold text-zinc-950'
                    : n < step
                      ? 'font-semibold text-zinc-700'
                      : 'font-medium text-zinc-400'
                }`}
              >
                {n === 1 ? '1. Cliente' : n === 2 ? '2. Aparelho & Fotos' : '3. Sintoma & Etiqueta'}
              </div>
              {n < 3 && <div className="h-px flex-1 bg-zinc-200" />}
            </div>
          ))}
        </div>

        {/* PASSO 1: CLIENTE */}
        {step === 1 && (
          <div className="space-y-4">
            {selectedCustomer ? (
              <div className="border-2 border-zinc-950 bg-zinc-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
                    ✓ Cliente Recorrente Identificado
                  </p>
                  {selectedCustomer.osCount > 0 && (
                    <span className="bg-zinc-950 px-2 py-0.5 font-mono text-xs font-bold text-white uppercase">
                      {selectedCustomer.osCount} OS anterior{selectedCustomer.osCount === 1 ? '' : 'es'}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-base font-bold text-zinc-950">{selectedCustomer.name}</p>
                <p className="font-mono text-sm text-zinc-600">{selectedCustomer.phone || 'Sem telefone'}</p>
                <button
                  type="button"
                  onClick={clearCustomerSelection}
                  className="mt-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 underline hover:text-zinc-700 cursor-pointer"
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
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="form-input"
                      placeholder="(11) 99999-9999"
                    />
                  </Field>
                  <Field label="Nome do cliente *">
                    <input
                      autoFocus
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="form-input"
                      placeholder="Ex: Maria Silva"
                    />
                  </Field>
                </div>

                {searchingCustomer && (
                  <p className="font-mono text-xs text-zinc-500">Buscando cliente cadastrado…</p>
                )}
                {customerMatches.length > 0 && (
                  <div className="border-2 border-zinc-950 bg-zinc-50 p-3">
                    <p className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
                      Encontramos {customerMatches.length === 1 ? 'este cadastro' : 'estes cadastros'} (clique para preencher em 1s):
                    </p>
                    <ul className="space-y-1.5">
                      {customerMatches.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => pickCustomer(m)}
                            className="flex w-full items-center justify-between gap-2 border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-900 shadow-2xs hover:border-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
                          >
                            <span>
                              <span className="font-bold text-zinc-950">{m.name}</span>
                              {m.phone && <span className="ml-2 font-mono text-zinc-500">{m.phone}</span>}
                            </span>
                            {m.osCount > 0 && (
                              <span className="bg-zinc-100 px-2 py-0.5 font-mono text-xs font-bold text-zinc-800 border border-zinc-300">
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {EQUIPMENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setEquipment({ ...equipment, type: t.value })}
                    className={`border-2 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                      equipment.type === t.value
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                        : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>

            {equipment.type === 'outro' && (
              <Field label="Qual é o aparelho? (especifique) *">
                <input
                  autoFocus
                  value={equipment.customType}
                  onChange={(e) => setEquipment({ ...equipment, customType: e.target.value })}
                  className="form-input"
                  placeholder="Ex: Nobreak, GPS, Roteador, Scanner, Caixa de Som…"
                />
              </Field>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Marca">
                <input
                  value={equipment.brand}
                  onChange={(e) => setEquipment({ ...equipment, brand: e.target.value })}
                  className="form-input"
                  placeholder={
                    equipment.type === 'computador'
                      ? 'Ex: Pichau / Custom / Dell'
                      : equipment.type === 'impressora'
                        ? 'Ex: HP / Epson / Brother / Canon'
                        : equipment.type === 'console'
                          ? 'Ex: Sony / Microsoft / Nintendo'
                          : 'Ex: Samsung / Apple / Acer / Dell'
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
                      : equipment.type === 'impressora'
                        ? 'Ex: Smart Tank 517 / EcoTank L3250'
                        : equipment.type === 'console'
                          ? 'Ex: PlayStation 5 / Xbox Series S'
                          : 'Ex: Nitro 5 / Galaxy S23 / Inspiron 15'
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
                      : equipment.type === 'impressora'
                        ? 'Ex: Cinza / Preta / Branca'
                        : 'Ex: Grafite / Prata / Preto'
                  }
                />
              </Field>
              <Field
                label={
                  equipment.type === 'celular' || equipment.type === 'tablet'
                    ? 'IMEI / Nº de Série'
                    : 'Nº de Série (se visível)'
                }
              >
                <input
                  value={equipment.serial}
                  onChange={(e) => setEquipment({ ...equipment, serial: e.target.value })}
                  className="form-input font-mono"
                  placeholder="Opcional"
                />
              </Field>
            </div>

            <Field
              label={
                equipment.type === 'impressora' || equipment.type === 'monitor'
                  ? 'Senha de Rede / PIN / Observação de acesso (opcional)'
                  : 'Senha / PIN de teste (se o cliente informar)'
              }
            >
              <input
                type="text"
                value={equipment.password}
                onChange={(e) => setEquipment({ ...equipment, password: e.target.value })}
                className="form-input"
                placeholder={
                  equipment.type === 'impressora' || equipment.type === 'monitor'
                    ? 'Opcional (ex: Sem senha / Wi-Fi Direto)'
                    : 'Ex: 1234 / Sem senha'
                }
              />
            </Field>

            <Field label="Checklist de integridade na entrada">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {activeChecklistFields.map((f) => {
                  const checked = checklist[f.key] ?? false;
                  return (
                    <label
                      key={f.key}
                      className={`flex cursor-pointer items-center gap-2 border px-3 py-2 font-mono text-xs font-semibold transition ${
                        checked
                          ? 'border-2 border-zinc-950 bg-zinc-950 text-white'
                          : 'border border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setChecklist({ ...checklist, [f.key]: e.target.checked })}
                        className="h-4 w-4 border-zinc-300 accent-zinc-950"
                      />
                      <span>{f.label}</span>
                    </label>
                  );
                })}
              </div>
            </Field>

            <Field label="Acessórios deixados no balcão (digite livremente ou use os atalhos)">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] font-bold uppercase text-zinc-500 mr-1">
                  Atalhos opcionais:
                </span>
                {QUICK_ACCESSORY_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setUserToggledAccessoryLabel(false);
                      setAccessories((prev) => appendChipText(prev, chip));
                    }}
                    className="border border-zinc-300 bg-zinc-50 px-2.5 py-1 font-mono text-xs font-semibold text-zinc-800 hover:border-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
                {accessories.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserToggledAccessoryLabel(false);
                      setAccessories('');
                    }}
                    className="ml-auto font-mono text-[11px] font-bold uppercase text-zinc-400 underline hover:text-zinc-900 cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <input
                value={accessories}
                onChange={(e) => {
                  setUserToggledAccessoryLabel(false);
                  setAccessories(e.target.value);
                }}
                className="form-input"
                placeholder="Digite livremente qualquer acessório deixado pelo cliente…"
              />

              {/* Checkbox inteligente de 2ª etiqueta para acessório */}
              <div className="mt-2.5 flex items-center gap-2.5 border-2 border-zinc-950 bg-zinc-50 p-2.5">
                <input
                  type="checkbox"
                  id="printAccessoryLabel"
                  checked={printAccessoryLabel}
                  onChange={(e) => {
                    setUserToggledAccessoryLabel(true);
                    setPrintAccessoryLabel(e.target.checked);
                  }}
                  className="h-4 w-4 border-zinc-400 accent-zinc-950 cursor-pointer"
                />
                <label
                  htmlFor="printAccessoryLabel"
                  className="cursor-pointer font-mono text-xs font-bold text-zinc-900 select-none"
                >
                  Imprimir 2ª etiqueta para acessório separado (1/2 Aparelho e 2/2 Acessório)
                  <span className="block font-normal text-zinc-600 text-[11px] mt-0.5">
                    {printAccessoryLabel
                      ? '✓ Serão impressas 2 etiquetas na Knup (1 no aparelho e 1 no acessório separado).'
                      : 'Será impressa apenas 1 etiqueta na Knup (para colar no aparelho/capinha).'}
                  </span>
                </label>
              </div>
            </Field>

            {/* BLOCO DE FOTOS DA CARCAÇA COM CYBER CAMERA SYNC (OPÇÃO 1) */}
            <div className="border-2 border-zinc-950 bg-zinc-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
                    📸 Fotos da Carcaça no Check-in ({photos.length})
                  </span>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Tire fotos em 15 segundos com seu celular escaneando o QR Code na tela ou selecione arquivos.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={openCameraSync}
                    className="inline-flex items-center gap-1.5 bg-zinc-950 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <span>📱 Cyber Camera Sync (QR Code)</span>
                    <span className="bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-white">
                      Alt+C
                    </span>
                  </button>

                  <label className="inline-flex cursor-pointer items-center gap-1.5 border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition">
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
                      className="group relative aspect-square overflow-hidden border-2 border-zinc-950 bg-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Foto do aparelho" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-zinc-950/80 font-mono text-xs text-white hover:bg-red-600 transition"
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
                <span className="text-[11px] font-mono font-bold uppercase text-zinc-500 mr-1">
                  Atalhos:
                </span>
                {QUICK_SYMPTOM_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setDefect((prev) => appendChipText(prev, chip))}
                    className="border border-zinc-300 bg-zinc-100 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-800 hover:border-zinc-950 hover:bg-zinc-200 hover:text-zinc-950 transition"
                  >
                    + {chip}
                  </button>
                ))}
                {defect.trim() && (
                  <button
                    type="button"
                    onClick={() => setDefect('')}
                    className="ml-auto text-[11px] font-mono text-zinc-500 underline hover:text-zinc-950"
                  >
                    Limpar
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
                <p className="mt-1 font-mono text-[11px] text-zinc-500">
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

            <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-zinc-950 bg-zinc-50 p-3 text-xs">
              <span className="font-mono font-bold uppercase text-zinc-950">
                📸 Fotos anexadas nesta OS: <strong>{photos.length}</strong>
              </span>
              <button
                type="button"
                onClick={openCameraSync}
                className="inline-flex items-center gap-1.5 border-2 border-zinc-950 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
              >
                📱 + Fotos via Cyber Camera Sync
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 border-2 border-red-500 bg-red-50 p-3 font-mono text-xs font-bold text-red-950">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t-2 border-zinc-200 pt-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || submitting}
            className="border-2 border-zinc-950 bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition disabled:opacity-30 cursor-pointer"
          >
            ← Voltar
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              className="bg-zinc-950 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              Próximo passo →
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => submit(false)}
                disabled={submitting}
                className="font-mono text-xs font-semibold text-zinc-500 underline hover:text-zinc-950 transition disabled:opacity-50 cursor-pointer"
              >
                Salvar sem imprimir etiqueta
              </button>
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={submitting}
                className="bg-zinc-950 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting
                  ? 'Salvando OS…'
                  : printAccessoryLabel
                    ? '🖨️ Criar OS + 2x Etiquetas (Aparelho + Acessório)'
                    : '🖨️ Criar OS + Etiqueta 58mm (Knup 40x60)'}
              </button>
            </div>
          )}
        </div>

        <style jsx global>{`
          .form-input {
            width: 100%;
            border: 1px solid #d4d4d8;
            padding: 0.55rem 0.85rem;
            font-size: 0.9rem;
            line-height: 1.5;
            color: #09090b;
            background: white;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
          }
          .form-input:focus {
            outline: none;
            border-color: #09090b;
            box-shadow: 0 0 0 2px rgba(9, 9, 11, 0.12);
          }
          .form-input::placeholder {
            color: #a1a1aa;
          }
        `}</style>
      </div>

      <CameraSyncModal
        open={cameraSyncOpen}
        onClose={() => setCameraSyncOpen(false)}
        onPhotosSynced={handleSyncedPhotos}
        existingPhotos={photos}
        sessionTokenProp={cameraSessionToken}
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-700">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
