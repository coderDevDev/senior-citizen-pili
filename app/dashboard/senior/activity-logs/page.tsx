'use client';

import { useState, useEffect } from 'react';
import { ActivityLogsAPI } from '@/lib/api/activity-logs';
import { supabase } from '@/lib/supabase';
import type { ActivityLog, ActivityLogFilters } from '@/types/activity-logs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  ACTION_COLORS,
  ACTION_LABELS,
  ENTITY_TYPE_LABELS,
  ACTION_ICONS,
  formatEntityName
} from '@/types/activity-logs';
import { Activity, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function SeniorActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [filters, setFilters] = useState<ActivityLogFilters>({
    page: 1,
    limit: 20
  });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      loadLogs();
      loadStats();
    }
  }, [filters, userId]);

  const loadUserId = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setUserId(userData.user.id);
        setFilters(prev => ({ ...prev, user_id: userData.user.id }));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const result = await ActivityLogsAPI.getActivityLogs(filters);
      setLogs(result.logs);
      setTotal(result.total);
      setPages(result.pages);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await ActivityLogsAPI.getStats(filters);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#333333]">My Activity History</h1>
        <p className="text-[#666666] mt-2">
          View your activity history and actions
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#666666]">
                    Total Activities
                  </p>
                  <p className="text-2xl font-bold text-[#333333]">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-[#00af8f]/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[#00af8f]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#666666]">Today</p>
                  <p className="text-2xl font-bold text-[#333333]">{stats.today}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#666666]">Last 24h</p>
                  <p className="text-2xl font-bold text-[#333333]">
                    {stats.recent_activities}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search..."
                value={filters.search || ''}
                onChange={e =>
                  setFilters({ ...filters, search: e.target.value, page: 1 })
                }
                className="w-full"
              />
            </div>
            <div>
              <Select
                value={filters.action || 'all'}
                onValueChange={value =>
                  setFilters({
                    ...filters,
                    action: value === 'all' ? undefined : (value as any),
                    page: 1
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="cancel">Cancel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={filters.entity_type || 'all'}
                onValueChange={value =>
                  setFilters({
                    ...filters,
                    entity_type: value === 'all' ? undefined : (value as any),
                    page: 1
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="benefit">Benefits</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="appointment">Appointments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>My Activity History ({total} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00af8f] mx-auto"></div>
              <p className="text-[#666666] mt-4">Loading activity logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-[#666666]">
              No activity logs found
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{ACTION_ICONS[log.action]}</span>
                        <Badge className={ACTION_COLORS[log.action]}>
                          {ACTION_LABELS[log.action]}
                        </Badge>
                        <Badge variant="outline">
                          {ENTITY_TYPE_LABELS[log.entity_type]}
                        </Badge>
                      </div>
                      <p className="font-medium text-[#333333] mb-1">
                        {log.description}
                      </p>
                      {log.entity_name && (
                        <p className="text-sm text-[#888888] mt-1">
                          {formatEntityName(log.entity_name)}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-[#888888]">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div>{new Date(log.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={filters.page === 1}
                onClick={() =>
                  setFilters({ ...filters, page: (filters.page || 1) - 1 })
                }
              >
                Previous
              </Button>
              <span className="text-sm text-[#666666]">
                Page {filters.page} of {pages}
              </span>
              <Button
                variant="outline"
                disabled={filters.page === pages}
                onClick={() =>
                  setFilters({ ...filters, page: (filters.page || 1) + 1 })
                }
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
