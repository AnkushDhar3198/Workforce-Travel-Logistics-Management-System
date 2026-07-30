import React from 'react';
import { 
  Plane, Calendar, Edit3, DollarSign, FileText, UserCheck, Settings, 
  ShieldCheck, Truck, Map, BarChart3, ClipboardList, Users, ShieldAlert, LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sosStatus: string;
  triggerSOS: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, sosStatus, triggerSOS }: SidebarProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = [
    // Employee views
    { id: 'itinerary', label: 'My Itinerary & Tracking', icon: Calendar, roles: ['TRAVELING_EMPLOYEE'] },
    { id: 'requisition', label: 'Travel Request Form', icon: Edit3, roles: ['TRAVELING_EMPLOYEE'] },
    { id: 'expenses-employee', label: 'Expense Submission', icon: DollarSign, roles: ['TRAVELING_EMPLOYEE'] },
    { id: 'docs-employee', label: 'Travel Documents', icon: FileText, roles: ['TRAVELING_EMPLOYEE'] },
    
    // Manager views
    { id: 'approvals', label: 'Pending Approvals', icon: UserCheck, roles: ['APPROVING_MANAGER'] },
    
    // CTM views
    { id: 'vendors', label: 'Preferred Vendors', icon: Settings, roles: ['CORPORATE_TRAVEL_MANAGER'] },
    { id: 'policy', label: 'Travel Policy Engine', icon: ShieldCheck, roles: ['CORPORATE_TRAVEL_MANAGER'] },
    
    // Finance views
    { id: 'expenses-finance', label: 'Expense Auditing', icon: DollarSign, roles: ['FINANCE_PROCUREMENT'] },
    
    // Logistics views
    { id: 'logistics', label: 'Logistics Pipeline', icon: Truck, roles: ['LOGISTICS_COORDINATOR'] },
    
    // Security views
    { id: 'security', label: 'Duty of Care Map', icon: Map, roles: ['SECURITY_RISK_OFFICER'] },
    
    // Shared / Admin views
    { id: 'analytics', label: 'Reports & ROI', icon: BarChart3, roles: ['CORPORATE_TRAVEL_MANAGER', 'FINANCE_PROCUREMENT', 'APPROVING_MANAGER'] },
    { id: 'audit', label: 'System Audit Logs', icon: ClipboardList, roles: ['ADMIN'] },
    { id: 'users', label: 'User Directory', icon: Users, roles: ['ADMIN'] },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
      <div>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
          <Plane className="w-6 h-6 text-cyan-400" />
          <span className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">VOYACORE</span>
        </div>

        <div className="p-4 border-b border-slate-800/80 bg-slate-950/20">
          <div className="text-sm font-bold text-white truncate">{user.name}</div>
          <div className="text-xs text-cyan-400 mt-0.5">{user.role.replace('_', ' ')}</div>
          <div className="text-[10px] text-slate-500 truncate mt-1">{user.department}</div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.filter(item => item.roles.includes(user.role)).map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                  activeTab === item.id 
                    ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 space-y-2">
        {user.role === 'TRAVELING_EMPLOYEE' && (
          <Button
            onClick={triggerSOS}
            variant={sosStatus === 'triggered' ? 'destructive' : 'outline'}
            className={`w-full flex items-center justify-center gap-2 text-xs font-extrabold ${sosStatus === 'triggered' ? 'animate-pulse' : ''}`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{sosStatus === 'triggered' ? 'SOS ACTIVE' : 'EMERGENCY SOS'}</span>
          </Button>
        )}
        <button 
          onClick={logout}
          className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-300 rounded flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
