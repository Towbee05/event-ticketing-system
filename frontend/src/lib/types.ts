export interface EventDoc {
  _id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  category?: string;
  bannerImage?: string;
  status: "draft" | "published" | "cancelled";
  organizer: string | { _id: string; name?: string; email?: string };
}

export interface TicketDoc {
  _id: string;
  event: string | EventDoc;
  ticketType?: "early-bird" | "regular" | "vip-ticket";
  price: string | number;
  quantity: number;
  sold: number;
  salesStartDate: string;
  salesEndDate: string;
}

export interface OrderItemDoc {
  _id: string;
  order: string;
  ticket: TicketDoc | string;
  quantity: number;
  unitPrice: string | number;
  subTotal: number;
}

export interface OrderDoc {
  _id: string;
  user: string | { _id: string; name?: string; email?: string };
  event: string | EventDoc;
  totalAmount: string | number;
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "pending" | "completed" | "cancelled";
  createdAt: string;
  items?: OrderItemDoc[];
}

export interface NotificationDoc {
  _id: string;
  user: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaymentInitResponse {
  authorizationUrl: string;
  reference: string;
  provider: string;
}

export interface IssuedTicketDoc {
  _id: string;
  order: string;
  orderItem: string;
  event: string | EventDoc;
  holder: string | { _id: string; name?: string; email?: string };
  ticketType?: { _id: string; ticketType?: string; price?: string | number } | string;
  code: string;
  status: "valid" | "used" | "cancelled";
  usedAt?: string;
  createdAt: string;
}

export interface PaymentVerifyResponse {
  reference: string;
  status: "pending" | "successful" | "failed";
  order: OrderDoc;
  alreadyVerified: boolean;
}
