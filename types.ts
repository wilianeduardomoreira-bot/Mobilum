
// Enum defining the main navigation tabs
export enum View {
  DASHBOARD = 'Dashboard',
  SUITES = 'Suítes',
  CALENDAR = 'Calendário',
  REPORTS = 'Relatórios',
  MAINTENANCE = 'Manutenção',
  CASHIER = 'Caixa',
  CHAT = 'Chat Interno',
  AI_ASSISTANT = 'Assistente IA',
  SETTINGS = 'Configurações',
}

export enum RoomStatus {
  AVAILABLE = 'Disponível',
  OCCUPIED = 'Ocupado',
  DIRTY = 'Limpeza',
  MAINTENANCE = 'Manutenção',
  BLOCKED = 'Bloqueado',
}

export interface Room {
  id: number;
  number: string;
  type: 'Standard' | 'Luxo' | 'Master';
  status: RoomStatus;
  guestName?: string;
  bedType: 'casal' | 'duplo' | 'triplo';
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
  paymentMethod?: 'cash' | 'credit' | 'debit' | 'pix'; // Added for detailed closing
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isMe: boolean;
}

export interface MaintenanceTicket {
  id: string;
  roomNumber: string;
  issue: string;
  priority: 'Baixa' | 'Média' | 'Alta';
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
  createdAt?: string; // Data de entrada
  resolvedAt?: string; // Data de conclusão
}

// --- PRODUCT CATALOG ---
export interface Product {
  id: string;
  code: string;
  name: string;
  category: 'Frigobar' | 'Bar' | 'Restaurante' | 'Recepção' | 'Outros';
  price: number;
  stock: number;
  minStock: number;
  description?: string;
}

// --- BOOKING & CONSUMPTION TYPES ---

export interface CheckInForm {
  guestName: string;
  documentType: 'RG' | 'CPF' | 'CNH';
  document: string;
  phone: string;
  email: string;
  guestsCount: number;
  vehicleModel: string;
  vehicleColor: string;
  vehiclePlate: string;
  checkInDate: string;
  checkInTime: string;
  expectedCheckout: string;
  dailyRate: number;
  // Initial payment info only
  initialPayment: number;
  initialPaymentMethod: string;
  wakeUpEnabled: boolean;
  wakeUpDate: string;
  wakeUpCall: string;
  notes: string;
}

export interface ConsumptionItem {
  id: string;
  item: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  timestamp: Date;
}

export interface PaymentEntry {
  id: string;
  amount: number;
  method: string;
  timestamp: Date;
}

// Extended booking data for occupied rooms
export interface BookingData extends CheckInForm {
  roomId: number;
  consumption: ConsumptionItem[];
  payments: PaymentEntry[];
}

// --- ACCESS CONTROL TYPES ---

export type Role = 'Arrumadeira' | 'Recepcionista' | 'Manutenção' | 'Gerente' | 'Administrador' | 'Administrador Master';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  password?: string;
  role: Role;
  photoUrl?: string;
  permissions: {
    suites: boolean;
    dashboard: boolean;
    calendar: boolean;
    reports: boolean;
    maintenance: boolean;
    cashier: boolean;
    chat: boolean;
    settings: boolean;
  };
}

// --- ACTIVITY LOG (AUDIT) ---
export type ActivityType = 'CHECK_IN' | 'CHECK_OUT' | 'RESERVATION' | 'MAINTENANCE' | 'CLEANING' | 'FINANCIAL' | 'SYSTEM' | 'ACCESS';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  action: string;
  description: string;
  user: string; // The operator
  timestamp: Date;
  details?: string; // Optional extra details
}
