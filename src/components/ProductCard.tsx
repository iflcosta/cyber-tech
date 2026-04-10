import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Cpu, Zap, Package } from "lucide-react";
import { Card, CardFooter } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { PerformanceBadge } from "./PerformanceBadge";
import { useEffect, useState } from "react";

function isStoreOpen() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const time = hour + minutes / 60;

  if (day >= 1 && day <= 5) return time >= 9 && time < 18;
  if (day === 6) return time >= 9 && time < 13;
  return false;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  category: string;
  specs: {
    cpu: string;
    gpu?: string;
    ram: string;
    storage: string;
    [key: string]: any;
  };
  price: number;
  price_estimate: number;
  performance_score: number;
  in_stock: boolean;
  image_urls?: string[];
  image_url?: string;
  show_in_showroom?: boolean;
  show_in_catalog?: boolean;
  show_in_pcbuilder?: boolean;
}

interface ProductCardProps {
  product: Product;
  onOpenGallery?: (images: string[]) => void;
  onInterest?: () => void;
}

const CONTENT_CLASS = "flex-1 p-4 cursor-pointer group/content block";

function CardContent({ product }: { product: Product }) {
  return (
    <>
      <div className="space-y-0.5 mb-2">
        <Badge variant="outline" className="text-[9px] uppercase tracking-[0.15em] border-[var(--accent-primary)]/30 text-[var(--accent-primary)] rounded-sm bg-[var(--accent-primary)]/5">
          {product.category.replace('_', ' ')}
        </Badge>
        <h3 className="text-base font-display font-bold uppercase tracking-tight text-white group-hover:text-[var(--accent-primary)] transition-colors leading-tight">
          {product.name}
        </h3>
      </div>

      <div className="space-y-1.5 mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
        {(product.specs.cpu || product.specs.Chip) && (
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
            <Cpu className="h-3.5 w-3.5 text-[var(--accent-primary)] shrink-0" />
            <span className="truncate text-[var(--text-secondary)] brightness-150">{product.specs.cpu || product.specs.Chip}</span>
          </div>
        )}
        {(product.specs.gpu || product.specs.Câmera) && (
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
            <Zap className="h-3.5 w-3.5 text-[var(--accent-primary)] shrink-0" />
            <span className="truncate text-[var(--text-secondary)] brightness-150">{product.specs.gpu || product.specs.Câmera}</span>
          </div>
        )}
        {(product.specs.ram || product.specs.Tela) && (
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
            <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-[var(--accent-primary)]/50 flex items-center justify-center text-[8px] font-bold text-[var(--accent-primary)]">R</div>
            <span className="text-[var(--text-primary)] brightness-200 truncate">
              {product.specs.ram || product.specs.Tela}
            </span>
            {product.specs.storage && <span className="opacity-60 shrink-0">• {product.specs.storage}</span>}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[var(--border-subtle)]/50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Preço Estimado</span>
          <span className="text-xl font-display font-bold text-white tracking-tighter">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price || product.price_estimate)}
          </span>
        </div>
      </div>
    </>
  );
}

export function ProductCard({ product, onOpenGallery, onInterest }: ProductCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(isStoreOpen());
  }, []);

  const handleOpenGallery = () => {
    const images = product.image_urls || [product.image_url].filter(Boolean) as string[];
    onOpenGallery?.(images);
  };

  return (
    <Card className="card-dark group flex flex-col h-full card-industrial border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden transition-all duration-300 hover:border-[var(--accent-primary)]/50">
      {/* Image — sempre abre galeria */}
      <div
        className="relative aspect-video w-full overflow-hidden bg-[var(--bg-primary)] cursor-zoom-in group-hover:brightness-110 transition-all border-b border-[var(--border-subtle)]/30"
        onClick={handleOpenGallery}
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--bg-elevated)]">
            <Package className="h-10 w-10 text-[var(--border-active)]" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-10">
          <span className="text-[10px] font-display font-bold text-white uppercase tracking-[0.2em] border border-white/20 px-4 py-2 rounded-full bg-white/10 shadow-2xl backdrop-blur-md">
            Ver Galeria Completa
          </span>
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          {product.in_stock && (
            <Badge className="bg-emerald-500 text-white border-none text-[9px] uppercase font-black tracking-widest px-3 py-1 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <Zap className="h-2.5 w-2.5 mr-1 fill-current" /> PRONTA ENTREGA
            </Badge>
          )}
        </div>

        <div className="absolute bottom-4 left-4 z-20">
          <PerformanceBadge score={product.performance_score} variant="mini" />
        </div>
      </div>

      {/* Conteúdo — slug navega para página, sem slug abre galeria */}
      {product.slug ? (
        <Link href={`/produtos/${product.slug}`} className={CONTENT_CLASS}>
          <CardContent product={product} />
        </Link>
      ) : (
        <div className={CONTENT_CLASS} onClick={handleOpenGallery}>
          <CardContent product={product} />
        </div>
      )}

      {/* Footer */}
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full h-11 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.5)] transition-all group/btn"
          onClick={(e) => {
            e.stopPropagation();
            onInterest?.();
          }}
        >
          <MessageSquare className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
          <span className="font-black tracking-widest">{isOpen ? "CONSULTAR AGORA" : "INTERESSE IMEDIATO"}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
