import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';

export default function UsersTab() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await authFetch(`${API_BASE}/admin/users`);
        if (res.ok) setUsers(await res.json());
      } catch (err) {}
    };
    loadUsers();
  }, []);

  return (
    <Card className="text-left">
      <CardHeader className="border-b border-slate-800 pb-3 mb-4">
        <CardTitle>Corporate User Directory</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-bold text-white">{u.name}</TableCell>
                <TableCell className="text-slate-450">{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-cyan-400 font-bold border-cyan-500/20">{u.role}</Badge>
                </TableCell>
                <TableCell>{u.department}</TableCell>
                <TableCell className="text-slate-500 font-semibold">{u.phone}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
