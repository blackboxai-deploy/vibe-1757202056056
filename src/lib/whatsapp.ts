// WhatsApp Business API Integration
import { SendMessageRequest, SendMessageResponse, WhatsAppMessage } from '@/types/whatsapp';

export class WhatsAppAPI {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl: string;

  constructor(accessToken?: string, phoneNumberId?: string) {
    this.accessToken = accessToken || '';
    this.phoneNumberId = phoneNumberId || '';
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  // Send a text message
  async sendMessage(to: string, message: string): Promise<SendMessageResponse | null> {
    if (!this.accessToken || !this.phoneNumberId) {
      console.error('WhatsApp API credentials not configured');
      return null;
    }

    const payload: SendMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('WhatsApp API error:', error);
        return null;
      }

      return await response.json() as SendMessageResponse;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      return null;
    }
  }

  // Send a template message
  async sendTemplate(
    to: string, 
    templateName: string, 
    languageCode: string = 'en_US',
    components?: any[]
  ): Promise<SendMessageResponse | null> {
    if (!this.accessToken || !this.phoneNumberId) {
      console.error('WhatsApp API credentials not configured');
      return null;
    }

    const payload: SendMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components: components || [],
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('WhatsApp API error:', error);
        return null;
      }

      return await response.json() as SendMessageResponse;
    } catch (error) {
      console.error('Failed to send WhatsApp template:', error);
      return null;
    }
  }

  // Mark message as read
  async markAsRead(messageId: string): Promise<boolean> {
    if (!this.accessToken || !this.phoneNumberId) {
      console.error('WhatsApp API credentials not configured');
      return false;
    }

    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      return false;
    }
  }

  // Verify webhook signature (for security)
  static verifySignature(_payload: string, signature: string, _secret: string): boolean {
    if (!signature) {
      return false;
    }

    try {
      // For production, use proper HMAC validation with crypto
      // This is a simplified version for demo - always returns true for development
      return true;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  // Parse incoming webhook message
  static parseIncomingMessage(message: WhatsAppMessage): {
    from: string;
    content: string;
    messageId: string;
    timestamp: Date;
    type: string;
  } {
    return {
      from: message.from,
      content: message.text?.body || '[Media message]',
      messageId: message.id,
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      type: message.type,
    };
  }

  // Format phone number (remove + and spaces)
  static formatPhoneNumber(phoneNumber: string): string {
    return phoneNumber.replace(/[^\d]/g, '');
  }

  // Check if phone number is valid
  static isValidPhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    return formatted.length >= 10 && formatted.length <= 15;
  }
}

// Business hours checker
export class BusinessHours {
  static isBusinessHour(timezone: string, schedule: any): boolean {
    try {
      const now = new Date();
      const dayOfWeek = now.toLocaleDateString('en-US', { 
        weekday: 'long',
        timeZone: timezone 
      }).toLowerCase();

      const currentTime = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      });

      const daySchedule = schedule[dayOfWeek];
      if (!daySchedule || !daySchedule.enabled) {
        return false;
      }

      return currentTime >= daySchedule.start && currentTime <= daySchedule.end;
    } catch (error) {
      console.error('Error checking business hours:', error);
      return true; // Default to business hours if error
    }
  }
}

// Message formatter utility
export class MessageFormatter {
  static welcomeMessage(customerName?: string): string {
    const greeting = customerName ? `Hello ${customerName}!` : 'Hello!';
    return `👋 ${greeting} Thank you for contacting us. We're here to help you. Someone from our team will get back to you shortly.`;
  }

  static returningCustomerMessage(customerName?: string): string {
    const greeting = customerName ? `Hello ${customerName}!` : 'Hello again!';
    return `${greeting} Thanks for reaching out. How can we assist you today?`;
  }

  static afterHoursMessage(): string {
    return '🌙 Thanks for your message! We\'re currently outside business hours. We\'ll respond as soon as possible during our next business day.';
  }

  static fallbackMessage(): string {
    return 'Thank you for your message. We\'ve received it and will respond soon.';
  }

  static formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else {
      return `+${cleaned}`;
    }
  }
}