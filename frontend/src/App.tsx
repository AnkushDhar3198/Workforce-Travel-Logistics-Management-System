import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth, API_BASE } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Canvas3DBackground from './components/Canvas3DBackground';

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
    if (!window.confirm('Trigger emergency SOS? Security will be notified immediately.')) return;
    setSosStatus('sending');
    try {
      const location = `GPS: ${(13.75 + Math.random() * 2).toFixed(4)}, ${(100.5 + Math.random() * 2).toFixed(4)} (Mock)`;
      const res = await authFetch(`${API_BASE}/alerts/sos?location=${encodeURIComponent(location)}`, { method: 'POST' });
      if (res.ok) {
        setSosStatus('triggered');
        loadNotifications();
        alert('SOS active. Security dispatched.');
      } else setSosStatus('error');
    } catch {
      setSosStatus('error');
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        position: 'relative',
      }}
    >
      {/* Full-screen animated 3D canvas background */}
      <Canvas3DBackground />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sosStatus={sosStatus}
        triggerSOS={triggerSOS}
      />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          position: 'relative',
          zIndex: 10,
          overflow: 'hidden',
        }}
      >
        <Header
          activeTab={activeTab}
          notifications={notifications}
          loadNotifications={loadNotifications}
        />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          <div key={activeTab} className="animate-fade-slide-up">
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
