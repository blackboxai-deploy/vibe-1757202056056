// WhatsApp Business API Types
export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: WhatsAppValue;
  field: 'messages' | 'message_template_status_update';
}

export interface WhatsAppValue {
  messaging_product: 'whatsapp';
  metadata: WhatsAppMetadata;
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
}

export interface WhatsAppMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

export interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contacts';
  context?: {
    from: string;
    id: string;
  };
  image?: WhatsAppMedia;
  video?: WhatsAppMedia;
  audio?: WhatsAppMedia;
  document?: WhatsAppMedia;
}

export interface WhatsAppMedia {
  id: string;
  mime_type: string;
  sha256: string;
  caption?: string;
}

export interface WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    expiration_timestamp?: string;
    origin: {
      type: string;
    };
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
}

// API Request/Response Types
export interface SendMessageRequest {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text' | 'template';
  text?: {
    preview_url?: boolean;
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

export interface SendMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

// Bot Configuration Types
export interface BotSettings {
  id: string;
  isActive: boolean;
  businessHours: {
    enabled: boolean;
    timezone: string;
    schedule: {
      [key: string]: {
        start: string;
        end: string;
        enabled: boolean;
      };
    };
  };
  autoReply: {
    newCustomerMessage: string;
    returningCustomerMessage: string;
    afterHoursMessage: string;
    fallbackMessage: string;
  };
  webhookUrl: string;
  verifyToken: string;
  accessToken: string;
  phoneNumberId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Message Templates
export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'welcome' | 'support' | 'sales' | 'general';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Webhook Verification
export interface WebhookVerification {
  'hub.mode': string;
  'hub.challenge': string;
  'hub.verify_token': string;
}