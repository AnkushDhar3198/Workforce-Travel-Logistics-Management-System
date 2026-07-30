import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth, API_BASE } from '../context/AuthContext';

interface HeaderProps {
  activeTab: string;
  notifications: any[];
  loadNotifications: () => void;
}

export default function Header({ activeTab, notifications, loadNotifications }: HeaderProps) {
  const { authFetch } = useAuth();
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const markAllNotifRead = async () => {
    try {
      await authFetch(`${API_BASE}/notifications/read-all`, { method: 'PUT' });
      loadNotifications();
    } catch (err) {}
  };

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  return (
    <header className="h-16 border-b border-slate-800/80 px-8 flex justify-between items-center glass-panel sticky top-0 z-40">
      <h1 className="text-xl font-bold tracking-tight text-white capitalize">
        {activeTab.replace('-', ' ')}
      </h1>

      <div className="flex items-center gap-4 relative">
        <button 
          onClick={() => setShowNotifPanel(!showNotifPanel)}
          className="p-2 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-800/60 border border-slate-800 cursor-pointer relative"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-cyan-500 text-[#030712] font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifPanel && (
          <div className="absolute right-0 top-12 w-80 glass-panel rounded-xl shadow-2xl border border-slate-800 p-4 z-50 text-xs text-left">
            <div className="flex justify-between items-center mb-3">
              <span className="font-extrabold text-white">Notifications</span>
              <button onClick={markAllNotifRead} className="text-cyan-400 hover:underline cursor-pointer">Mark read</button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {notifications.length === 0 ? (
                <div className="text-center text-slate-500 py-4">No notifications</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-2 rounded border transition-colors ${n.readStatus ? 'bg-slate-950/20 border-slate-900 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                    <div className="flex justify-between font-semibold mb-0.5">
                      <span className="text-[10px] text-cyan-505 uppercase">{n.type}</span>
                      <span className="text-[8px] text-slate-505">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p>{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
