import api from './client';

// ---------- Types ----------
export interface User {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  avatar?: string;
  role: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  image?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  duration?: string;
  rating?: number;
  reviewCount?: number;
}

export interface Worker {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  totalReviews?: number;
  totalJobs?: number;
  distanceKm?: number;
  skills?: string[];
  experienceYears?: number;
  experience?: number;
  isOnline?: boolean;
  bio?: string;
  latitude?: number;
  longitude?: number;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city?: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface Booking {
  id: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  total?: number;
  items?: { service: Service; quantity: number }[];
  worker?: Worker;
  address?: Address;
  review?: { id: string; rating: number } | null;
  createdAt: string;
}

// ---------- Auth ----------
export const AuthAPI = {
  sendOtp: (phone: string, role = 'CUSTOMER') =>
    api.post('/auth/send-otp', { phone, role }),
  verifyOtp: (phone: string, otp: string, role = 'CUSTOMER') =>
    api.post('/auth/verify-otp', { phone, otp, role }),
  me: () => api.get<User>('/auth/me'),
};

// ---------- Users ----------
export const UserAPI = {
  getProfile: () => api.get<User>('/users/profile'),
  updateProfile: (data: Partial<User>) => api.put('/users/profile', data),
  updateFcmToken: (fcmToken: string) =>
    api.put('/users/fcm-token', { fcmToken }),
  getAddresses: () => api.get<Address[]>('/users/addresses'),
  addAddress: (data: Omit<Address, 'id'>) => api.post('/users/addresses', data),
  updateAddress: (id: string, data: Partial<Address>) =>
    api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),
  getSavedCards: () => api.get('/users/saved-cards'),
  deleteSavedCard: (id: string) => api.delete(`/users/saved-cards/${id}`),
};

// ---------- Categories & Services ----------
export const CatalogAPI = {
  getCategories: () => api.get<Category[]>('/categories'),
  getCategory: (id: string) => api.get<Category>(`/categories/${id}`),
  getServices: (params?: { categoryId?: string; search?: string }) =>
    api.get<Service[]>('/services', { params }),
  getPopularServices: () => api.get<Service[]>('/services/popular'),
  getService: (id: string) => api.get<Service>(`/services/${id}`),
};

// ---------- Workers ----------
export const WorkerAPI = {
  getNearby: (params: { lat: number; lng: number; serviceId?: string }) =>
    api.get<Worker[]>('/workers/nearby', { params }),
  getById: (workerId: string) => api.get<Worker>(`/workers/${workerId}`),
  getReviews: (workerId: string) => api.get(`/workers/${workerId}/reviews`),
};

// ---------- Bookings ----------
export interface CreateBookingPayload {
  items: { serviceId: string; quantity: number }[];
  scheduledDate: string;
  scheduledTime: string;
  addressId?: string;
  description?: string;
  images?: string[];
  couponId?: string;
}

export const BookingAPI = {
  create: (data: CreateBookingPayload) => api.post<Booking>('/bookings', data),
  myBookings: () => api.get<Booking[]>('/bookings/my'),
  getById: (id: string) => api.get<Booking>(`/bookings/${id}`),
  cancel: (id: string, reason?: string) =>
    api.put(`/bookings/${id}/cancel`, { reason }),
};

// ---------- Reviews ----------
export const ReviewAPI = {
  create: (data: { bookingId: string; workerId: string; rating: number; comment?: string; images?: string[] }) =>
    api.post('/reviews', data),
};

// ---------- Wallet ----------
export const WalletAPI = {
  getWallet: () => api.get('/wallet'),
  getTransactions: () => api.get('/wallet/transactions'),
};

// ---------- Coupons ----------
export const CouponAPI = {
  getActive: () => api.get('/coupons/active'),
  validate: (code: string, bookingTotal: number) =>
    api.post('/coupons/validate', { code, bookingTotal }),
};

// ---------- Banners (admin-managed, shown on Home) ----------
export interface AppBanner {
  id: string;
  title: string;
  image: string;
  link?: string | null;
  sortOrder?: number;
}
export const BannerAPI = {
  getActive: () => api.get('/banners'),
};

// ---------- Support ----------
export const SupportAPI = {
  getFaq: () => api.get('/support/faq'),
  createTicket: (data: { subject: string; description: string }) =>
    api.post('/support/tickets', data),
  myTickets: () => api.get('/support/tickets'),
  getTicket: (id: string) => api.get(`/support/tickets/${id}`),
  reply: (id: string, message: string) =>
    api.post(`/support/tickets/${id}/reply`, { message }),
};

// ---------- Notifications ----------
export const NotificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// ---------- Upload ----------
export const UploadAPI = {
  uploadImage: (formData: FormData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ---------- Chat ----------
export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderType: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface BookingChatSummary {
  bookingId: string;
  worker?: Worker;
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

export const ChatAPI = {
  getBookingChats: () => api.get<BookingChatSummary[]>('/chat/bookings'),
  getMessages: (bookingId: string, page = 1, limit = 50) =>
    api.get<ChatMessage[]>(`/chat/${bookingId}/messages`, { params: { page, limit } }),
  getUnreadCount: (bookingId: string) => api.get(`/chat/${bookingId}/unread`),
};

// ---------- Payments ----------
export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  bookingNumber?: string;
}

export const PaymentAPI = {
  // New flow: prices + opens a Razorpay order for a booking that doesn't
  // exist yet. The booking is created server-side only after verify()
  // succeeds — see bookings/new/[serviceId].tsx.
  createOrderForNewBooking: (data: CreateBookingPayload) =>
    api.post<RazorpayOrder>('/payments/create-order', data),
  // Legacy: for an already-existing booking (kept for any other callers).
  createOrder: (bookingId: string) =>
    api.post<RazorpayOrder>(`/payments/create-order/${bookingId}`),
  verify: (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    method: string;
  }) => api.post<Booking>('/payments/verify', data),
  payCash: (bookingId: string) => api.post(`/payments/cash/${bookingId}`),
  payFromWallet: (bookingId: string) => api.post(`/payments/wallet/${bookingId}`),
  getDetails: (bookingId: string) => api.get(`/payments/${bookingId}`),
};

// ---------- Tracking ----------
export interface TrackingLocation {
  workerId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}