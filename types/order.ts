export type PaymentStatus = 'PENDIENTE' | 'PAGADO' | 'FALLIDO';
export type FulfillmentStatus =
  | 'EN PREPARACION'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface SizeQuantities {
  S: number;
  M: number;
  L: number;
  XL: number;
  '2XL': number;
}

export interface Order {
  id: string;
  created_at: string;
  nombre: string;
  cedula: string | null;
  whatsapp: string;
  correo: string | null;
  pais: string;
  provincia: string | null;
  ciudad: string | null;
  direccion: string | null;
  sizes: SizeQuantities;
  total_units: number;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  is_international: boolean;
  payphone_transaction_id: string | null;
  client_transaction_id: string | null;
  notes: string | null;
}
