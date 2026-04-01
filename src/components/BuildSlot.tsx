import * as React from "react";
import { Plus, Check, ChevronDown, X } from "lucide-react";
import { Card } from "./ui/Card";
import { cn } from "./ui/Button"; // Corrected import path

interface BuildSlotProps {
  label: string;
  icon: React.ReactNode;
  selected?: any;
  onSelect: () => void;
  onClear: () => void;
}

export function BuildSlot({ label, icon, selected, onSelect, onClear }: BuildSlotProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-2">
        <label className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] flex items-center gap-2">
          {icon}
          {label}
        </label>
        {selected && (
          <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors">
            <X size={12} />
          </button>
        )}
      </div>

      <Card 
        onClick={onSelect}
        className={cn(
          "relative group cursor-pointer border transition-all min-h-[90px] flex flex-col justify-center px-6 py-4 rounded-xl overflow-hidden",
          selected 
            ? "bg-[var(--bg-surface)] border-[var(--accent-primary)]/40 shadow-[0_0_20px_rgba(255,107,0,0.05)]" 
            : "bg-[var(--bg-elevated)] border-[var(--border-subtle)] border-dashed hover:border-[var(--border-active)]"
        )}
      >
        <div className="absolute top-0 right-0 p-2 opacity-5">
            {icon}
        </div>

        {!selected ? (
          <div className="flex items-center justify-between text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">CONFIGURAR {label}</span>
            <Plus className="h-4 w-4 text-[var(--accent-primary)]" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex-1 overflow-hidden">
              <h4 className="font-display font-bold uppercase tracking-tight text-[var(--text-primary)] leading-tight truncate">
                {selected.name}
              </h4>
            </div>
            <ChevronDown className="h-4 w-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
          </div>
        )}
      </Card>
    </div>
  );
}
