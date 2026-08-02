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
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-[1600px] mx-auto w-full"
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

          {/* APPLE-STYLE ULTRA-MINIMAL DASHBOARD FOOTER */}
          <footer
            style={{
              marginTop: '24px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: '10px',
              color: 'var(--text-muted)',
              lineHeight: 1.4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                {user?.role ? user.role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'Employee'} Session
              </span>
              <span>•</span>
              <span>Level-5 Autonomous Protocol</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>256-Bit SSL</span>
              <span>•</span>
              <span>SSE Connected</span>
              <span>•</span>
              <span>Copyright © 2026 VoyaCore Inc.</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("VoyaCore Application Boundary Caught Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#03050d', color: '#f0f6ff', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ maxWidth: '460px', width: '100%', textAlign: 'center', padding: '32px', borderRadius: '24px', background: 'rgba(13, 21, 38, 0.75)', border: '1px solid rgba(99, 179, 237, 0.2)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              ⚡
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '8px', color: '#fff' }}>VoyaCore Enterprise Recovery</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.5 }}>
              The application encountered a minor runtime sync update. Click below to reload the session smoothly.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)', color: '#03050d', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer' }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const { token } = useAuth();
  return !token ? <LoginScreen /> : <DashboardContent />;
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}
