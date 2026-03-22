"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "./ui/Button";

const categories = [
  { id: "all", label: "TUDO" },
  { id: "workstation_ai", label: "WORKSTATION IA" },
  { id: "gamer", label: "PC GAMER" },
  { id: "office", label: "OFFICE PRO" },
  { id: "hardware", label: "HARDWARE" },
  { id: "perifericos", label: "PERIFÉRICOS" },
  { id: "smartphone", label: "SMARTPHONE" },
];

export function FilterBar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentCategory = searchParams.get("category") || "all";

  const handleFilter = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") {
      params.delete("category");
    } else {
      params.set("category", id);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="card-dark flex flex-wrap items-center gap-2 md:gap-4 p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl mb-8 shadow-sm">
      <span className="text-[10px] font-display font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mr-2">
        Filtrar por:
      </span>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleFilter(cat.id)}
          className={cn(
            "px-4 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-[0.15em] transition-all duration-300",
            currentCategory === cat.id
              ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md"
              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
