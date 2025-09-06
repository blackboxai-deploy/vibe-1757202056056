'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BotSettings {
  id: string;
  isActive: boolean;
  businessHours: {
    enabled: boolean;
    timezone: string;
    schedule: {
      [key: string]: {
        start: string;
        end: string;
        enabled: boolean;
      };
    };
  };
  autoReply: {
    newCustomerMessage: string;
    returningCustomerMessage: string;
    afterHoursMessage: string;
    fallbackMessage: string;
  };
  webhookUrl: string;
  verifyToken: string;
  accessToken: string;
  phoneNumberId: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'welcome' | 'support' | 'sales' | 'general';
  isActive: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testingAPI, setTestingAPI] = useState(false);

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.data.settings);
          setTemplates(data.data.templates || []);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save general settings
  const saveGeneralSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'general',
          ...settings,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Settings saved successfully!');
        } else {
          alert('Error saving settings: ' + data.error);
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // Test webhook
  const testWebhook = async () => {
    if (!settings) return;

    try {
      setTestingWebhook(true);

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test-webhook',
          webhookUrl: settings.webhookUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Webhook test successful! ' + data.message);
        } else {
          alert('Webhook test failed: ' + data.error);
        }
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      alert('Error testing webhook');
    } finally {
      setTestingWebhook(false);
    }
  };

  // Test WhatsApp API
  const testAPI = async () => {
    if (!settings) return;

    try {
      setTestingAPI(true);

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test-api',
          accessToken: settings.accessToken,
          phoneNumberId: settings.phoneNumberId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('API connection test successful! ' + data.message);
        } else {
          alert('API test failed: ' + data.error);
        }
      }
    } catch (error) {
      console.error('Error testing API:', error);
      alert('Error testing API');
    } finally {
      setTestingAPI(false);
    }
  };

  // Reset database
  const resetDatabase = async () => {
    if (!confirm('Are you sure you want to reset the database? This will delete all messages and customers.')) {
      return;
    }

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset-database',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Database reset successfully!');
          window.location.reload();
        } else {
          alert('Error resetting database: ' + data.error);
        }
      }
    } catch (error) {
      console.error('Error resetting database:', error);
      alert('Error resetting database');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = (updates: Partial<BotSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...updates });
  };

  const updateBusinessHours = (day: string, field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      businessHours: {
        ...settings.businessHours,
        schedule: {
          ...settings.businessHours.schedule,
          [day]: {
            ...settings.businessHours.schedule[day],
            [field]: value,
          },
        },
      },
    });
  };

  const updateAutoReply = (field: string, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      autoReply: {
        ...settings.autoReply,
        [field]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Failed to load settings</p>
            <Button onClick={fetchSettings} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your WhatsApp bot behavior and settings</p>
        </div>

        <div className="flex items-center space-x-4">
          <Badge variant={settings.isActive ? "default" : "secondary"}>
            {settings.isActive ? 'Bot Active' : 'Bot Inactive'}
          </Badge>
          <Button onClick={saveGeneralSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Basic bot configuration and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="bot-active"
              checked={settings.isActive}
              onCheckedChange={(checked) => updateSettings({ isActive: checked })}
            />
            <Label htmlFor="bot-active">Enable Auto-Reply Bot</Label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  id="webhook-url"
                  value={settings.webhookUrl}
                  onChange={(e) => updateSettings({ webhookUrl: e.target.value })}
                  placeholder="https://yourdomain.com/api/webhook/whatsapp"
                />
                <Button
                  variant="outline"
                  onClick={testWebhook}
                  disabled={testingWebhook}
                  size="sm"
                >
                  {testingWebhook ? 'Testing...' : 'Test'}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="verify-token">Verify Token</Label>
              <Input
                id="verify-token"
                value={settings.verifyToken}
                onChange={(e) => updateSettings({ verifyToken: e.target.value })}
                placeholder="Your webhook verify token"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp API Configuration</CardTitle>
          <CardDescription>Connect your WhatsApp Business API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="access-token">Access Token</Label>
            <div className="flex gap-2">
              <Input
                id="access-token"
                type="password"
                value={settings.accessToken}
                onChange={(e) => updateSettings({ accessToken: e.target.value })}
                placeholder="Your WhatsApp API access token"
              />
              <Button
                variant="outline"
                onClick={testAPI}
                disabled={testingAPI}
                size="sm"
              >
                {testingAPI ? 'Testing...' : 'Test'}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="phone-number-id">Phone Number ID</Label>
            <Input
              id="phone-number-id"
              value={settings.phoneNumberId}
              onChange={(e) => updateSettings({ phoneNumberId: e.target.value })}
              placeholder="Your WhatsApp phone number ID"
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto-Reply Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Reply Messages</CardTitle>
          <CardDescription>Customize automatic responses for different scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new-customer-message">New Customer Message</Label>
            <Textarea
              id="new-customer-message"
              value={settings.autoReply.newCustomerMessage}
              onChange={(e) => updateAutoReply('newCustomerMessage', e.target.value)}
              placeholder="Message sent to first-time customers"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="returning-customer-message">Returning Customer Message</Label>
            <Textarea
              id="returning-customer-message"
              value={settings.autoReply.returningCustomerMessage}
              onChange={(e) => updateAutoReply('returningCustomerMessage', e.target.value)}
              placeholder="Message sent to returning customers"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="after-hours-message">After Hours Message</Label>
            <Textarea
              id="after-hours-message"
              value={settings.autoReply.afterHoursMessage}
              onChange={(e) => updateAutoReply('afterHoursMessage', e.target.value)}
              placeholder="Message sent outside business hours"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="fallback-message">Fallback Message</Label>
            <Textarea
              id="fallback-message"
              value={settings.autoReply.fallbackMessage}
              onChange={(e) => updateAutoReply('fallbackMessage', e.target.value)}
              placeholder="Default message when other rules don't apply"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
          <CardDescription>Configure when the bot should send different messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="business-hours-enabled"
              checked={settings.businessHours.enabled}
              onCheckedChange={(checked) => updateSettings({
                businessHours: { ...settings.businessHours, enabled: checked }
              })}
            />
            <Label htmlFor="business-hours-enabled">Enable Business Hours</Label>
          </div>

          {settings.businessHours.enabled && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.businessHours.timezone}
                  onValueChange={(value) => updateSettings({
                    businessHours: { ...settings.businessHours, timezone: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {Object.entries(settings.businessHours.schedule).map(([day, schedule]) => (
                  <div key={day} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="w-20">
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={(checked) => updateBusinessHours(day, 'enabled', checked)}
                      />
                      <Label className="capitalize text-sm mt-1">{day}</Label>
                    </div>
                    
                    {schedule.enabled && (
                      <>
                        <div>
                          <Label className="text-xs">Start</Label>
                          <Input
                            type="time"
                            value={schedule.start}
                            onChange={(e) => updateBusinessHours(day, 'start', e.target.value)}
                            className="w-24"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">End</Label>
                          <Input
                            type="time"
                            value={schedule.end}
                            onChange={(e) => updateBusinessHours(day, 'end', e.target.value)}
                            className="w-24"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Message Templates</CardTitle>
          <CardDescription>Pre-configured message templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.length > 0 ? (
              templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                      <Badge variant={template.isActive ? "default" : "secondary"} className="text-xs">
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {template.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No templates configured</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions that affect your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <h4 className="font-medium text-red-800">Reset Database</h4>
                <p className="text-sm text-red-600">Delete all messages, customers, and reset to defaults</p>
              </div>
              <Button
                variant="destructive"
                onClick={resetDatabase}
                size="sm"
              >
                Reset Database
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}