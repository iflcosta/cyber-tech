/**
 * Tipos TypeScript inferidos do schema do Supabase.
 *
 * Manter sincronizado com /supabase/migrations/0001_init.sql.
 *
 * Apos rodar a migration, o ideal e gerar este arquivo via:
 *   npx supabase gen types typescript --project-id avfcsuyackxiaglldyvo \
 *     > admin/types/database.ts
 *
 * Por enquanto, escrevemos manualmente para nao depender do CLI.
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: 'owner' | 'technician';
          active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role: 'owner' | 'technician';
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          phone_search: string;
          email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      service_orders: {
        Row: {
          id: string;
          os_number: string | null;
          short_id: string;
          customer_id: string;
          equipment_type: 'computador' | 'notebook' | 'celular' | 'tablet' | 'outro';
          equipment_brand: string | null;
          equipment_model: string | null;
          equipment_color: string | null;
          equipment_serial: string | null;
          equipment_password: string | null;
          reported_defect: string;
          entry_checklist: Record<string, boolean | string>;
          accessories_in: string | null;
          status:
            | 'awaiting_approval'
            | 'approved'
            | 'in_progress'
            | 'waiting_part'
            | 'ready'
            | 'delivered'
            | 'cancelled';
          assigned_to: string | null;
          blocking_reason: string | null;
          estimated_value: number | null;
          estimated_ready_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          delivered_at: string | null;
        };
        Insert: {
          id?: string;
          os_number?: string | null;
          short_id?: string;
          customer_id: string;
          equipment_type:
            | 'computador'
            | 'notebook'
            | 'celular'
            | 'tablet'
            | 'outro';
          equipment_brand?: string | null;
          equipment_model?: string | null;
          equipment_color?: string | null;
          equipment_serial?: string | null;
          equipment_password?: string | null;
          reported_defect: string;
          entry_checklist?: Record<string, boolean | string>;
          accessories_in?: string | null;
          status?:
            | 'awaiting_approval'
            | 'approved'
            | 'in_progress'
            | 'waiting_part'
            | 'ready'
            | 'delivered'
            | 'cancelled';
          assigned_to?: string | null;
          blocking_reason?: string | null;
          estimated_value?: number | null;
          estimated_ready_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          delivered_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['service_orders']['Insert']>;
      };
      service_order_events: {
        Row: {
          id: string;
          service_order_id: string;
          event_type:
            | 'created'
            | 'status_changed'
            | 'assigned'
            | 'note_added'
            | 'checklist_updated'
            | 'part_resolved'
            | 'delivered';
          from_value: string | null;
          to_value: string | null;
          note: string | null;
          author_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          service_order_id: string;
          event_type:
            | 'created'
            | 'status_changed'
            | 'assigned'
            | 'note_added'
            | 'checklist_updated'
            | 'part_resolved'
            | 'delivered';
          from_value?: string | null;
          to_value?: string | null;
          note?: string | null;
          author_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['service_order_events']['Insert']>;
      };
      stock_items: {
        Row: {
          id: string;
          ean13: string | null;
          name: string;
          category: string | null;
          brand: string | null;
          model: string | null;
          unit_cost: number | null;
          unit_price: number;
          current_stock: number;
          min_stock: number;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ean13?: string | null;
          name: string;
          category?: string | null;
          brand?: string | null;
          model?: string | null;
          unit_cost?: number | null;
          unit_price: number;
          current_stock?: number;
          min_stock?: number;
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['stock_items']['Insert']>;
      };
      stock_movements: {
        Row: {
          id: string;
          stock_item_id: string;
          movement_type: 'in' | 'out' | 'adjust' | 'sale';
          quantity: number;
          unit_price: number | null;
          total_amount: number | null;
          reference: string | null;
          notes: string | null;
          author_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          stock_item_id: string;
          movement_type: 'in' | 'out' | 'adjust' | 'sale';
          quantity: number;
          unit_price?: number | null;
          total_amount?: number | null;
          reference?: string | null;
          notes?: string | null;
          author_id: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['stock_movements']['Insert']>;
      };
      sales: {
        Row: {
          id: string;
          sale_number: string;
          subtotal: number;
          discount: number;
          total: number;
          payment_method: 'cash' | 'pix' | 'card' | 'transfer' | 'other';
          customer_name: string | null;
          customer_phone: string | null;
          notes: string | null;
          author_id: string;
          created_at: string;
          voided_at: string | null;
          voided_by: string | null;
          voided_reason: string | null;
        };
        Insert: {
          id?: string;
          sale_number?: string;
          subtotal: number;
          discount?: number;
          total: number;
          payment_method: 'cash' | 'pix' | 'card' | 'transfer' | 'other';
          customer_name?: string | null;
          customer_phone?: string | null;
          notes?: string | null;
          author_id: string;
          created_at?: string;
          voided_at?: string | null;
          voided_by?: string | null;
          voided_reason?: string | null;
        };
        Update: Partial<Database['public']['Tables']['sales']['Insert']>;
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          stock_item_id: string;
          item_name: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          stock_item_id: string;
          item_name: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sale_items']['Insert']>;
      };
    };
    Views: {
      service_orders_with_stale: {
        Row: Database['public']['Tables']['service_orders']['Row'] & {
          customer_name: string;
          customer_phone: string | null;
          assigned_to_name: string | null;
          days_since_update: number;
        };
      };
      stock_low_alert: {
        Row: Database['public']['Tables']['stock_items']['Row'] & {
          units_to_reorder: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/* ---------- Helpers de tipos ---------- */

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Customer = Database['public']['Tables']['customers']['Row'];
export type ServiceOrder = Database['public']['Tables']['service_orders']['Row'];
export type ServiceOrderEvent = Database['public']['Tables']['service_order_events']['Row'];
export type ServiceOrderWithStale = Database['public']['Views']['service_orders_with_stale']['Row'];
export type StockItem = Database['public']['Tables']['stock_items']['Row'];
export type StockMovement = Database['public']['Tables']['stock_movements']['Row'];
export type StockLowAlert = Database['public']['Views']['stock_low_alert']['Row'];
export type Sale = Database['public']['Tables']['sales']['Row'];
export type SaleItem = Database['public']['Tables']['sale_items']['Row'];

