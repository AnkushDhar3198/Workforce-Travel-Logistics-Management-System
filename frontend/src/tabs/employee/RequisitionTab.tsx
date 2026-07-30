import React, { useState, useEffect } from 'react';
import { Edit3, AlertTriangle } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';

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
    <Card className="max-w-2xl mx-auto text-left">
      <CardHeader className="border-b border-slate-800 pb-3 mb-6">
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-cyan-400" />
          <span>Create Travel Request</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Destination City</label>
              <Input 
                type="text" required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. London, Singapore, Munich"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estimated Budget ($)</label>
              <Input 
                type="number" required min="50"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Departure Date</label>
              <Input 
                type="date" required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Return Date</label>
              <Input 
                type="date" required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Business Justification &amp; Purpose</label>
            <textarea 
              required rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Critical client-facing deployment reviews. Include details for flight-class justification if budget is premium."
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
            />
          </div>

          {policyFlags.length > 0 && (
            <Alert variant="warning" className="p-4">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Policy Compliance Warning Flags</AlertTitle>
              <AlertDescription>
                <ul className="text-xs text-slate-300 list-disc pl-5 space-y-1 mt-1">
                  {policyFlags.map((flag, idx) => <li key={idx}>{flag}</li>)}
                </ul>
                <p className="text-[10px] text-slate-500 mt-2">Note: Flagged requests will require multi-level approval overrides.</p>
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={submitting}
            className="w-full"
          >
            {submitting ? 'Submitting request...' : 'Submit Travel Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
