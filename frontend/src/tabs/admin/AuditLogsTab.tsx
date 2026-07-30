import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';

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

  return (
    <Card className="text-left">
      <CardHeader className="flex flex-row justify-between items-center border-b border-slate-800/80 pb-3 mb-4">
        <CardTitle>Immutable Security Audit Trail Logs</CardTitle>
        <Input 
          type="text" 
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter audit actions/entities..."
          className="max-w-xs text-xs h-8"
        />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Action Event</TableHead>
              <TableHead>Entity Context</TableHead>
              <TableHead>Linked ID</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map(l => (
              <TableRow key={l.id} className="font-mono">
                <TableCell className="font-bold text-cyan-400">{l.userId}</TableCell>
                <TableCell className="font-bold text-white">{l.action}</TableCell>
                <TableCell>{l.entity}</TableCell>
                <TableCell className="text-slate-500">{l.entityId || '-'}</TableCell>
                <TableCell className="text-slate-500">{new Date(l.timestamp).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
