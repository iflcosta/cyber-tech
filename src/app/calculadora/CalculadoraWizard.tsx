"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Laptop, Monitor, Zap, AlertTriangle, Wifi, Gauge, Ticket } from "lucide-react";
import { trackLead } from "@/lib/leads";
import { getOrCreateSessionVoucher } from "@/lib/session/voucherSession";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
type DeviceType = "notebook" | "desktop";
type SymptomType = "nao-liga" | "lento" | "tela-quebrada" | "mais-potencia";
type AgeType = "menos-2" | "3-5" | "mais-5";

interface WizardState {
  device: DeviceType | null;
  symptom: SymptomType | null;
  age: AgeType | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DEVICE_LABELS: Record<DeviceType, string> = {
  notebook: "Notebook",
  desktop: "Desktop / PC Gamer",
};

const SYMPTOM_LABELS: Record<SymptomType, string> = {
  "nao-liga": "Não Liga",
  lento: "Muito Lento / Travando",
  "tela-quebrada": "Tela / Carcaça Quebrada",
  "mais-potencia": "Quero Rodar Jogos / Programas Pesados",
};

const AGE_LABELS: Record<AgeType, string> = {
  "menos-2": "Menos de 2 anos",
  "3-5": "3 a 5 anos",
  "mais-5": "Mais de 5 anos",
};

// ─── Approximate Price Ranges ─────────────────────────────────────────────────
type PriceRange = { min: number; max: number; label: string };

const PRICE_TABLE: Record<DeviceType, Record<SymptomType, PriceRange>> = {
  notebook: {
    "nao-liga":       { min: 120, max: 350, label: "Diagnóstico + reparo elétrico" },
    lento:            { min: 150, max: 400, label: "Limpeza, SSD, RAM ou formatação" },
    "tela-quebrada":  { min: 280, max: 650, label: "Troca de tela / carcaça" },
    "mais-potencia":  { min: 200, max: 600, label: "Upgrade de SSD / RAM / GPU externa" },
  },
  desktop: {
    "nao-liga":       { min: 80,  max: 250, label: "Diagnóstico + reparo de fonte/placa" },
    lento:            { min: 80,  max: 300, label: "Limpeza, SSD, mais RAM" },
    "tela-quebrada":  { min: 60,  max: 200, label: "Troca de periférico / carcaça" },
    "mais-potencia":  { min: 150, max: 600, label: "Upgrade de peças / nova GPU" },
  },
};

function getPriceRange(device: DeviceType, symptom: SymptomType): PriceRange {
  return PRICE_TABLE[device][symptom];
}

function calcScore(symptom: SymptomType, age: AgeType): number {
  let score = 70;
  if (age === "mais-5") score -= 30;
  if (age === "menos-2") score += 20;
  if (symptom === "mais-potencia") score -= 20;
  if (symptom === "nao-liga") score -= 10;
  if (symptom === "lento") score += 5;
  if (symptom === "tela-quebrada") score += 10;
  return Math.min(100, Math.max(0, score));
}

function buildWALink(
  device: DeviceType, symptom: SymptomType, age: AgeType,
  type: "repair" | "buy", name: string, voucher: string
): string {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP || "5511999999999";
  let msg = "";
  if (type === "repair") {
    msg =
      `Olá! Me chamo ${name}. Usei a calculadora da Cyber Informática.\n` +
      `Meu ${DEVICE_LABELS[device]} de ${AGE_LABELS[age]} está com problema: ${SYMPTOM_LABELS[symptom]}.\n` +
      `Gostaria de agendar uma avaliação técnica.\n` +
      `🎫 Meu voucher: *${voucher}*`;
  } else {
    msg =
      `Olá! Me chamo ${name}. Usei a calculadora da Cyber Informática.\n` +
      `Meu ${DEVICE_LABELS[device]} de ${AGE_LABELS[age]} — ${SYMPTOM_LABELS[symptom]}.\n` +
      `Estou interessado em ver configurações novas de PC/Workstation.\n` +
      `🎫 Meu voucher: *${voucher}*`;
  }
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  const steps = ["Equipamento", "Sintoma", "Idade"];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold transition-all duration-500 ${
                i + 1 < step
                  ? "bg-[var(--accent-success)] border-[var(--accent-success)] text-white"
                  : i + 1 === step
                  ? "bg-white border-white text-[#121216] shadow-[0_0_16px_rgba(255,255,255,0.3)]"
                  : "bg-transparent border-white/20 text-white/30"
              }`}
            >
              {i + 1 < step ? "✓" : i + 1}
            </div>
            <span
              className={`text-[9px] font-mono uppercase tracking-widest mt-1.5 transition-all duration-500 ${
                i + 1 === step ? "text-white" : "text-white/30"
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-16 md:w-24 h-[2px] mx-2 mb-5 transition-all duration-700 ${
                i + 1 < step ? "bg-[var(--accent-success)]" : "bg-white/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function OptionCard({
  label, sublabel, icon, selected, onClick,
}: {
  label: string; sublabel?: string; icon: React.ReactNode; selected: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative w-full p-6 border-2 rounded-lg text-left transition-all duration-300 cursor-pointer flex items-center gap-5 ${
        selected
          ? "border-white bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          : "border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.06]"
      }`}
    >
      <div className={`flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center transition-all duration-300 ${selected ? "bg-white/20" : "bg-white/5"}`}>
        {icon}
      </div>
      <div>
        <div className={`font-display font-bold text-xl uppercase leading-tight ${selected ? "text-white" : "text-slate-300"}`}>{label}</div>
        {sublabel && <div className="text-xs font-mono text-slate-500 mt-1">{sublabel}</div>}
      </div>
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#121216]" />
        </div>
      )}
    </motion.button>
  );
}

// ─── Gauge ────────────────────────────────────────────────────────────────────
function ViabilityGauge({ score }: { score: number }) {
  const angle = -135 + (score / 100) * 270;
  const isRepair = score >= 60;
  const color = isRepair ? "#3A8F66" : "#E84C4C";
  const label = isRepair ? "VALE A PENA CONSERTAR" : "HORA DE ATUALIZAR";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-56 h-32 overflow-hidden">
        <svg viewBox="0 0 200 110" className="w-56 h-auto">
          <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
          <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${(score / 100) * 251.2} 251.2`} style={{ opacity: 0.9 }} />
          {[0, 25, 50, 75, 100].map((val) => {
            const a = (-135 + (val / 100) * 270) * (Math.PI / 180);
            const cx = 100 + 80 * Math.cos(a);
            const cy = 95 + 80 * Math.sin(a);
            return <circle key={val} cx={cx} cy={cy} r="2.5" fill="rgba(255,255,255,0.3)" />;
          })}
          <motion.g
            initial={{ rotate: -135, originX: "100px", originY: "95px" }}
            animate={{ rotate: angle, originX: "100px", originY: "95px" }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            style={{ transformOrigin: "100px 95px" }}
          >
            <line x1="100" y1="95" x2="100" y2="28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="95" r="6" fill="white" />
            <circle cx="100" cy="95" r="3" fill="#121216" />
          </motion.g>
          <text x="100" y="88" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Rajdhani, sans-serif">{score}</text>
          <text x="100" y="100" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="JetBrains Mono, monospace" letterSpacing="2">ÍNDICE</text>
        </svg>
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="text-center mt-2">
        <div className="text-lg md:text-2xl font-display font-bold uppercase tracking-widest" style={{ color }}>{label}</div>
      </motion.div>
    </div>
  );
}

// ─── Step Transitions ─────────────────────────────────────────────────────────
const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CalculadoraWizard() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>({ device: null, symptom: null, age: null });

