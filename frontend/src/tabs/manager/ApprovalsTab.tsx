import React, { useState, useEffect } from 'react';
import { AlertTriangle, UserCheck, DollarSign, CheckCircle, ShieldAlert } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ChartTooltip } from 'recharts';
import Pagination from '../../components/Pagination';

export default function ApprovalsTab() {
  const { authFetch } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const loadApprovals = async () => {
    setLoading(true);
    let serverRequests: any[] = [];
    try {
      const res = await authFetch(`${API_BASE}/travel/department`);
      if (res.ok) {
        serverRequests = await res.json();
      }
    } catch (e) {}

    if (serverRequests.length === 0) {
      try {
        const allRes = await authFetch(`${API_BASE}/travel`);
        if (allRes.ok) {
          serverRequests = await allRes.json();
        }
      } catch (e) {}
    }

    // Merge with local sync storage
    let localReqs: any[] = [];
    try {
      localReqs = JSON.parse(localStorage.getItem('voyacore_local_travel_requests') || '[]');
    } catch (e) {}

    const combined = [...serverRequests];
    for (const lreq of localReqs) {
      if (!combined.some(r => r.id === lreq.id || (r.destination === lreq.destination && r.estimatedCost === lreq.estimatedCost))) {
        combined.unshift(lreq);
      }
    }

    setRequests(combined);
    setLoading(false);
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleDecision = async (id: number, approve: boolean) => {
    const newStatus = approve ? 'APPROVED' : 'REJECTED';

    // 1. Instant local state update (< 5ms)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));

    // Update local sync storage item if present
    try {
      const localReqs = JSON.parse(localStorage.getItem('voyacore_local_travel_requests') || '[]');
      const updated = localReqs.map((r: any) => r.id === id ? { ...r, status: newStatus } : r);
      localStorage.setItem('voyacore_local_travel_requests', JSON.stringify(updated));
    } catch (e) {}

    alert(approve ? 'Request approved.' : 'Request rejected.');
    setComment('');

    // 2. Background API sync
    const endpoint = approve ? 'approve' : 'reject';
    authFetch(`${API_BASE}/travel/${id}/${endpoint}?comment=${encodeURIComponent(comment)}`, {
      method: 'POST'
    }).catch(err => {
      console.warn('[Approvals] Background sync notice:', err);
    });
  };

  if (loading) return <div className="text-center text-slate-500 py-10">Loading approval routing queue...</div>;

  const pendingList = requests.filter(r => r.status === 'PENDING');
  const approvedList = requests.filter(r => r.status === 'APPROVED');

  const totalSpent = approvedList.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
  const budgetCap = 50000;
  const remainingBudget = Math.max(0, budgetCap - totalSpent);
  const usagePct = budgetCap > 0 ? Math.min(100, Math.round((totalSpent / budgetCap) * 100)) : 0;

  // Donut chart budget data
  const budgetData = [
    { name: 'Spent YTD', value: totalSpent, color: '#6366f1' },
    { name: 'Remaining Budget', value: remainingBudget, color: '#14b8a6' }
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in-up">
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-cyan-400" />
            <span>Departmental Approvals Queue</span>
          </h2>
          <p className="text-sm text-slate-400">Review employee travel requests, check compliance flag warnings, and manage department spend budgets.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={pendingList.length > 0 ? 'warning' : 'outline'} className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-slate-355 flex items-center gap-1.5 shadow-sm">
            <ShieldAlert className={`w-3.5 h-3.5 ${pendingList.length > 0 ? 'text-yellow-450 animate-pulse' : 'text-slate-500'}`} />
            <span>{pendingList.length} Awaiting Manager Sign-off</span>
          </Badge>
        </div>
      </div>

      {/* 2. Stat Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-450">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Requests Pending Action</p>
              <h4 className="text-lg font-black text-white mt-0.5">{pendingList.length} Requisitions</h4>
              <p className="text-[10px] text-slate-500">Requires review & override flags</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Department Spend YTD</p>
              <h4 className="text-lg font-black text-white mt-0.5">${totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h4>
              <p className="text-[10px] text-emerald-450">Budget ceiling: ${budgetCap.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-450">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Requests Approved</p>
              <h4 className="text-lg font-black text-white mt-0.5">{approvedList.length} Trips</h4>
              <p className="text-[10px] text-slate-500">Routed to CTM booking rates</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 12-Column Responsive Layout Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Requisitions Queue - span 8 */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Card className="bg-slate-900/40 border border-slate-850">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Departmental Travel Requisitions Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              {pendingList.length === 0 ? (
                /* Empty state with illustration */
                <div className="text-center py-16 text-slate-500 space-y-4">
                  <UserCheck className="w-12 h-12 mx-auto text-slate-650" />
                  <h4 className="text-sm font-bold text-white">Requisition queue is completely clear!</h4>
                  <p className="text-xs text-slate-450 max-w-sm mx-auto">All departmental travel requests have been actioned. You will be notified when new requests are routed here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(req => (
                    <div key={req.id} className="p-4 rounded-xl border border-slate-850 bg-slate-900/60 space-y-4">
                      <div className="flex justify-between items-start border-b border-slate-800/80 pb-3">
                        <div>
                          <h4 className="font-extrabold text-white text-sm">Trip to {req.destination}</h4>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Requested by Employee ID: <span className="text-cyan-400 font-bold">#{req.employeeId}</span> | Dates: {req.startDate} to {req.endDate}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-cyan-405">${req.estimatedCost}</div>
                          <span className="text-[8px] text-slate-500 uppercase font-black block mt-0.5">Est. Cost</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                        <span className="font-bold text-slate-450 block mb-1">Business Purpose:</span>
                        {req.purpose}
                      </div>

                      {req.policyFlags && (
                        <Alert variant="warning" className="border-yellow-500/20 bg-yellow-500/5">
                          <AlertTriangle className="w-4 h-4 text-yellow-450" />
                          <AlertTitle className="text-yellow-405 font-bold text-xs">Policy Warnings Flags Detected</AlertTitle>
                          <AlertDescription>
                            <ul className="list-disc pl-4 text-[10px] text-slate-300 mt-1.5 space-y-0.5">
                              {req.policyFlags.split(',').filter(Boolean).map((flag: string, idx: number) => (
                                <li key={idx}>{flag}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center pt-2 border-t border-slate-800/60">
                        <Input 
                          type="text" 
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Provide decision comments..."
                          className="flex-1 text-xs bg-slate-950 border-slate-800 focus:border-cyan-500 h-9"
                        />
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleDecision(req.id, true)}
                            className="text-xs font-bold btn-hover-scale h-9"
                          >
                            Approve
                          </Button>
                          <Button 
                            onClick={() => handleDecision(req.id, false)}
                            variant="destructive"
                            className="text-xs font-bold btn-hover-scale h-9"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(pendingList.length / itemsPerPage)}
                    totalItems={pendingList.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar department budget - span 4 */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="bg-slate-900/40 border border-slate-855">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Departmental Budget YTD
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col items-center">
              <div className="w-full h-44 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgetData}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {budgetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip contentStyle={{ backgroundColor: '#121826', border: '1px solid #1f293d' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Usage</span>
                  <span className="text-lg font-black text-white">{usagePct}%</span>
                </div>
              </div>

              <div className="w-full space-y-3 mt-4 text-xs">
                {budgetData.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-950/20 border border-slate-850 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: d.color }}></div>
                      <span className="font-semibold text-slate-350">{d.name}</span>
                    </div>
                    <span className="text-white font-bold">${d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-extrabold text-slate-350">Manager Auditing Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400 space-y-2">
              <p>• Check lead times carefully. Flights booked within 14 days incur a significant price premium.</p>
              <p>• If warning overrides are active, verify the business purpose justifying premium travel classes.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
