// Bot Settings API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { SettingsDatabase, TemplateDatabase, Database } from '@/lib/database';

// GET - Fetch bot settings
export async function GET() {
  try {
    const settings = await SettingsDatabase.get();
    const templates = await TemplateDatabase.findAll();
    const dbStatus = Database.getStatus();

    return NextResponse.json({
      success: true,
      data: {
        settings,
        templates,
        dbStatus,
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update bot settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'general') {
      // Update general bot settings
      const { isActive, businessHours, autoReply, accessToken, phoneNumberId, verifyToken } = data;
      
      const updates: any = {};
      if (typeof isActive === 'boolean') updates.isActive = isActive;
      if (businessHours) updates.businessHours = businessHours;
      if (autoReply) updates.autoReply = autoReply;
      if (accessToken) updates.accessToken = accessToken;
      if (phoneNumberId) updates.phoneNumberId = phoneNumberId;
      if (verifyToken) updates.verifyToken = verifyToken;

      const updatedSettings = await SettingsDatabase.update(updates);

      return NextResponse.json({
        success: true,
        data: updatedSettings,
        message: 'Settings updated successfully',
      });

    } else if (type === 'template') {
      // Update or create message template
      const { id, name, content, category, isActive } = data;

      if (id) {
        // Update existing template
        const updatedTemplate = await TemplateDatabase.update(id, {
          name,
          content,
          category,
          isActive,
        });

        if (updatedTemplate) {
          return NextResponse.json({
            success: true,
            data: updatedTemplate,
            message: 'Template updated successfully',
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Template not found' },
            { status: 404 }
          );
        }
      } else {
        // Create new template
        const newTemplate = await TemplateDatabase.create({
          name,
          content,
          category: category || 'general',
          isActive: isActive !== false,
        });

        return NextResponse.json({
          success: true,
          data: newTemplate,
          message: 'Template created successfully',
        });
      }

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid settings type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Test webhook or API connection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'test-webhook') {
      // Simulate webhook test
      const webhookUrl = data.webhookUrl || `${request.nextUrl.origin}/api/webhook/whatsapp`;
      
      try {
        // In production, you would make an actual test request to WhatsApp API
        // For demo, we'll just validate the URL format
        new URL(webhookUrl);
        
        return NextResponse.json({
          success: true,
          message: 'Webhook URL is valid',
          data: {
            webhookUrl,
            status: 'reachable',
            responseTime: Math.random() * 100 + 50, // Simulated response time
          },
        });
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid webhook URL format' },
          { status: 400 }
        );
      }

    } else if (action === 'test-api') {
      // Test WhatsApp API connection
      const { accessToken, phoneNumberId } = data;
      
      if (!accessToken || !phoneNumberId) {
        return NextResponse.json(
          { success: false, error: 'Access token and phone number ID are required' },
          { status: 400 }
        );
      }

      // In production, you would make an actual request to WhatsApp API
      // For demo, we'll simulate success
      return NextResponse.json({
        success: true,
        message: 'API connection test successful',
        data: {
          accessToken: accessToken.substring(0, 10) + '...',
          phoneNumberId,
          status: 'connected',
          apiVersion: 'v18.0',
        },
      });

    } else if (action === 'reset-database') {
      // Reset in-memory database
      await Database.clear();
      await Database.initialize();

      return NextResponse.json({
        success: true,
        message: 'Database reset successfully',
        data: Database.getStatus(),
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing settings action:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}