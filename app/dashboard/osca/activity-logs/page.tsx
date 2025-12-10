'use client';

import { useState, useEffect } from 'react';
import { ActivityLogsAPI } from '@/lib/api/activity-logs';
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
import { Download, Search, Filter, Activity, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function OSCAActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ActivityLogFilters>({
    page: 1,
    limit: 20
  });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [filters]);

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

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'csv') {
        content = await ActivityLogsAPI.exportToCSV(filters);
        filename = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      } else {
        content = await ActivityLogsAPI.exportToJSON(filters);
        filename = `activity-logs-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${format.toUpperCase()} successfully!`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export logs');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#333333]">Activity Logs</h1>
          <p className="text-[#666666] mt-2">
            Track all system activities and user actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#666666]">Actions</p>
                  <p className="text-2xl font-bold text-[#333333]">
                    {Object.keys(stats.by_action).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Filter className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by user, entity, or description..."
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
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="restore">Restore</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
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
                  <SelectItem value="announcement">Announcements</SelectItem>
                  <SelectItem value="senior_citizen">Senior Citizens</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => setFilters({ page: 1, limit: 20 })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History ({total} total)</CardTitle>
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
                        {log.barangay && (
                          <Badge variant="secondary">{log.barangay}</Badge>
                        )}
                      </div>
                      <p className="font-medium text-[#333333] mb-1">
                        {log.description}
                      </p>
                      <p className="text-sm text-[#666666]">
                        by {log.user_name} ({log.user_role})
                      </p>
                      {log.entity_name && (
                        <p className="text-sm text-[#888888] mt-1">
                          Entity: {formatEntityName(log.entity_name)}
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
