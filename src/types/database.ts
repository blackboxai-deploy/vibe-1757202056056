// Database Entity Types
export interface Customer {
  id: string;
  phoneNumber: string;
  name: string;
  isNew: boolean;
  status: 'active' | 'blocked' | 'archived';
  lastMessageAt: Date;
  firstMessageAt: Date;
  messageCount: number;
  metadata: {
    profileName?: string;
    language?: string;
    timezone?: string;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  customerId: string;
  messageId: string; // WhatsApp message ID
  direction: 'incoming' | 'outgoing';
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contacts';
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  isAutoReply: boolean;
  timestamp: Date;
  metadata: {
    whatsappTimestamp?: string;
    context?: {
      messageId?: string;
      from?: string;
    };
    failureReason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  customerId: string;
  status: 'active' | 'resolved' | 'pending';
  lastMessageId: string;
  lastMessageAt: Date;
  messageCount: number;
  tags: string[];
  assignedTo?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  metadata: {
    source: 'whatsapp';
    category?: string;
    satisfaction?: number;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Analytics and Reporting Types
export interface MessageStats {
  totalMessages: number;
  incomingMessages: number;
  outgoingMessages: number;
  autoReplies: number;
  uniqueCustomers: number;
  newCustomers: number;
  responseRate: number;
  avgResponseTime: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  blockedCustomers: number;
  averageMessagesPerCustomer: number;
  topCountries: Array<{
    country: string;
    count: number;
  }>;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

// Database Query Types
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface MessageQuery extends QueryOptions {
  customerId?: string;
  direction?: 'incoming' | 'outgoing';
  type?: string;
  status?: string;
  isAutoReply?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface CustomerQuery extends QueryOptions {
  status?: 'active' | 'blocked' | 'archived';
  isNew?: boolean;
  hasRecentActivity?: boolean;
  tags?: string[];
}