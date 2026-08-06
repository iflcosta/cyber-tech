'use client';

import { useState } from 'react';
import { todayBR, formatDateOnlyBR } from '@/app/admin/lib/datetime';

function tomorrowBR(): string {
  return todayBR(new Date(Date.now() + 86400000));
}

function fmtBRLInput(v: string): string {
  const n = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n)
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : v;
}

const DEFAULT_CONDITIONS =
  'Recebi, nesta data, o produto acima descrito, em perfeito estado de funcionamento, ' +
  'para avaliação. Comprometo-me a efetuar o pagamento do valor combinado até a data-limite ' +
  'informada, caso opte por ficar com o produto. Caso não haja interesse na compra, o produto ' +
  'deverá ser devolvido à Cyber Informática nas mesmas condições em que foi recebido, sem ' +
  'danos, avarias, ou remoção/substituição de peças.';

export default function TermoRecebimentoPage() {
  const [recipientName, setRecipientName] = useState('');
  const [recipientDoc, setRecipientDoc] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [serial, setSerial] = useState('');
  const [value, setValue] = useState('');
  const [deadline, setDeadline] = useState(tomorrowBR());
  const [conditions, setConditions] = useState(DEFAULT_CONDITIONS);

  const today = todayBR();

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-slate-900">Termo de recebimento de produto</h1>
        <p className="text-sm text-slate-500">
          Pra entregar um produto pra avaliação antes do pagamento (ex: cliente só paga se o
          computador servir). Preencha e imprima — o cliente assina, você guarda o papel.
        </p>
      </div>

      {/* Formulário — some na impressão */}
      <div className="print:hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="space-y-3">
          <Field label="Nome do cliente/responsável *">
            <input
              autoFocus
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Ex: Farmácia Boa Saúde — João Silva"
              className="form-input"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="CPF/CNPJ (opcional)">
              <input
                value={recipientDoc}
                onChange={(e) => setRecipientDoc(e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="Telefone (opcional)">
              <input
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="form-input"
              />
            </Field>
          </div>

          <Field label="Descrição do produto *">
            <textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={2}
              placeholder="Ex: Computador montado — Ryzen 5 5600, 16GB RAM, SSD 480GB, RTX 3060"
              className="form-input"
            />
          </Field>

          <Field label="Número de série (opcional)">
            <input
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              className="form-input font-mono"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Valor combinado (R$) *">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
                className="form-input"
              />
            </Field>
            <Field label="Prazo pra pagamento *">
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="form-input"
              />
            </Field>
          </div>

          <Field label="Condições (editável)">
            <textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              rows={4}
              className="form-input"
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!recipientName.trim() || !productDescription.trim() || !value.trim()}
            className="rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-30"
          >
            🖨️ Imprimir termo
          </button>
        </div>

        <style jsx global>{`
          .form-input {
            width: 100%;
            border-radius: 0.375rem;
            border: 1px solid rgb(203 213 225);
            padding: 0.5rem 0.75rem;
            font-size: 1rem;
            line-height: 1.5;
            color: rgb(15 23 42);
            background: white;
          }
          .form-input:focus {
            outline: none;
            border-color: rgb(59 130 246);
            box-shadow: 0 0 0 1px rgb(59 130 246);
          }
          .form-input::placeholder {
            color: rgb(148 163 184);
          }
        `}</style>
      </div>

      {/* Documento — só aparece de verdade na impressão, mas fica visível
          na tela também como prévia (sem duplicar: o form some no print,
          isso fica). */}
      <article className="mx-auto max-w-2xl bg-white p-6 shadow sm:p-8 print:max-w-none print:p-8 print:shadow-none">
        <header className="border-b border-slate-300 pb-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Cyber <span className="text-blue-600">Informática</span>
            </h1>
            <p className="text-sm text-slate-500">{formatDateOnlyBR(today)}</p>
          </div>
          <p className="mt-1 text-xs text-slate-500">Termo de recebimento de produto</p>
        </header>

        <section className="mt-4 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recebedor
          </h2>
          <p className="mt-1 font-semibold text-slate-900">
            {recipientName || <span className="text-slate-400">(nome do cliente/responsável)</span>}
          </p>
          {recipientDoc && <p className="text-slate-700">CPF/CNPJ: {recipientDoc}</p>}
          {recipientPhone && <p className="text-slate-700">Telefone: {recipientPhone}</p>}
        </section>

        <section className="mt-4 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Produto
          </h2>
          <p className="mt-1 whitespace-pre-wrap text-slate-900">
            {productDescription || <span className="text-slate-400">(descrição do produto)</span>}
          </p>
          {serial && <p className="mt-1 font-mono text-xs text-slate-600">Nº de série: {serial}</p>}
        </section>

        <section className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Valor combinado
            </h2>
            <p className="mt-1 font-semibold text-slate-900">
              {value ? fmtBRLInput(value) : <span className="text-slate-400 font-normal">—</span>}
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Prazo pra pagamento
            </h2>
            <p className="mt-1 font-semibold text-slate-900">
              {deadline ? formatDateOnlyBR(deadline) : '—'}
            </p>
          </div>
        </section>

        <section className="mt-4 text-sm">
          <p className="whitespace-pre-wrap text-slate-900">{conditions}</p>
        </section>

        <section className="mt-10 grid grid-cols-2 gap-8 text-xs text-slate-500">
          <div className="border-t border-slate-400 pt-1">
            <p>Assinatura do cliente/responsável</p>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <p>Responsável Cyber Informática</p>
          </div>
        </section>
      </article>

      <style>{`
        @media print {
          html, body { background: white !important; color: #0f172a !important; }
          article { background: white !important; color: #0f172a !important; }
          article * { color: #0f172a !important; }
          article .text-blue-600 { color: #2563eb !important; }
          header.sticky, nav { display: none !important; }
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
