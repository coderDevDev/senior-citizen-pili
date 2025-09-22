'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Search, Send, Clock, CheckCircle, AlertCircle, Bell } from 'lucide-react';

interface Message {
  id: string;
  subject: string;
  content: string;
  sender: string;
  sender_role: 'osca' | 'basca' | 'system';
  created_at: string;
  read_at?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'announcement' | 'reminder' | 'notification' | 'alert';
}

export default function SeniorMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    loadMessages();
  }, [statusFilter, typeFilter]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      
      // For now, we'll create mock messages since there's no messages table yet
      // In a real implementation, you would fetch from a messages table
      const mockMessages: Message[] = [
        {
          id: '1',
          subject: 'Monthly Pension Distribution Reminder',
          content: 'Your monthly pension will be distributed on January 15th, 2024. Please bring your OSCA ID and a valid government ID.',
          sender: 'OSCA Office',
          sender_role: 'osca',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          type: 'reminder'
        },
        {
          id: '2',
          subject: 'Free Medical Check-up Available',
          content: 'Free medical check-up for all registered senior citizens will be held at the Barangay Health Center on January 20th, 2024.',
          sender: 'Barangay Health Worker',
          sender_role: 'basca',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          read_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium',
          type: 'announcement'
        },
        {
          id: '3',
          subject: 'System Maintenance Notice',
          content: 'The OSCA system will undergo maintenance on January 25th from 2:00 AM to 6:00 AM. Services may be temporarily unavailable.',
          sender: 'System Administrator',
          sender_role: 'system',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          read_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'low',
          type: 'notification'
        },
        {
          id: '4',
          subject: 'Document Request Update',
          content: 'Your OSCA ID renewal request has been approved and is ready for pickup at the OSCA office.',
          sender: 'OSCA Office',
          sender_role: 'osca',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'urgent',
          type: 'alert'
        }
      ];

      // Apply filters
      let filteredMessages = mockMessages;

      if (statusFilter === 'unread') {
        filteredMessages = filteredMessages.filter(m => !m.read_at);
      } else if (statusFilter === 'read') {
        filteredMessages = filteredMessages.filter(m => m.read_at);
      }

      if (typeFilter !== 'all') {
        filteredMessages = filteredMessages.filter(m => m.type === typeFilter);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredMessages = filteredMessages.filter(m => 
          m.subject.toLowerCase().includes(searchLower) ||
          m.content.toLowerCase().includes(searchLower) ||
          m.sender.toLowerCase().includes(searchLower)
        );
      }

      setMessages(filteredMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId 
        ? { ...m, read_at: new Date().toISOString() }
        : m
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return Bell;
      case 'reminder': return Clock;
      case 'alert': return AlertCircle;
      default: return MessageSquare;
    }
  };

  const unreadCount = messages.filter(m => !m.read_at).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#333333]">Messages</h1>
          <p className="text-[#666666] mt-2">
            View notifications and communications from OSCA and BASCA
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">
                {unreadCount} unread
              </Badge>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 bg-gradient-to-r from-white to-gray-50/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#666666] w-5 h-5" />
                <Input
                  placeholder="Search messages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-12 text-base border-2 border-[#E0DDD8] focus:border-[#00af8f] focus:ring-4 focus:ring-[#00af8f]/10 rounded-2xl bg-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 h-12 border-2 border-[#E0DDD8] rounded-2xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48 h-12 border-2 border-[#E0DDD8] rounded-2xl">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="announcement">Announcements</SelectItem>
                  <SelectItem value="reminder">Reminders</SelectItem>
                  <SelectItem value="notification">Notifications</SelectItem>
                  <SelectItem value="alert">Alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#00af8f]/5 to-[#00af90]/5 border-b border-[#E0DDD8]/30">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#00af8f]" />
                <span>Messages</span>
                <Badge className="ml-2 bg-[#00af8f]/10 text-[#00af8f]">
                  {messages.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 text-center">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="p-6 text-center text-[#666666]">No messages found.</div>
              ) : (
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {messages.map((message) => {
                    const TypeIcon = getTypeIcon(message.type);
                    return (
                      <div
                        key={message.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedMessage?.id === message.id ? 'bg-[#00af8f]/5 border-r-4 border-[#00af8f]' : ''
                        } ${!message.read_at ? 'bg-blue-50/50' : ''}`}
                        onClick={() => {
                          setSelectedMessage(message);
                          if (!message.read_at) {
                            markAsRead(message.id);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <TypeIcon className="w-5 h-5 text-[#00af8f]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`text-sm font-medium truncate ${!message.read_at ? 'font-semibold' : ''}`}>
                                {message.subject}
                              </h4>
                              {!message.read_at && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-xs text-[#666666] mb-2 line-clamp-2">
                              {message.content}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#888888]">
                                {message.sender}
                              </span>
                              <Badge className={`text-xs ${getPriorityColor(message.priority)}`}>
                                {message.priority}
                              </Badge>
                            </div>
                            <div className="text-xs text-[#888888] mt-1">
                              {new Date(message.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#00af8f]/5 to-[#00af90]/5 border-b border-[#E0DDD8]/30">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#00af8f]" />
                <span>Message Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {selectedMessage ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[#333333] mb-2">
                        {selectedMessage.subject}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-[#666666]">
                        <span>From: <strong>{selectedMessage.sender}</strong></span>
                        <Badge className={getPriorityColor(selectedMessage.priority)}>
                          {selectedMessage.priority}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {selectedMessage.type}
                        </Badge>
                      </div>
                    </div>
                    {selectedMessage.read_at ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Read
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-blue-600 text-sm">
                        <Clock className="w-4 h-4" />
                        Unread
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-[#666666] border-b pb-4">
                    Received: {new Date(selectedMessage.created_at).toLocaleString()}
                    {selectedMessage.read_at && (
                      <span className="ml-4">
                        Read: {new Date(selectedMessage.read_at).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-[#333333] whitespace-pre-line leading-relaxed">
                      {selectedMessage.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#333333] mb-2">
                    Select a Message
                  </h3>
                  <p className="text-[#666666]">
                    Choose a message from the list to view its details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
