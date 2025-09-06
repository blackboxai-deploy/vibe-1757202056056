'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  totalCustomers: number;
  newCustomers: number;
  totalMessages: number;
  todayMessages: number;
  responseRate: number;
  activeCustomers: number;
}

interface RecentMessage {
  id: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  timestamp: Date;
  isAutoReply: boolean;
  customer?: {
    name: string;
    phoneNumber: string;
  };
}

interface BotSettings {
  isActive: boolean;
  autoReply: {
    newCustomerMessage: string;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    newCustomers: 0,
    totalMessages: 0,
    todayMessages: 0,
    responseRate: 0,
    activeCustomers: 0,
  });

  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [botSettings, setBotSettings] = useState<BotSettings>({
    isActive: true,
    autoReply: {
      newCustomerMessage: '',
    },
  });

  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch customer statistics
      const statsResponse = await fetch('/api/customers', {
        method: 'OPTIONS',
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }

      // Fetch recent messages
      const messagesResponse = await fetch('/api/messages?type=recent&limit=10');
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        if (messagesData.success) {
          setRecentMessages(messagesData.data.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })));
        }
      }

      // Fetch bot settings
      const settingsResponse = await fetch('/api/settings');
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.success && settingsData.data.settings) {
          setBotSettings(settingsData.data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle bot active status
  const toggleBotStatus = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'general',
          isActive: !botSettings.isActive,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBotSettings(prev => ({
            ...prev,
            isActive: !prev.isActive,
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling bot status:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up polling for real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your WhatsApp bot performance and activity</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge 
            variant={botSettings.isActive ? "default" : "secondary"}
            className={botSettings.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
          >
            {botSettings.isActive ? 'Bot Active' : 'Bot Inactive'}
          </Badge>
          
          <Button
            onClick={toggleBotStatus}
            variant={botSettings.isActive ? "outline" : "default"}
            size="sm"
          >
            {botSettings.isActive ? 'Deactivate Bot' : 'Activate Bot'}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.newCustomers} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Messages Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.todayMessages}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalMessages} total messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.responseRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              Automated responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.activeCustomers}</div>
            <p className="text-xs text-gray-500 mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Latest customer interactions and bot responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMessages.length > 0 ? (
                  recentMessages.map((message) => (
                    <div key={message.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        message.direction === 'incoming' ? 'bg-blue-500' : 'bg-green-500'
                      }`}></div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {message.customer?.name || 'Unknown Customer'}
                          </p>
                          <div className="flex items-center space-x-2">
                            {message.isAutoReply && (
                              <Badge variant="secondary" className="text-xs">Auto</Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate">
                          {message.content}
                        </p>
                        
                        {message.customer?.phoneNumber && (
                          <p className="text-xs text-gray-400 mt-1">
                            {message.customer.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">💬</div>
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Messages will appear here when customers contact you
                    </p>
                  </div>
                )}
              </div>
              
              {recentMessages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Messages
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Bot Status</CardTitle>
              <CardDescription>Current configuration and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-Reply</span>
                <Badge variant={botSettings.isActive ? "default" : "secondary"}>
                  {botSettings.isActive ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <span className="text-sm font-medium">Welcome Message</span>
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                  {botSettings.autoReply.newCustomerMessage || 'Not configured'}
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <Button variant="outline" size="sm" className="w-full">
                  Configure Bot
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                📊 View Analytics
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                👥 Manage Customers
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                ⚙️ Bot Settings
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                📱 Test Webhook
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}