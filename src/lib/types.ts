export type DealStatus = "new" | "overdue" | "manager" | "measurer" | "finance" | "done";

export const STATUS_LABELS: Record<DealStatus, string> = {
  new: "Новые",
  overdue: "Дожим",
  manager: "У менеджера ОП",
  measurer: "У замерщика",
  finance: "Финансист",
  done: "Завершено",
};

export const STATUS_COLORS: Record<DealStatus, string> = {
  new: "bg-status-new",
  overdue: "bg-status-overdue",
  manager: "bg-status-manager",
  measurer: "bg-status-measurer",
  finance: "bg-status-finance",
  done: "bg-status-done",
};

export type ServiceType = "moskitka" | "plisse" | "remont" | "okno";

export const SERVICE_LABELS: Record<ServiceType, string> = {
  moskitka: "Москитные сетки",
  plisse: "Плиссе",
  remont: "Ремонт окон",
  okno: "Окна ПВХ",
};

export interface ChatMessage {
  id: string;
  author: string;
  text: string;
  at: string; // ISO
  fromClient?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  kind: "photo" | "doc";
}

export interface Deal {
  id: number;
  status: DealStatus;
  client: string;
  phone: string;
  city: string;
  service: ServiceType;
  address?: string;
  comment: string;
  responsible: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  source: "site" | "call" | "whatsapp" | "instagram";
  amount?: number;
  attachments: Attachment[];
  chat: ChatMessage[];
  unread: number;
}