/* ---------- Constantes de UI ---------- */

export const OS_STATUSES = [
  { value: 'awaiting_approval', label: 'Aguardando aprovação', color: 'amber' },
  { value: 'approved', label: 'Aprovado', color: 'blue' },
  { value: 'in_progress', label: 'Em bancada', color: 'indigo' },
  { value: 'waiting_part', label: 'Aguardando peça', color: 'orange' },
  { value: 'ready', label: 'Pronto', color: 'emerald' },
  { value: 'delivered', label: 'Entregue', color: 'slate' },
  { value: 'cancelled', label: 'Cancelada', color: 'red' },
] as const;

export type OSStatusValue = (typeof OS_STATUSES)[number]['value'];

export const EQUIPMENT_TYPES = [
  { value: 'computador', label: 'Computador' },
  { value: 'notebook', label: 'Notebook' },
  { value: 'celular', label: 'Celular' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'outro', label: 'Outro' },
] as const;

export type EquipmentTypeValue = (typeof EQUIPMENT_TYPES)[number]['value'];

export const ENTRY_CHECKLIST_FIELDS = [
  { key: 'liga', label: 'Liga' },
  { key: 'tela_ok', label: 'Tela OK' },
  { key: 'carrega', label: 'Carrega' },
  { key: 'molhou', label: 'Teve contato com líquido' },
  { key: 'queda', label: 'Sofreu queda' },
  { key: 'senha_conhecida', label: 'Senha conhecida' },
] as const;

export const STOCK_MOVEMENT_TYPES = [
  { value: 'in', label: 'Entrada (compra)', color: 'emerald' },
  { value: 'out', label: 'Saída (uso)', color: 'orange' },
  { value: 'adjust', label: 'Ajuste', color: 'slate' },
  { value: 'sale', label: 'Venda', color: 'blue' },
] as const;

export type StockMovementTypeValue = (typeof STOCK_MOVEMENT_TYPES)[number]['value'];

export const STOCK_CATEGORY_SUGGESTIONS = [
  'Cabos',
  'Fontes',
  'Memórias',
  'SSDs',
  'HDs',
  'Acessórios',
  'Telas',
  'Baterias',
  'Teclados',
  'Mouses',
  'Adaptadores',
  'Carregadores',
] as const;

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'card', label: 'Cartão' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'other', label: 'Outro' },
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]['value'];
