// Message Processing Logic
import { WhatsAppMessage, WhatsAppContact } from '@/types/whatsapp';
import { Customer, Message } from '@/types/database';
import { CustomerDatabase, MessageDatabase, SettingsDatabase } from '@/lib/database';
import { WhatsAppAPI, BusinessHours } from '@/lib/whatsapp';

export class MessageProcessor {
  private whatsappApi: WhatsAppAPI;

  constructor() {
    this.whatsappApi = new WhatsAppAPI();
  }

  // Process incoming message from WhatsApp webhook
  async processIncomingMessage(
    message: WhatsAppMessage,
    contacts?: WhatsAppContact[]
  ): Promise<{
    success: boolean;
    autoReplySent?: boolean;
    error?: string;
  }> {
    try {
      // Parse message details
      const { from, content, messageId, timestamp, type } = WhatsAppAPI.parseIncomingMessage(message);
      
      // Find or create customer
      const customer = await this.findOrCreateCustomer(from, contacts);
      
      // Save incoming message to database
      await MessageDatabase.create({
        customerId: customer.id,
        messageId: messageId,
        direction: 'incoming',
        type: type,
        content: content,
        status: 'delivered',
        isAutoReply: false,
        timestamp: timestamp,
        metadata: {
          whatsappTimestamp: message.timestamp,
          context: message.context,
        },
      });

      // Update customer's last message time and message count
      await CustomerDatabase.update(customer.id, {
        lastMessageAt: timestamp,
        messageCount: customer.messageCount + 1,
      });

      // Mark message as read
      await this.whatsappApi.markAsRead(messageId);

      // Process auto-reply if enabled
      const autoReplySent = await this.processAutoReply(customer, content);

      // If auto-reply was sent, mark customer as no longer new
      if (autoReplySent && customer.isNew) {
        await CustomerDatabase.markAsReturning(from);
      }

      return {
        success: true,
        autoReplySent,
      };
    } catch (error) {
      console.error('Error processing incoming message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Find existing customer or create new one
  private async findOrCreateCustomer(
    phoneNumber: string,
    contacts?: WhatsAppContact[]
  ): Promise<Customer> {
    let customer = await CustomerDatabase.findByPhoneNumber(phoneNumber);

    if (!customer) {
      // Extract customer name from contacts if available
      const contact = contacts?.find(c => c.wa_id === phoneNumber);
      const customerName = contact?.profile?.name || `Customer ${phoneNumber.slice(-4)}`;

      customer = await CustomerDatabase.create({
        phoneNumber: phoneNumber,
        name: customerName,
        isNew: true,
        status: 'active',
        lastMessageAt: new Date(),
        firstMessageAt: new Date(),
        messageCount: 0,
        metadata: {
          profileName: contact?.profile?.name,
        },
      });

      console.log(`Created new customer: ${customerName} (${phoneNumber})`);
    }

    return customer;
  }

  // Process auto-reply logic
  private async processAutoReply(customer: Customer, messageContent: string): Promise<boolean> {
    try {
      const settings = await SettingsDatabase.get();
      if (!settings || !settings.isActive) {
        return false;
      }

      // Check if we should send auto-reply
      if (!this.shouldSendAutoReply(messageContent)) {
        return false;
      }

      // Determine which message to send
      let replyMessage: string;
      
      if (settings.businessHours.enabled) {
        const isBusinessHour = BusinessHours.isBusinessHour(
          settings.businessHours.timezone,
          settings.businessHours.schedule
        );

        if (!isBusinessHour) {
          replyMessage = settings.autoReply.afterHoursMessage;
        } else if (customer.isNew) {
          replyMessage = settings.autoReply.newCustomerMessage;
        } else {
          replyMessage = settings.autoReply.returningCustomerMessage;
        }
      } else {
        replyMessage = customer.isNew 
          ? settings.autoReply.newCustomerMessage 
          : settings.autoReply.returningCustomerMessage;
      }

      // Initialize WhatsApp API with current settings
      this.whatsappApi = new WhatsAppAPI(settings.accessToken, settings.phoneNumberId);

      // Send auto-reply
      const response = await this.whatsappApi.sendMessage(customer.phoneNumber, replyMessage);
      
      if (response) {
        // Save outgoing auto-reply message
        await MessageDatabase.create({
          customerId: customer.id,
          messageId: response.messages[0].id,
          direction: 'outgoing',
          type: 'text',
          content: replyMessage,
          status: 'sent',
          isAutoReply: true,
          timestamp: new Date(),
          metadata: {},
        });

        console.log(`Auto-reply sent to ${customer.name}: ${replyMessage.substring(0, 50)}...`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending auto-reply:', error);
      return false;
    }
  }

  // Determine if auto-reply should be sent
  private shouldSendAutoReply(messageContent: string): boolean {
    // Skip auto-reply for certain message types or patterns
    const skipPatterns = [
      /^(ok|okay|thanks|thank you|got it)$/i,
      /^(👍|👌|✅|🙏)$/,
      /^(delivered|read)$/i,
    ];

    return !skipPatterns.some(pattern => pattern.test(messageContent.trim()));
  }

  // Send manual message (not auto-reply)
  async sendManualMessage(
    customerId: string, 
    content: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const customer = await CustomerDatabase.findByPhoneNumber(''); // This should find by ID, but for demo
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }

      const settings = await SettingsDatabase.get();
      if (!settings) {
        return { success: false, error: 'WhatsApp settings not configured' };
      }

      // Initialize API with current settings
      this.whatsappApi = new WhatsAppAPI(settings.accessToken, settings.phoneNumberId);

      // Send message
      const response = await this.whatsappApi.sendMessage(customer.phoneNumber, content);
      
      if (response) {
        // Save outgoing message
        const message = await MessageDatabase.create({
          customerId: customerId,
          messageId: response.messages[0].id,
          direction: 'outgoing',
          type: 'text',
          content: content,
          status: 'sent',
          isAutoReply: false,
          timestamp: new Date(),
          metadata: {},
        });

        return {
          success: true,
          messageId: message.id,
        };
      }

      return { success: false, error: 'Failed to send message via WhatsApp API' };
    } catch (error) {
      console.error('Error sending manual message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Process message status updates (delivery receipts)
  async processStatusUpdate(messageId: string, status: string): Promise<void> {
    try {
      const validStatuses = ['sent', 'delivered', 'read', 'failed'] as const;
      const messageStatus = validStatuses.includes(status as any) ? status as typeof validStatuses[number] : 'sent';
      
      await MessageDatabase.updateStatus(messageId, messageStatus);
      console.log(`Updated message ${messageId} status to: ${status}`);
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  }

  // Get conversation history
  async getConversationHistory(customerId: string, limit: number = 50): Promise<Message[]> {
    return await MessageDatabase.findByCustomerId(customerId, { limit });
  }

  // Get recent messages across all customers
  async getRecentMessages(limit: number = 100): Promise<Message[]> {
    return await MessageDatabase.findRecent(limit);
  }
}

// Rate limiting utility
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();

  static isAllowed(phoneNumber: string, windowMs: number = 60000, maxRequests: number = 5): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this phone number
    const existingRequests = this.requests.get(phoneNumber) || [];
    
    // Filter out old requests
    const recentRequests = existingRequests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(phoneNumber, recentRequests);
    
    return true;
  }

  static getRemainingRequests(phoneNumber: string, windowMs: number = 60000, maxRequests: number = 5): number {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const existingRequests = this.requests.get(phoneNumber) || [];
    const recentRequests = existingRequests.filter(time => time > windowStart);
    
    return Math.max(0, maxRequests - recentRequests.length);
  }
}

// Message validation utilities
export class MessageValidator {
  static isValidWhatsAppMessage(message: any): message is WhatsAppMessage {
    return (
      message &&
      typeof message === 'object' &&
      typeof message.from === 'string' &&
      typeof message.id === 'string' &&
      typeof message.timestamp === 'string' &&
      typeof message.type === 'string'
    );
  }

  static sanitizeMessageContent(content: string): string {
    // Remove potentially harmful content
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .substring(0, 1000) // Limit length
      .trim();
  }

  static detectSpam(content: string, phoneNumber: string): boolean {
    const spamPatterns = [
      /(.)\1{10,}/, // Repeated characters
      /https?:\/\/[^\s]{50,}/, // Very long URLs
      /\b(free|prize|winner|urgent|act now)\b/gi, // Common spam words
    ];

    const hasSpamPattern = spamPatterns.some(pattern => pattern.test(content));
    const isRepeatedMessage = this.isRepeatedMessage(content, phoneNumber);
    
    return hasSpamPattern || isRepeatedMessage;
  }

  private static recentMessages: Map<string, string[]> = new Map();

  private static isRepeatedMessage(content: string, phoneNumber: string): boolean {
    const key = phoneNumber;
    const recent = this.recentMessages.get(key) || [];
    
    // Check if same message was sent recently
    const isDuplicate = recent.includes(content);
    
    // Add to recent messages (keep last 10)
    recent.push(content);
    if (recent.length > 10) {
      recent.shift();
    }
    this.recentMessages.set(key, recent);
    
    return isDuplicate;
  }
}