import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, API_BASE } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Import Tab Views
import ItineraryTab from './tabs/employee/ItineraryTab';
import RequisitionTab from './tabs/employee/RequisitionTab';
import ExpensesEmployeeTab from './tabs/employee/ExpensesEmployeeTab';
import DocsEmployeeTab from './tabs/employee/DocsEmployeeTab';
import ApprovalsTab from './tabs/manager/ApprovalsTab';
import VendorsTab from './tabs/ctm/VendorsTab';
import PolicyRulesTab from './tabs/ctm/PolicyRulesTab';
import ExpensesFinanceTab from './tabs/finance/ExpensesFinanceTab';
import LogisticsTab from './tabs/logistics/LogisticsTab';
import SecurityTab from './tabs/security/SecurityTab';
import AnalyticsTab from './tabs/shared/AnalyticsTab';
import AuditLogsTab from './tabs/admin/AuditLogsTab';
import UsersTab from './tabs/admin/UsersTab';

function DashboardContent() {
  const { user, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sosStatus, setSosStatus] = useState<string>('idle');

  useEffect(() => {
    if (!user) return;
    const defaultTabs: Record<string, string> = {
      TRAVELING_EMPLOYEE: 'itinerary',
      APPROVING_MANAGER: 'approvals',
      CORPORATE_TRAVEL_MANAGER: 'vendors',
      FINANCE_PROCUREMENT: 'expenses-finance',
      SECURITY_RISK_OFFICER: 'security',
      LOGISTICS_COORDINATOR: 'logistics',
      ADMIN: 'audit',
    };
    setActiveTab(defaultTabs[user.role] || 'itinerary');
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await authFetch(`${API_BASE}/notifications`);
      if (res.ok) setNotifications(await res.json());
    } catch {}
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSOS = async () => {
    if (!window.confirm('Are you sure you want to trigger an emergency SOS panic alert? Security risk officers will be notified immediately.')) return;
    setSosStatus('sending');
    try {
      const location = `GPS Coords: ${(13.75 + Math.random() * 2).toFixed(4)}, ${(100.5 + Math.random() * 2).toFixed(4)} (Mock Geolocation)`;
      const res = await authFetch(`${API_BASE}/alerts/sos?location=${encodeURIComponent(location)}`, { method: 'POST' });
      if (res.ok) {
        setSosStatus('triggered');
        loadNotifications();
        alert('SOS active. Security commands dispatched.');
      } else {
        setSosStatus('error');
      }
    } catch {
      setSosStatus('error');
    }
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Animated background */}
      <div className="app-bg" aria-hidden>
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sosStatus={sosStatus}
        triggerSOS={triggerSOS}
      />

      <div
        className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden"
        style={{ background: 'transparent' }}
      >
        <Header
          activeTab={activeTab}
          notifications={notifications}
          loadNotifications={loadNotifications}
        />

        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div key={activeTab} className="animate-fade-slide-up h-full">
            {activeTab === 'itinerary' && <ItineraryTab />}
            {activeTab === 'requisition' && <RequisitionTab />}
            {activeTab === 'expenses-employee' && <ExpensesEmployeeTab />}
            {activeTab === 'docs-employee' && <DocsEmployeeTab />}
            {activeTab === 'approvals' && <ApprovalsTab />}
            {activeTab === 'vendors' && <VendorsTab />}
            {activeTab === 'policy' && <PolicyRulesTab />}
            {activeTab === 'expenses-finance' && <ExpensesFinanceTab />}
            {activeTab === 'logistics' && <LogisticsTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'audit' && <AuditLogsTab />}
            {activeTab === 'users' && <UsersTab />}
          </div>
        </main>
      </div>
    </div>
  );
}

function MainApp() {
  const { token } = useAuth();
  return !token ? <LoginScreen /> : <DashboardContent />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
