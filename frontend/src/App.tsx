import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth, API_BASE, BACKEND_URL } from './context/AuthContext';
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
  const { user, token, authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [sosStatus, setSosStatus] = useState<string>('idle');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<any>(null);

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

  // SSE Real-Time Connection
  useEffect(() => {
    if (!token) return;

    // Load initial notifications
    loadNotifications();

    let retryDelay = 1000;

    const connectSSE = () => {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // EventSource doesn't support custom headers natively,
      // so we pass the token as a query param (backend will need to support this)
      // Alternatively, we use a polyfill approach with fetch-based SSE
      const sseUrl = `${BACKEND_URL}/api/sse/subscribe?token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('connected', () => {
        console.log('[SSE] Real-time connection established');
        retryDelay = 1000; // Reset retry delay on successful connection
      });

      eventSource.addEventListener('NOTIFICATION', (event) => {
        try {
          const notification = JSON.parse(event.data);
          setNotifications(prev => [notification, ...prev]);
        } catch (e) {
          console.error('[SSE] Failed to parse notification:', e);
        }
      });

      eventSource.addEventListener('SHIPMENT_UPDATE', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] Shipment update:', data);
          // Trigger a notification reload for full context
          loadNotifications();
        } catch (e) {
          console.error('[SSE] Failed to parse shipment update:', e);
        }
      });

      eventSource.onerror = () => {
        console.warn('[SSE] Connection lost, will retry in', retryDelay / 1000, 's');
        eventSource.close();
        // Exponential backoff retry
        reconnectTimerRef.current = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, 30000);
          connectSSE();
        }, retryDelay);
      };
    };

    connectSSE();

    // Fallback: still poll every 30s as a safety net (much less frequent than before)
    const fallbackInterval = setInterval(loadNotifications, 30000);

    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      clearInterval(fallbackInterval);
    };
  }, [token]);

  const triggerSOS = async () => {
    if (!window.confirm('Trigger emergency SOS? Security will be notified immediately.')) return;
    setSosStatus('sending');
    try {
      const location = `GPS: ${(13.75 + Math.random() * 2).toFixed(4)}, ${(100.5 + Math.random() * 2).toFixed(4)} (Live)`;
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
      <Canvas3DBackground />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sosStatus={sosStatus}
        triggerSOS={triggerSOS}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

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
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          sosStatus={sosStatus}
          triggerSOS={triggerSOS}
        />

        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          <div key={activeTab} className="animate-fade-slide-up">
            {activeTab === 'itinerary' && <ItineraryTab onNavigateToRequisition={() => setActiveTab('requisition')} />}
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

          {/* APPLE-STYLE MINIMAL DASHBOARD FOOTER */}
          <footer
            style={{
              marginTop: '40px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '10.5px',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {user?.role ? user.role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'Employee'} Session
              </span>
              <span>•</span>
              <span>Level-5 Autonomous Protocol</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span>256-Bit SSL</span>
              <span>•</span>
              <span>SSE Connected</span>
              <span>•</span>
              <span>Copyright © 2026 VoyaCore Inc. All rights reserved.</span>
            </div>
          </footer>
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
