// In-memory database implementation for demo purposes
// In production, replace with your preferred database (PostgreSQL, MongoDB, etc.)

import { Customer, Message, Conversation, MessageTemplate } from '@/types/database';
import { BotSettings as WhatsAppBotSettings } from '@/types/whatsapp';

// In-memory storage
let customers: Customer[] = [];
let messages: Message[] = [];
let conversations: Conversation[] = [];
let botSettings: WhatsAppBotSettings | null = null;
let messageTemplates: MessageTemplate[] = [];

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Customer Database Operations
export class CustomerDatabase {
  static async findByPhoneNumber(phoneNumber: string): Promise<Customer | null> {
    return customers.find(c => c.phoneNumber === phoneNumber) || null;
  }

  static async create(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const customer: Customer = {
      ...customerData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    customers.push(customer);
    return customer;
  }

  static async update(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return null;

    customers[index] = {
      ...customers[index],
      ...updates,
      updatedAt: new Date(),
    };
    return customers[index];
  }

  static async findAll(options?: {
    limit?: number;
    offset?: number;
    status?: Customer['status'];
  }): Promise<Customer[]> {
    let result = [...customers];
    
    if (options?.status) {
      result = result.filter(c => c.status === options.status);
    }

    if (options?.offset) {
      result = result.slice(options.offset);
    }

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  static async markAsReturning(phoneNumber: string): Promise<void> {
    const customer = await this.findByPhoneNumber(phoneNumber);
    if (customer) {
      await this.update(customer.id, { isNew: false });
    }
  }
}

// Message Database Operations
export class MessageDatabase {
  static async create(messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    const message: Message = {
      ...messageData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    messages.push(message);
    return message;
  }

  static async findByCustomerId(
    customerId: string, 
    options?: { limit?: number; offset?: number }
  ): Promise<Message[]> {
    let result = messages.filter(m => m.customerId === customerId);
    
    result = result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.offset) {
      result = result.slice(options.offset);
    }

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  static async findRecent(limit: number = 50): Promise<Message[]> {
    return messages
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  static async updateStatus(messageId: string, status: Message['status']): Promise<Message | null> {
    const index = messages.findIndex(m => m.messageId === messageId);
    if (index === -1) return null;

    messages[index] = {
      ...messages[index],
      status,
      updatedAt: new Date(),
    };
    return messages[index];
  }

  static async getStats(dateRange?: { start: Date; end: Date }) {
    let filteredMessages = messages;

    if (dateRange) {
      filteredMessages = messages.filter(m => 
        m.timestamp >= dateRange.start && m.timestamp <= dateRange.end
      );
    }

    const totalMessages = filteredMessages.length;
    const incomingMessages = filteredMessages.filter(m => m.direction === 'incoming').length;
    const outgoingMessages = filteredMessages.filter(m => m.direction === 'outgoing').length;
    const autoReplies = filteredMessages.filter(m => m.isAutoReply).length;

    return {
      totalMessages,
      incomingMessages,
      outgoingMessages,
      autoReplies,
      responseRate: incomingMessages > 0 ? (outgoingMessages / incomingMessages) * 100 : 0,
    };
  }
}

// Bot Settings Operations
export class SettingsDatabase {
  static async get(): Promise<WhatsAppBotSettings | null> {
    if (!botSettings) {
      // Initialize with default settings
      botSettings = {
        id: 'default',
        isActive: true,
        businessHours: {
          enabled: false,
          timezone: 'America/New_York',
          schedule: {
            monday: { start: '09:00', end: '17:00', enabled: true },
            tuesday: { start: '09:00', end: '17:00', enabled: true },
            wednesday: { start: '09:00', end: '17:00', enabled: true },
            thursday: { start: '09:00', end: '17:00', enabled: true },
            friday: { start: '09:00', end: '17:00', enabled: true },
            saturday: { start: '10:00', end: '14:00', enabled: false },
            sunday: { start: '10:00', end: '14:00', enabled: false },
          },
        },
        autoReply: {
          newCustomerMessage: '👋 Hello! Thank you for contacting us. We\'re here to help you. Someone from our team will get back to you shortly.',
          returningCustomerMessage: 'Hello again! Thanks for reaching out. How can we assist you today?',
          afterHoursMessage: '🌙 Thanks for your message! We\'re currently outside business hours. We\'ll respond as soon as possible during our next business day.',
          fallbackMessage: 'Thank you for your message. We\'ve received it and will respond soon.',
        },
        webhookUrl: (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000') + '/api/webhook/whatsapp',
        verifyToken: 'default_verify_token',
        accessToken: '',
        phoneNumberId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return botSettings;
  }

  static async update(updates: Partial<WhatsAppBotSettings>): Promise<WhatsAppBotSettings> {
    const current = await this.get();
    botSettings = {
      ...current!,
      ...updates,
      updatedAt: new Date(),
    };
    return botSettings;
  }
}

// Message Templates Operations
export class TemplateDatabase {
  static async findAll(): Promise<MessageTemplate[]> {
    if (messageTemplates.length === 0) {
      // Initialize with default templates
      messageTemplates = [
        {
          id: generateId(),
          name: 'Welcome Message',
          content: '👋 Welcome! Thanks for contacting us. How can we help you today?',
          category: 'welcome',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          name: 'Support Response',
          content: '🔧 We\'ve received your support request. Our technical team will assist you shortly.',
          category: 'support',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: generateId(),
          name: 'Sales Inquiry',
          content: '💼 Thank you for your interest! A sales representative will contact you within 24 hours.',
          category: 'sales',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }
    return messageTemplates.filter(t => t.isActive);
  }

  static async create(templateData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<MessageTemplate> {
    const template: MessageTemplate = {
      ...templateData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    messageTemplates.push(template);
    return template;
  }

  static async update(id: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate | null> {
    const index = messageTemplates.findIndex(t => t.id === id);
    if (index === -1) return null;

    messageTemplates[index] = {
      ...messageTemplates[index],
      ...updates,
      updatedAt: new Date(),
    };
    return messageTemplates[index];
  }
}

// Database initialization and cleanup
export class Database {
  static async initialize(): Promise<void> {
    console.log('Initializing in-memory database...');
    await SettingsDatabase.get(); // Initialize default settings
    await TemplateDatabase.findAll(); // Initialize default templates
    console.log('Database initialized successfully');
  }

  static async clear(): Promise<void> {
    customers = [];
    messages = [];
    conversations = [];
    botSettings = null;
    messageTemplates = [];
  }

  static getStatus() {
    return {
      customers: customers.length,
      messages: messages.length,
      conversations: conversations.length,
      templates: messageTemplates.length,
      initialized: botSettings !== null,
    };
  }
}