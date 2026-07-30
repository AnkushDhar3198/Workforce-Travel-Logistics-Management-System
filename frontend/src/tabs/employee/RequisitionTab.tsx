import React, { useState, useEffect } from 'react';
import { Edit3, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';

export default function RequisitionTab() {
  const { authFetch } = useAuth();
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(500);
  const [policyFlags, setPolicyFlags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Evaluate policy inline dynamically as the user changes variables
  useEffect(() => {
    if (!startDate || !endDate || !estimatedCost) {
      setPolicyFlags([]);
      return;
    }
    const flags: string[] = [];
    const diff = Math.floor((new Date(startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 14) {
      flags.push("LATE_BOOKING: Selected start date is " + diff + " days away (Requires 14 days lead time).");
    }

    const durationDays = Math.max(1, Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));
    const dailyCap = estimatedCost / durationDays;
    if (dailyCap > 300) {
      flags.push(`BUDGET_EXCEEDED: Average daily cost $${dailyCap.toFixed(2)} exceeds regional per diem budget of $300.`);
    }

    if (estimatedCost > 2500 && !purpose.toLowerCase().includes("critical")) {
      flags.push("FLIGHT_CLASS_VIOLATION: Budget exceeds $2500 threshold. Premium class requires 'critical' business justification.");
    }
    
    setPolicyFlags(flags);
  }, [startDate, endDate, estimatedCost, purpose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE}/travel`, {
        method: 'POST',
        body: JSON.stringify({
          destination,
          startDate,
          endDate,
          purpose,
          estimatedCost,
          status: 'PENDING'
        })
      });
      if (res.ok) {
        alert('Travel request successfully submitted for manager approval.');
        setDestination('');
        setStartDate('');
        setEndDate('');
        setPurpose('');
        setEstimatedCost(500);
      } else {
        alert('Submission failed.');
      }
    } catch (err) {
      alert('Error connecting to servers.');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Edit3 className="w-7 h-7 text-cyan-400" />
            <span>Travel Request Form</span>
          </h2>
          <p className="text-sm text-slate-400">Plan new journeys, check travel policy violations, and route request for authorization.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {policyFlags.length > 0 ? (
            <Badge variant="warning" className="px-3 py-1.5 bg-yellow-500/10 border-yellow-500/20 text-yellow-400 flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{policyFlags.length} Warning Flags Active</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Compliant & Ready</span>
            </Badge>
          )}
        </div>
      </div>

      {/* 2. Grid cols-12 Layout */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Form Panel: span 7 */}
        <div className="col-span-12 lg:col-span-7">
          <Card className="hover-glow bg-slate-900/40 border border-slate-850 shadow-2xl">
            <CardHeader className="border-b border-slate-800 pb-3 mb-6">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                New Requisition Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">Destination City</label>
                    <Input 
                      type="text" required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. London, Singapore, Munich"
                      className="bg-slate-950 border-slate-800 text-white focus:border-cyan-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-455 uppercase tracking-wider mb-2">Estimated Budget ($)</label>
                    <Input 
                      type="number" required min="50"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(Number(e.target.value))}
                      className="bg-slate-950 border-slate-800 text-white focus:border-cyan-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">Departure Date</label>
                    <Input 
                      type="date" required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-white focus:border-cyan-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">Return Date</label>
                    <Input 
                      type="date" required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-white focus:border-cyan-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-455 uppercase tracking-wider mb-2">Business Justification &amp; Purpose</label>
                  <textarea 
                    required rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Provide details about clients or projects. (e.g. Critical client-facing deployment reviews. Include justification for premium budgets.)"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  />
                </div>

                {policyFlags.length > 0 && (
                  <Alert variant="warning" className="p-4 border-yellow-500/20 bg-yellow-500/5">
                    <AlertTriangle className="w-4 h-4 text-yellow-450" />
                    <AlertTitle className="text-yellow-400 font-extrabold text-xs">Compliance Violations Auto-Detected</AlertTitle>
                    <AlertDescription>
                      <ul className="text-[11px] text-slate-300 list-disc pl-5 space-y-1 mt-1.5">
                        {policyFlags.map((flag, idx) => <li key={idx}>{flag}</li>)}
                      </ul>
                      <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase">Note: Flagged requests will require multi-level approval overrides from managers.</p>
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full text-xs font-bold py-2 btn-hover-scale"
                >
                  {submitting ? 'Submitting request...' : 'Submit Travel Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Panel: span 5 */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-800 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Corporate Compliance Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-350">
              <div className="p-3.5 bg-slate-950/20 border border-slate-850 rounded-xl space-y-1.5">
                <span className="font-extrabold text-cyan-400 block uppercase tracking-wider text-[10px]">1. Lead Time Thresholds</span>
                <p className="text-[11px] text-slate-400">All commercial flights must be requested at least 14 days in advance to leverage negotiated preferred carrier rates.</p>
              </div>

              <div className="p-3.5 bg-slate-950/20 border border-slate-850 rounded-xl space-y-1.5">
                <span className="font-extrabold text-indigo-400 block uppercase tracking-wider text-[10px]">2. Regional Per Diem Budget Caps</span>
                <p className="text-[11px] text-slate-400">Global hotel caps are fixed at $300.00 average daily cost. Exceeding this triggers manager and policy engine reviews.</p>
              </div>

              <div className="p-3.5 bg-slate-950/20 border border-slate-850 rounded-xl space-y-1.5">
                <span className="font-extrabold text-purple-400 block uppercase tracking-wider text-[10px]">3. Flight Seat Class Policies</span>
                <p className="text-[11px] text-slate-400">Executive seats or bookings exceeding $2,500.00 total cost require a business justification containing key terms like "critical" to route correctly.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-slate-800 pb-2 mb-3">
              <CardTitle className="text-xs uppercase tracking-wider font-extrabold">Requisition FAQs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-400">
              <div>
                <span className="font-bold text-slate-300 block mb-0.5">What happens after I submit?</span>
                <p className="text-[11px] text-slate-400">Your approving manager will get a live dashboard notification and email request to either approve or reject the travel parameters.</p>
              </div>
              <div>
                <span className="font-bold text-slate-300 block mb-0.5">Can I modify my request?</span>
                <p className="text-[11px] text-slate-400">Once submitted, parameters are locked. Contact your Corporate Travel Manager (CTM) to cancel or adjust pending items.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
