// Customers API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { CustomerDatabase, MessageDatabase } from '@/lib/database';

// GET - Fetch customers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') as 'active' | 'blocked' | 'archived' | null;

    const customers = await CustomerDatabase.findAll({
      limit,
      offset,
      status: status || undefined,
    });

    // Get message stats for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const messages = await MessageDatabase.findByCustomerId(customer.id, { limit: 1000 });
        const recentMessages = messages.filter(m => {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return m.timestamp >= dayAgo;
        });

        return {
          ...customer,
          stats: {
            totalMessages: messages.length,
            recentMessages: recentMessages.length,
            lastMessage: messages[0] || null,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: customersWithStats,
      total: customersWithStats.length,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch customers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update customer
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, status, tags } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (status) updates.status = status;
    if (tags) updates.metadata = { ...updates.metadata, tags };

    const updatedCustomer = await CustomerDatabase.update(id, updates);

    if (updatedCustomer) {
      return NextResponse.json({
        success: true,
        data: updatedCustomer,
        message: 'Customer updated successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update customer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Customer statistics
export async function OPTIONS() {
  try {
    const customers = await CustomerDatabase.findAll();
    const messages = await MessageDatabase.findRecent(1000);

    const stats = {
      totalCustomers: customers.length,
      newCustomers: customers.filter(c => c.isNew).length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      blockedCustomers: customers.filter(c => c.status === 'blocked').length,
      totalMessages: messages.length,
      todayMessages: messages.filter(m => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return m.timestamp >= today;
      }).length,
      responseRate: messages.length > 0 
        ? (messages.filter(m => m.direction === 'outgoing').length / messages.filter(m => m.direction === 'incoming').length * 100)
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching customer statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}