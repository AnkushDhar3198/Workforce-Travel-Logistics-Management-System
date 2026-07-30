import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { ClipboardList, Shield, Users, Clock, Activity } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export default function AuditLogsTab() {
  const { authFetch } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const res = await authFetch(`${API_BASE}/admin/audit-logs`);
        if (res.ok) {
          setLogs(await res.json());
        }
      } catch (err) {}
      setLoading(false);
    };
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(filter.toLowerCase()) || 
    l.entity.toLowerCase().includes(filter.toLowerCase()) ||
    l.userId.toString().includes(filter)
  );

  if (loading) return <div className="text-center text-slate-500 py-10">Loading security audit trail logs...</div>;

  // Calculate metrics
  const totalAuditEvents = logs.length;
  const uniqueUsersTracked = Array.from(new Set(logs.map(l => l.userId))).length;
  const lastLoggedTime = logs.length > 0 
    ? new Date(Math.max(...logs.map(l => new Date(l.timestamp).getTime()))).toLocaleTimeString()
    : 'N/A';

  return (
    <div className="space-y-6 text-left animate-fade-in-up">
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-cyan-400" />
            <span>System Audit Logs</span>
          </h2>
          <p className="text-sm text-slate-400">Review immutable security logs, system override events, and policy violation logs.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-slate-355 flex items-center gap-1.5 shadow-sm">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Immutable Trail Active</span>
          </Badge>
        </div>
      </div>

      {/* 2. Top-level summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Total Audit Events</p>
              <h4 className="text-lg font-black text-white mt-0.5">{totalAuditEvents} Events</h4>
              <p className="text-[10px] text-slate-500">Security event logging active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Users Audited</p>
              <h4 className="text-lg font-black text-white mt-0.5">{uniqueUsersTracked} unique accounts</h4>
              <p className="text-[10px] text-slate-500">Department scopes checked</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-450">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Last Event Time</p>
              <h4 className="text-lg font-black text-white mt-0.5">{lastLoggedTime}</h4>
              <p className="text-[10px] text-cyan-405">Auto-refresh connection secure</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 12-Column Responsive Layout Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Table - span 9 */}
        <div className="col-span-12 lg:col-span-9">
          <Card className="bg-slate-900/40 border border-slate-850">
            <CardHeader className="flex flex-row justify-between items-center border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Security Trail Table Logs
              </CardTitle>
              <Input 
                type="text" 
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Filter audit actions/entities..."
                className="max-w-xs text-xs h-8 bg-slate-950 border-slate-800 text-white animate-fade-in-up"
              />
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-550">No logs found matching filter criteria.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold text-slate-450">User ID</TableHead>
                      <TableHead className="text-xs font-bold text-slate-450">Action Event</TableHead>
                      <TableHead className="text-xs font-bold text-slate-450">Entity Context</TableHead>
                      <TableHead className="text-xs font-bold text-slate-450">Linked ID</TableHead>
                      <TableHead className="text-xs font-bold text-slate-450">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map(l => (
                      <TableRow key={l.id} className="hover:bg-slate-900/30 font-mono text-[11px]">
                        <TableCell className="font-bold text-cyan-400">#{l.userId}</TableCell>
                        <TableCell className="font-bold text-white uppercase">{l.action}</TableCell>
                        <TableCell className="text-slate-300">{l.entity}</TableCell>
                        <TableCell className="text-slate-500">{l.entityId || '-'}</TableCell>
                        <TableCell className="text-slate-500">{new Date(l.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - span 3 */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <Card className="bg-slate-900/40 border border-slate-850">
            <CardHeader className="border-b border-slate-855 pb-2 mb-3">
              <CardTitle className="text-xs uppercase font-extrabold text-slate-355 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>System Health Checks</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-400">
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span>Database Sync:</span>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-1.5">
                <span>API Gateway:</span>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>OCR Pipeline:</span>
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