  // Lead capture + voucher state
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [voucher, setVoucher] = useState<string | null>(null);
  const [leadDone, setLeadDone] = useState(false);

  const set = <K extends keyof WizardState>(key: K, val: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: val }));
  };

  const next = () => setStep((s) => s + 1);
  const reset = () => {
    setStep(1);
    setState({ device: null, symptom: null, age: null });
    setLeadName(""); setLeadPhone(""); setVoucher(null); setLeadDone(false);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.device || !state.symptom || !state.age) return;
    setSubmitting(true);
    const code = await getOrCreateSessionVoucher();
    const price = getPriceRange(state.device, state.symptom);
    await trackLead({
      client_name: leadName,
      whatsapp: leadPhone.replace(/\D/g, ""),
      interest_type: "calculadora",
      intent_type: state.symptom,
      description: `Equipamento: ${DEVICE_LABELS[state.device]} | Sintoma: ${SYMPTOM_LABELS[state.symptom]} | Idade: ${AGE_LABELS[state.age]} | Score: ${score} | Preço estimado: R$${price.min}-R$${price.max}`,
      voucher_code: code,
      marketing_source: "calculadora",
    });
    setVoucher(code);
    setLeadDone(true);
    setSubmitting(false);
  };

  const score = state.symptom && state.age ? calcScore(state.symptom, state.age) : 70;
  const isRepair = score >= 60;
  const priceRange = state.device && state.symptom ? getPriceRange(state.device, state.symptom) : null;

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {step <= 3 && <ProgressBar step={step} />}

      <AnimatePresence mode="wait">

        {/* ── Step 1: Device ── */}
        {step === 1 && (
          <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }}>
            <div className="text-center mb-8">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">PASSO 1 DE 3</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase">Qual é o equipamento?</h2>
            </div>
            <div className="flex flex-col gap-4">
              <OptionCard label="Notebook" sublabel="Laptop, Ultrabook, MacBook" icon={<Laptop size={28} className="text-slate-300" />} selected={state.device === "notebook"} onClick={() => { set("device", "notebook"); setTimeout(next, 300); }} />
              <OptionCard label="Desktop / PC Gamer" sublabel="Torre, All-in-One, PC Builder" icon={<Monitor size={28} className="text-slate-300" />} selected={state.device === "desktop"} onClick={() => { set("device", "desktop"); setTimeout(next, 300); }} />
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Symptom ── */}
        {step === 2 && (
          <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }}>
            <div className="text-center mb-8">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">PASSO 2 DE 3</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase">Qual é o problema?</h2>
            </div>
            <div className="flex flex-col gap-3">
              {([
                { id: "nao-liga",      label: "Não Liga",                  sub: "Não inicia, tela preta",           icon: <AlertTriangle size={24} className="text-[#E84C4C]" /> },
                { id: "lento",         label: "Muito Lento / Travando",    sub: "Demora pra abrir, trava, superaquece", icon: <Gauge size={24} className="text-amber-400" /> },
                { id: "tela-quebrada", label: "Tela / Carcaça Quebrada",   sub: "Tela rachada, botões, dobradiça",  icon: <Wifi size={24} className="text-blue-400" /> },
                { id: "mais-potencia", label: "Quero Mais Potência",       sub: "Rodar jogos, edição, IA, streamings", icon: <Zap size={24} className="text-green-400" /> },
              ] as const).map((opt) => (
                <OptionCard key={opt.id} label={opt.label} sublabel={opt.sub} icon={opt.icon} selected={state.symptom === opt.id} onClick={() => { set("symptom", opt.id as SymptomType); setTimeout(next, 300); }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Age ── */}
        {step === 3 && (
          <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }}>
            <div className="text-center mb-8">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">PASSO 3 DE 3</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase">Qual a idade da máquina?</h2>
              <p className="text-slate-400 text-sm font-mono mt-2">Aproximadamente, quanto tempo você usa esse equipamento?</p>
            </div>
            <div className="flex flex-col gap-4">
              {([
                { id: "menos-2", label: "Menos de 2 anos", sub: "Ainda relativamente novo",               badge: "ÓTIMO ESTADO" },
                { id: "3-5",     label: "3 a 5 anos",      sub: "Vale avaliar upgrades pontuais",          badge: "VARIA" },
                { id: "mais-5",  label: "Mais de 5 anos",  sub: "Pode ser hora de atualizar a plataforma", badge: "CRÍTICO" },
              ] as const).map((opt) => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { set("age", opt.id as AgeType); setTimeout(next, 300); }}
                  className={`w-full p-5 border-2 rounded-lg text-left transition-all duration-300 flex items-center justify-between ${
                    state.age === opt.id ? "border-white bg-white/10" : "border-white/10 bg-white/[0.03] hover:border-white/30"
                  }`}
                >
                  <div>
                    <div className="font-display font-bold text-xl uppercase text-white">{opt.label}</div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">{opt.sub}</div>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded border tracking-widest ${
                    opt.badge === "ÓTIMO ESTADO" ? "border-[var(--accent-success)] text-[var(--accent-success)] bg-[var(--accent-success)]/10"
                    : opt.badge === "VARIA"      ? "border-amber-500 text-amber-400 bg-amber-500/10"
                    :                              "border-[var(--accent-hot)] text-[var(--accent-hot)] bg-[var(--accent-hot)]/10"
                  }`}>{opt.badge}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Result + Lead Capture ── */}
        {step === 4 && state.device && state.symptom && state.age && (
          <motion.div key="step4" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.35 }}>

            {/* Terminal Header */}
            <div className="border border-white/10 rounded-t-lg px-4 py-2 bg-white/[0.03] flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-hot)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-success)]" />
              </div>
              <span className="text-[10px] font-mono text-slate-500 ml-2 uppercase tracking-widest">DIAGNÓSTICO // CYBER_INFORMÁTICA</span>
            </div>

            <div className="border border-t-0 border-white/10 rounded-b-lg p-6 md:p-8 bg-white/[0.03]">

              {/* Gauge */}
              <div className="flex justify-center mb-6">
                <ViabilityGauge score={score} />
              </div>

              {/* Summary table */}
              <div className="border border-white/10 rounded-lg p-4 mb-4 bg-[#0A0A0C]/50 font-mono text-xs space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-500 uppercase">// Equipamento</span><span className="text-slate-200">{DEVICE_LABELS[state.device]}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 uppercase">// Problema</span><span className="text-slate-200">{SYMPTOM_LABELS[state.symptom]}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 uppercase">// Idade</span><span className="text-slate-200">{AGE_LABELS[state.age]}</span></div>
                <div className="flex justify-between pt-1 border-t border-white/5">
                  <span className="text-slate-500 uppercase">// Índice</span>
                  <span className="font-bold" style={{ color: isRepair ? "#3A8F66" : "#E84C4C" }}>{score}/100</span>
                </div>
              </div>

              {/* Price Estimate — shown for repair-leaning results */}
              {priceRange && isRepair && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="border border-amber-500/30 rounded-lg p-4 mb-6 bg-amber-500/[0.05]"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-amber-400 text-[10px]">R$</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest mb-1">Estimativa de Custo (aprox.)</p>
                      <p className="text-2xl md:text-3xl font-display font-bold text-white">
                        R$ {priceRange.min} – R$ {priceRange.max}
                      </p>
                      <p className="text-xs font-mono text-slate-500 mt-1">{priceRange.label}</p>
                      <p className="text-[10px] font-mono text-slate-600 mt-2">
                        ⚠️ Valor estimado. O preço exato é definido após avaliação técnica gratuita.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Recommendation */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-sm text-slate-400 font-mono text-center mb-6 leading-relaxed"
              >
                {isRepair
                  ? "✅ O conserto/upgrade é viável. Para receber sua avaliação técnica e um voucher exclusivo, preencha abaixo:"
                  : "⚠️ Com base na idade e sintoma, um equipamento novo pode ser mais vantajoso. Preencha abaixo para receber atendimento personalizado:"}
              </motion.p>

              {/* ── Lead Capture Form ── */}
              {!leadDone ? (
                <motion.form
                  onSubmit={handleLeadSubmit}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="space-y-3 mb-4"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      required
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Seu nome"
                      className="flex-1 bg-white/5 border border-white/15 rounded-lg px-4 py-3.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-white/40 transition-all"
                    />
                    <input
                      required
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      placeholder="WhatsApp (11) 99999-9999"
                      type="tel"
                      className="flex-1 bg-white/5 border border-white/15 rounded-lg px-4 py-3.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-white/40 transition-all"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={{ scale: submitting ? 1 : 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-5 bg-white text-[#121216] font-display font-bold text-base uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {submitting ? (
                      <><span className="inline-block w-4 h-4 border-2 border-[#121216]/30 border-t-[#121216] rounded-full animate-spin" /> Gerando voucher...</>
                    ) : (
                      <><Ticket size={20} /> Gerar meu voucher e ir ao WhatsApp</>
                    )}
                  </motion.button>
                  <p className="text-[10px] font-mono text-slate-700 text-center">Seus dados são usados apenas para o atendimento técnico.</p>
                </motion.form>
              ) : (
                /* ── Voucher Revealed + CTAs ── */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Voucher display */}
                  <div className="border border-[var(--accent-success)]/40 rounded-lg p-4 bg-[var(--accent-success)]/[0.07] text-center">
                    <p className="text-[10px] font-mono text-[var(--accent-success)] uppercase tracking-widest mb-1">🎫 Seu Voucher Exclusivo</p>
                    <p className="text-3xl font-display font-bold text-white tracking-[0.3em]">{voucher}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">Envie este código no WhatsApp para garantir atendimento prioritário.</p>
                  </div>

                  {/* CTA buttons */}
                  <motion.a
                    href={buildWALink(state.device, state.symptom, state.age, "repair", leadName, voucher!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-3 w-full py-5 bg-white text-[#121216] font-display font-bold text-base uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    Agendar Avaliação com Voucher
                  </motion.a>

                  <Link
                    href="/#showroom"
                    className="flex items-center justify-center gap-3 w-full py-4 border border-white/15 text-slate-300 font-display font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-white/5 hover:border-white/30 transition-all font-display"
                  >
                    <Zap size={18} />
                    Ver Configurações Novas
                  </Link>

                  <button onClick={reset} className="block w-full text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors mt-1 uppercase tracking-widest text-center">
                    ↺ Refazer o diagnóstico
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
