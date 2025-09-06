// WhatsApp Business API Webhook Handler
import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppWebhookPayload } from '@/types/whatsapp';
import { MessageProcessor } from '@/lib/message-processor';
import { WhatsAppAPI } from '@/lib/whatsapp';

// Initialize message processor
const messageProcessor = new MessageProcessor();

// GET handler for webhook verification
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('Webhook verification request:', { mode, token, challenge });

    // Verify the webhook
    if (mode === 'subscribe' && token === 'default_verify_token') {
      console.log('Webhook verified successfully');
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.log('Webhook verification failed');
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }
  } catch (error) {
    console.error('Webhook verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for incoming messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Verify webhook signature (in production, use proper HMAC validation)
    if (signature && !WhatsAppAPI.verifySignature(body, signature, 'webhook_secret')) {
      console.log('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook payload
    const payload: WhatsAppWebhookPayload = JSON.parse(body);
    
    console.log('Received webhook:', JSON.stringify(payload, null, 2));

    // Process each entry in the webhook payload
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          const { messages, contacts, statuses } = change.value;

          // Process incoming messages
          if (messages) {
            for (const message of messages) {
              console.log(`Processing message from ${message.from}: ${message.text?.body || '[Media]'}`);
              
              const result = await messageProcessor.processIncomingMessage(message, contacts);
              
              if (result.success) {
                console.log('Message processed successfully:', {
                  autoReplySent: result.autoReplySent,
                });
              } else {
                console.error('Message processing failed:', result.error);
              }
            }
          }

          // Process status updates (delivery receipts)
          if (statuses) {
            for (const status of statuses) {
              console.log(`Processing status update: ${status.id} -> ${status.status}`);
              await messageProcessor.processStatusUpdate(status.id, status.status);
            }
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Return 200 to prevent WhatsApp from retrying
    return NextResponse.json({ 
      error: 'Processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-hub-signature-256',
    },
  });
}