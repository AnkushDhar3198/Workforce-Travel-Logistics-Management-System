import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Users, Building2, Shield } from 'lucide-react';

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

  // Calculations for Admin directory stats
  const totalCorporateUsers = users.length;
  const uniqueDepartmentsCount = Array.from(new Set(users.map(u => u.department))).length;
  const rolesCount = Array.from(new Set(users.map(u => u.role))).length;

  return (
    <div className="space-y-6 text-left animate-fade-in-up">
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-cyan-400" />
            <span>Corporate User Directory</span>
          </h2>
          <p className="text-sm text-slate-400">View and manage global corporate profiles, user role levels, and department designations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-slate-355 flex items-center gap-1.5 shadow-sm">
            <span>Active Directory Profiles: {totalCorporateUsers}</span>
          </Badge>
        </div>
      </div>

      {/* 2. Top-level summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Total Accounts</p>
              <h4 className="text-lg font-black text-white mt-0.5">{totalCorporateUsers} Profiles</h4>
              <p className="text-[10px] text-slate-500">Corporate AD synced</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-405">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Active Departments</p>
              <h4 className="text-lg font-black text-white mt-0.5">{uniqueDepartmentsCount} Cost Centers</h4>
              <p className="text-[10px] text-slate-500">Automated budget checking scope</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-450">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Access Roles</p>
              <h4 className="text-lg font-black text-white mt-0.5">{rolesCount} Role Classes</h4>
              <p className="text-[10px] text-cyan-405">Granular routing authorization</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Directory Card list */}
      <Card className="bg-slate-900/40 border border-slate-850">
        <CardHeader className="border-b border-slate-850 pb-3 mb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
            Corporate User Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id} className="hover:bg-slate-900/30">
                  <TableCell className="font-bold text-white text-xs">{u.name}</TableCell>
                  <TableCell className="text-slate-400 text-xs">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-cyan-400 font-bold border-cyan-500/20 text-[9px] uppercase tracking-wider">
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{u.department}</TableCell>
                  <TableCell className="text-slate-500 font-semibold text-xs">{u.phone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
