'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  isNew: boolean;
  status: 'active' | 'blocked' | 'archived';
  lastMessageAt: Date;
  firstMessageAt: Date;
  messageCount: number;
  metadata: {
    profileName?: string;
    language?: string;
    timezone?: string;
    tags?: string[];
  };
  stats: {
    totalMessages: number;
    recentMessages: number;
    lastMessage: any;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const customersWithDates = data.data.map((customer: any) => ({
            ...customer,
            lastMessageAt: new Date(customer.lastMessageAt),
            firstMessageAt: new Date(customer.firstMessageAt),
          }));
          setCustomers(customersWithDates);
          setFilteredCustomers(customersWithDates);
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter customers based on search and status
  const filterCustomers = () => {
    let filtered = customers;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phoneNumber.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'new') {
        filtered = filtered.filter(customer => customer.isNew);
      } else {
        filtered = filtered.filter(customer => customer.status === statusFilter);
      }
    }

    setFilteredCustomers(filtered);
  };

  // Update customer status
  const updateCustomerStatus = async (customerId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: customerId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update the customer in the state
          setCustomers(prev => 
            prev.map(customer => 
              customer.id === customerId 
                ? { ...customer, status: newStatus as any }
                : customer
            )
          );
          fetchCustomers(); // Refresh to get updated data
        }
      }
    } catch (error) {
      console.error('Error updating customer status:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, statusFilter, customers]);

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage your customer database and interactions</p>
        </div>

        <div className="flex items-center space-x-4">
          <Badge variant="outline">
            {filteredCustomers.length} of {customers.length} customers
          </Badge>
          <Button onClick={fetchCustomers} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="new">New Customers</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer Statistics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {customers.filter(c => c.isNew).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {customers.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {customers.filter(c => c.status === 'blocked').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>All customers and their interaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div 
                  key={customer.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">{customer.name}</h3>
                        {customer.isNew && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )}
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(customer.status)}`}>
                          {customer.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600">{customer.phoneNumber}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>Messages: {customer.stats.totalMessages}</span>
                        <span>•</span>
                        <span>Last seen: {formatDate(customer.lastMessageAt)}</span>
                        {customer.stats.recentMessages > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">
                              {customer.stats.recentMessages} recent
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      View Details
                    </Button>
                    
                    <Select
                      value={customer.status}
                      onValueChange={(value) => updateCustomerStatus(customer.id, value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'Customers will appear here when they contact you'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Customer Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCustomer(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">{selectedCustomer.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone Number</label>
                  <p className="text-gray-900">{selectedCustomer.phoneNumber}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className={getStatusColor(selectedCustomer.status)}>
                    {selectedCustomer.status}
                  </Badge>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Customer Type</label>
                  <Badge variant={selectedCustomer.isNew ? "default" : "secondary"}>
                    {selectedCustomer.isNew ? 'New Customer' : 'Returning Customer'}
                  </Badge>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">First Contact</label>
                  <p className="text-gray-900">{formatDate(selectedCustomer.firstMessageAt)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Contact</label>
                  <p className="text-gray-900">{formatDate(selectedCustomer.lastMessageAt)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-600">Message Statistics</label>
                <div className="grid gap-4 md:grid-cols-3 mt-2">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-gray-900">
                      {selectedCustomer.stats.totalMessages}
                    </div>
                    <div className="text-xs text-gray-600">Total Messages</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-blue-600">
                      {selectedCustomer.stats.recentMessages}
                    </div>
                    <div className="text-xs text-gray-600">Recent (24h)</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-lg font-bold text-green-600">
                      {selectedCustomer.messageCount}
                    </div>
                    <div className="text-xs text-gray-600">Message Count</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex space-x-2">
                  <Button size="sm">Send Message</Button>
                  <Button variant="outline" size="sm">View Conversation</Button>
                  <Button variant="outline" size="sm">Edit Customer</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}