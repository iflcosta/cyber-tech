import Image from "next/image";
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

  if (day >= 1 && day <= 5) return time >= 9 && time < 18.5;
  if (day === 6) return time >= 9 && time < 13;
  return false;
}

export interface Product {
  id: string;
  name: string;
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
  onAddToCart?: () => void;
}

export function ProductCard({ product, onOpenGallery, onInterest }: ProductCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    setIsOpen(isStoreOpen());
  }, []);

  const handleViewDetails = () => {
    const images = product.image_urls || [product.image_url].filter(Boolean) as string[];
    onOpenGallery?.(images);
  };

  return (
    <Card className="card-dark group flex flex-col h-full card-industrial border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden transition-all duration-300 hover:border-[var(--accent-primary)]/50">
      {/* Visual Header / Image Section */}
      <div 
        className="relative aspect-video w-full overflow-hidden bg-[var(--bg-primary)] cursor-zoom-in group-hover:brightness-110 transition-all border-b border-[var(--border-subtle)]/30"
        onClick={handleViewDetails}
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
        
        {/* Hover Overlay Hint */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-10">
          <div className="flex flex-col items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <span className="text-[10px] font-display font-bold text-white uppercase tracking-[0.2em] border border-white/20 px-4 py-2 rounded-full bg-white/10 shadow-2xl backdrop-blur-md">
              Ver Galeria Completa
            </span>
          </div>
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
          {product.in_stock && (
            <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] uppercase font-bold tracking-widest px-2 py-1 backdrop-blur-md">
              <Zap className="h-2 w-2 mr-1 fill-current" /> Em Estoque
            </Badge>
          )}
        </div>
        
        <div className="absolute bottom-4 left-4 z-20">
          <PerformanceBadge score={product.performance_score} variant="mini" />
        </div>
      </div>

      {/* Content Section (Clickable for Gallery) */}
      <div 
        className="flex-1 p-6 cursor-pointer group/content"
        onClick={handleViewDetails}
      >
        <div className="space-y-1 mb-4">
          <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-[var(--border-subtle)] text-[var(--text-muted)] rounded-sm">
            {product.category.replace('_', ' ')}
          </Badge>
          <h3 className="text-lg font-display font-bold uppercase tracking-tight text-white group-hover:text-[var(--accent-primary)] transition-colors leading-tight">
            {product.name}
          </h3>
        </div>

        <div className="space-y-2.5 mb-6">
          {(product.specs.cpu || product.specs.Chip) && (
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
              <Cpu className="h-3.5 w-3.5 text-[var(--accent-primary)]/50" />
              <span className="truncate">{product.specs.cpu || product.specs.Chip}</span>
            </div>
          )}
          {(product.specs.gpu || product.specs.Câmera) && (
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
              <Zap className="h-3.5 w-3.5 text-[var(--accent-primary)]/50" />
              <span className="truncate">{product.specs.gpu || product.specs.Câmera}</span>
            </div>
          )}
          {(product.specs.ram || product.specs.Tela) && (
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono">
              <div className="h-3.5 w-3.5 rounded-full border border-[var(--accent-primary)]/30 flex items-center justify-center text-[8px] font-bold text-[var(--accent-primary)]">R</div>
              <span className="text-[var(--text-primary)]">
                {product.specs.ram || product.specs.Tela}
              </span>
              {product.specs.storage && <span className="opacity-40">• {product.specs.storage}</span>}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[var(--border-subtle)]/50 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-bold mb-1">Preço Estimado</span>
            <span className="text-2xl font-display font-bold text-white tracking-tighter">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price || product.price_estimate)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Section (Interest Button) */}
      <CardFooter className="p-6 pt-0">
        <Button 
          size="sm" 
          className={`w-full ${
            isOpen 
              ? "btn-success" 
              : "btn-primary"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onInterest?.();
          }}
        >
          <MessageSquare className="h-4 w-4" />
          {isOpen ? "ORÇAMENTO AGORA" : "TENHO INTERESSE"}
        </Button>
      </CardFooter>
    </Card>
  );
}
