"use client";

import { useState, type FormEvent } from "react";
import { getSiteSupabase } from "@/lib/site-supabase";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

type LeadType = "cliente" | "lojista" | "outro";

const leadTypes: { value: LeadType; label: string; description: string }[] = [
  {
    value: "cliente",
    label: "Sou cliente",
    description: "Quero comprar PC, notebook ou celular",
  },
  {
    value: "lojista",
    label: "Sou lojista / assistência",
    description: "Quero entender a parceria B2B",
  },
  {
    value: "outro",
    label: "Outro assunto",
    description: "Dúvida, parceria, imprensa",
  },
];

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<LeadType>("cliente");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validacao client-side
    if (name.trim().length < 2) {
      setError("Nome precisa ter pelo menos 2 caracteres.");
      return;
    }
    if (!validateEmail(email)) {
      setError("E-mail invalido.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Mensagem precisa ter pelo menos 10 caracteres.");
      return;
    }
    if (message.trim().length > 5000) {
      setError("Mensagem muito longa (max 5000 caracteres).");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSiteSupabase();
      const { error: insertErr } = await supabase.from("contact_leads").insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        message: message.trim(),
        type,
      });

      if (insertErr) {
        throw insertErr;
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setType("cliente");
    } catch (e) {
      const err = e as Error & { message?: string };
      setError(err.message || "Erro ao enviar. Tenta de novo ou chama no WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="card" style={{ padding: "2rem" }}>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-circuit-green)]/10 flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-[var(--color-circuit-green)]" />
          </div>
          <h2 className="display text-2xl font-bold text-[var(--color-text-on-dark)] mb-2">
            Recebido!
          </h2>
          <p className="text-[var(--color-text-on-dark-muted)] mb-6">
            A gente responde em ate 1 dia util pelo WhatsApp ou e-mail.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="btn-ghost"
            type="button"
          >
            Enviar outra mensagem
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card"
      style={{ padding: "2rem" }}
      noValidate
    >
      <h2 className="display text-2xl font-bold text-[var(--color-text-on-dark)] mb-1">
        Manda sua mensagem
      </h2>
      <p className="text-sm text-[var(--color-text-on-dark-muted)] mb-6">
        Campos com * sao obrigatorios.
      </p>

      {/* Tipo de lead */}
      <fieldset className="mb-5">
        <legend className="block text-xs uppercase tracking-wider text-[var(--color-text-on-dark-muted)] font-semibold mb-2">
          Voce e *
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {leadTypes.map((opt) => {
            const isActive = type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`rounded-lg border p-3 text-left transition-all ${
                  isActive
                    ? "border-[var(--color-cyber-blue)] bg-[var(--color-cyber-blue)]/10"
                    : "border-[var(--color-border-on-dark)] bg-[var(--bg-secondary)] hover:border-[var(--color-border-on-dark-active)]"
                }`}
              >
                <p
                  className={`text-sm font-bold ${
                    isActive
                      ? "text-[var(--color-cyber-blue)]"
                      : "text-[var(--color-text-on-dark)]"
                  }`}
                >
                  {opt.label}
                </p>
                <p className="text-xs text-[var(--color-text-on-dark-muted)] mt-0.5">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-4">
        <Field label="Nome *">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={200}
            autoComplete="name"
            className="w-full rounded-md border border-[var(--color-border-on-dark)] bg-[var(--bg-secondary)] px-3 py-2.5 text-base text-[var(--color-text-on-dark)] placeholder:text-[var(--color-text-on-dark-muted)]/60 focus:border-[var(--color-cyber-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-cyber-blue)]/30 transition"
            placeholder="Seu nome completo"
          />
        </Field>

        <Field label="E-mail *">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={200}
            autoComplete="email"
            className="w-full rounded-md border border-[var(--color-border-on-dark)] bg-[var(--bg-secondary)] px-3 py-2.5 text-base text-[var(--color-text-on-dark)] placeholder:text-[var(--color-text-on-dark-muted)]/60 focus:border-[var(--color-cyber-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-cyber-blue)]/30 transition"
            placeholder="seu@email.com"
          />
        </Field>

        <Field label="Telefone (opcional)">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={50}
            autoComplete="tel"
            className="w-full rounded-md border border-[var(--color-border-on-dark)] bg-[var(--bg-secondary)] px-3 py-2.5 text-base text-[var(--color-text-on-dark)] placeholder:text-[var(--color-text-on-dark-muted)]/60 focus:border-[var(--color-cyber-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-cyber-blue)]/30 transition"
            placeholder="(11) 99999-9999"
          />
        </Field>

        <Field label="Mensagem *">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={10}
            maxLength={5000}
            rows={5}
            className="w-full rounded-md border border-[var(--color-border-on-dark)] bg-[var(--bg-secondary)] px-3 py-2.5 text-base text-[var(--color-text-on-dark)] placeholder:text-[var(--color-text-on-dark-muted)]/60 focus:border-[var(--color-cyber-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-cyber-blue)]/30 transition resize-y"
            placeholder="Conta o que voce precisa. Quanto mais detalhe, melhor a gente te ajuda."
          />
          <p className="text-xs text-[var(--color-text-on-dark-muted)] mt-1 text-right">
            {message.length} / 5000
          </p>
        </Field>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            "Enviando..."
          ) : (
            <>
              <Send size={18} />
              Enviar mensagem
            </>
          )}
        </button>

        <p className="text-xs text-[var(--color-text-on-dark-muted)] text-center">
          Ao enviar, voce concorda com a politica de privacidade. A gente nao compartilha seus dados.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-[var(--color-text-on-dark-muted)] font-semibold mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}