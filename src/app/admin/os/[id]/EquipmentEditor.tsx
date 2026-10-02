'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import {
  EQUIPMENT_TYPES,
  getEquipmentTypeLabel,
  type EquipmentTypeValue,
} from '@/app/admin/types/database';
import { formatDateOnlyBR } from '@/app/admin/lib/datetime';

const STANDARD_TYPES = new Set<string>([
  'computador',
  'notebook',
  'impressora',
  'celular',
  'tablet',
  'console',
  'monitor',
]);

export function EquipmentEditor({
  osId,
  initialType,
  initialBrand,
  initialModel,
  initialColor,
  initialSerial,
  initialPassword,
  initialEstimatedReadyAt,
  canEdit,
}: {
  osId: string;
  initialType: string;
  initialBrand: string | null;
  initialModel: string | null;
  initialColor: string | null;
  initialSerial: string | null;
  initialPassword: string | null;
  initialEstimatedReadyAt: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const isCustomType = !STANDARD_TYPES.has(initialType);

  const [editing, setEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EquipmentTypeValue>(
    isCustomType ? 'outro' : (initialType as EquipmentTypeValue),
  );
  const [customType, setCustomType] = useState(
    isCustomType && initialType !== 'outro' ? initialType : '',
  );
  const [brand, setBrand] = useState(initialBrand ?? '');
  const [model, setModel] = useState(initialModel ?? '');
  const [color, setColor] = useState(initialColor ?? '');
  const [serial, setSerial] = useState(initialSerial ?? '');
  const [password, setPassword] = useState(initialPassword ?? '');
  const [estimatedReady, setEstimatedReady] = useState(initialEstimatedReadyAt ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayTypeLabel = getEquipmentTypeLabel(initialType, initialBrand, initialModel);

  async function save() {
    const finalType =
      selectedCategory === 'outro'
        ? customType.trim() || 'outro'
        : selectedCategory;

    setSaving(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: upErr } = await supabase
        .from('service_orders')
        .update({
          equipment_type: finalType,
          equipment_brand: brand.trim() || null,
          equipment_model: model.trim() || null,
          equipment_color: color.trim() || null,
          equipment_serial: serial.trim() || null,
          equipment_password: password.trim() || null,
          estimated_ready_at: estimatedReady || null,
        } as never)
        .eq('id', osId);
      if (upErr) throw upErr;

      setEditing(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setSelectedCategory(isCustomType ? 'outro' : (initialType as EquipmentTypeValue));
    setCustomType(isCustomType && initialType !== 'outro' ? initialType : '');
    setBrand(initialBrand ?? '');
    setModel(initialModel ?? '');
    setColor(initialColor ?? '');
    setSerial(initialSerial ?? '');
    setPassword(initialPassword ?? '');
    setEstimatedReady(initialEstimatedReadyAt ?? '');
    setError(null);
    setEditing(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Aparelho
        </h2>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-zinc-700 underline hover:text-black"
          >
            Editar
          </button>
        )}
      </div>

      {!editing ? (
        <dl className="mt-1.5 space-y-1 text-sm">
          <Row label="Tipo" value={displayTypeLabel} />
          {initialBrand && <Row label="Marca" value={initialBrand} />}
          {initialModel && <Row label="Modelo" value={initialModel} />}
          {initialColor && <Row label="Cor" value={initialColor} />}
          {initialSerial && <Row label="IMEI / Serial" value={initialSerial} />}
          {initialPassword && (
            <Row
              label="Senha"
              value={
                <code className="border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-900">
                  {initialPassword}
                </code>
              }
            />
          )}
          {initialEstimatedReadyAt && (
            <Row
              label="Previsão"
              value={<strong>{formatDateOnlyBR(initialEstimatedReadyAt)}</strong>}
            />
          )}
        </dl>
      ) : (
        <div className="mt-2.5 space-y-2.5 border border-zinc-300 bg-zinc-50 p-3">
          <div>
            <span className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-600">Tipo de aparelho</span>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {EQUIPMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSelectedCategory(t.value)}
                  className={`border px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    selectedCategory === t.value
                      ? 'border-zinc-950 bg-zinc-950 text-white'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {selectedCategory === 'outro' && (
            <label className="block">
              <span className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-900">
                Qual é o aparelho? (especifique)
              </span>
              <input
                autoFocus
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Ex: GPS, Monitor, Videogame, Impressora…"
                className="mt-1 w-full border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </label>
          )}

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-600">Marca</span>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Aquarius"
                className="mt-0.5 w-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-950 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </label>
            <label className="block">
              <span className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-600">Modelo</span>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: Discovery Channel"
                className="mt-0.5 w-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-950 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </label>
            <label className="block">
              <span className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-600">Cor</span>
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ex: Preto"
                className="mt-0.5 w-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-950 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </label>
            <label className="block">
              <span className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-600">IMEI / Serial</span>
              <input
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className="mt-0.5 w-full border border-zinc-300 bg-white px-2 py-1 font-mono text-xs text-zinc-950 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </label>
            <label className="block">
              <span className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-600">Senha / Padrão</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-0.5 w-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-950 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </label>
            <label className="block">
              <span className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-600">Previsão</span>
              <input
                type="date"
                value={estimatedReady}
                onChange={(e) => setEstimatedReady(e.target.value)}
                className="mt-0.5 w-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-950 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </label>
          </div>

          {error && <p className="font-mono text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-zinc-950 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
            >
              {saving ? 'Salvando…' : 'Salvar aparelho'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium text-zinc-900">{value}</dd>
    </div>
  );
}
