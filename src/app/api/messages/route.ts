// Messages API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { MessageDatabase, CustomerDatabase } from '@/lib/database';
import { MessageProcessor } from '@/lib/message-processor';

const messageProcessor = new MessageProcessor();

// GET - Fetch messages
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type'); // 'recent' or 'customer'

    if (type === 'recent' || !customerId) {
      // Get recent messages across all customers
      const messages = await MessageDatabase.findRecent(limit);
      
      // Enrich with customer data
      const enrichedMessages = await Promise.all(
        messages.map(async (message) => {
          const customers = await CustomerDatabase.findAll();
          const customer = customers.find(c => c.id === message.customerId);
          return {
            ...message,
            customer: customer ? {
              id: customer.id,
              name: customer.name,
              phoneNumber: customer.phoneNumber,
            } : null,
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: enrichedMessages,
        total: enrichedMessages.length,
      });
    } else {
      // Get messages for specific customer
      const messages = await MessageDatabase.findByCustomerId(customerId, { limit });
      const customers = await CustomerDatabase.findAll();
      const customer = customers.find(c => c.id === customerId);

      return NextResponse.json({
        success: true,
        data: messages,
        customer: customer || null,
        total: messages.length,
      });
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch messages',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Send message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, content, type = 'manual' } = body;

    if (!customerId || !content) {
      return NextResponse.json(
        { success: false, error: 'customerId and content are required' },
        { status: 400 }
      );
    }

    if (type === 'manual') {
      // Send manual message
      const result = await messageProcessor.sendManualMessage(customerId, content);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          messageId: result.messageId,
          message: 'Message sent successfully',
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid message type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send message',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete message (for demo purposes)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'messageId is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would delete from your database
    // For this demo with in-memory storage, we'll simulate success
    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete message',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}