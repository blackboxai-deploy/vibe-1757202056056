'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  isNew: boolean;
  status: 'active' | 'blocked' | 'archived';
  lastMessageAt: Date;
}

interface Message {
  id: string;
  customerId: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  type: string;
  status: string;
  isAutoReply: boolean;
  timestamp: Date;
  customer?: {
    id: string;
    name: string;
    phoneNumber: string;
  };
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch messages and customers
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch customers
      const customersResponse = await fetch('/api/customers');
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        if (customersData.success) {
          setCustomers(customersData.data.map((customer: any) => ({
            ...customer,
            lastMessageAt: new Date(customer.lastMessageAt),
          })));
        }
      }

      // Fetch recent messages
      const messagesResponse = await fetch('/api/messages?type=recent&limit=100');
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        if (messagesData.success) {
          setMessages(messagesData.data.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send new message
  const sendMessage = async () => {
    if (!selectedCustomer || !newMessage.trim()) return;

    try {
      setSending(true);

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedCustomer,
          content: newMessage.trim(),
          type: 'manual',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNewMessage('');
          // Refresh messages
          fetchData();
        } else {
          alert('Failed to send message: ' + data.error);
        }
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up polling for real-time updates
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessagesByCustomer = () => {
    if (!selectedCustomer) return messages;
    return messages.filter(msg => msg.customerId === selectedCustomer);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">View and manage customer conversations</p>
        </div>

        <div className="flex items-center space-x-4">
          <Badge variant="outline">
            {messages.length} Total Messages
          </Badge>
          <Button onClick={fetchData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Send Message Section */}
      <Card>
        <CardHeader>
          <CardTitle>Send Message</CardTitle>
          <CardDescription>Send a message to a customer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Customer</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phoneNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={3}
              className="resize-none"
            />
          </div>

          <Button 
            onClick={sendMessage} 
            disabled={!selectedCustomer || !newMessage.trim() || sending}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </CardContent>
      </Card>

      {/* Messages History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Message History</CardTitle>
            <CardDescription>
              {selectedCustomer 
                ? `Messages with ${customers.find(c => c.id === selectedCustomer)?.name || 'Selected Customer'}`
                : 'All recent messages across customers'
              }
            </CardDescription>
          </div>

          {selectedCustomer && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCustomer('')}
            >
              Show All Messages
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {getMessagesByCustomer().length > 0 ? (
              getMessagesByCustomer().map((message) => (
                <div key={message.id} className="border-l-4 border-gray-200 pl-4 py-3">
                  <div className={`border-l-4 pl-4 ${
                    message.direction === 'incoming' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-green-500 bg-green-50'
                  } rounded-r-lg p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">
                          {message.customer?.name || 'Unknown Customer'}
                        </span>
                        
                        <Badge 
                          variant={message.direction === 'incoming' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {message.direction === 'incoming' ? 'Received' : 'Sent'}
                        </Badge>
                        
                        {message.isAutoReply && (
                          <Badge variant="outline" className="text-xs">
                            Auto-Reply
                          </Badge>
                        )}
                        
                        <Badge variant="outline" className={`text-xs ${
                          message.status === 'delivered' ? 'text-green-600' :
                          message.status === 'read' ? 'text-blue-600' :
                          message.status === 'failed' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {message.status}
                        </Badge>
                      </div>
                      
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>

                    <div className="text-gray-800">
                      {message.content}
                    </div>

                    {message.customer?.phoneNumber && (
                      <div className="text-xs text-gray-500 mt-2">
                        {message.customer.phoneNumber} • {message.type}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-500">
                  {selectedCustomer 
                    ? 'No messages with this customer yet'
                    : 'Messages will appear here when customers contact you'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{messages.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {messages.filter(m => m.direction === 'incoming').length} received, {messages.filter(m => m.direction === 'outgoing').length} sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Auto-Replies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {messages.filter(m => m.isAutoReply).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Automated responses sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {customers.filter(c => c.isNew).length} new customers
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}