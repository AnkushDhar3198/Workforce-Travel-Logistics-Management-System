import React, { useState, useEffect } from 'react';
import { AlertTriangle, UserCheck } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';

export default function ApprovalsTab() {
  const { authFetch } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/travel/department`);
      if (res.ok) {
        setRequests(await res.json());
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleDecision = async (id: number, approve: boolean) => {
    try {
      const endpoint = approve ? 'approve' : 'reject';
      const res = await authFetch(`${API_BASE}/travel/${id}/${endpoint}?comment=${encodeURIComponent(comment)}`, {
        method: 'POST'
      });
      if (res.ok) {
        alert(approve ? 'Request approved.' : 'Request rejected.');
        setComment('');
        loadApprovals();
      }
    } catch (e) {}
  };

  if (loading) return <div className="text-center text-slate-500 py-10">Loading approval routing queue...</div>;

  const pendingList = requests.filter(r => r.status === 'PENDING');

  return (
    <div className="space-y-6 text-left">
      <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">Departmental Travel Requisitions Queue</h3>
      
      {pendingList.length === 0 ? (
        <div className="text-center text-slate-500 py-10 bg-slate-900/35 border border-slate-950 rounded-xl">No pending approvals required.</div>
      ) : (
        <div className="space-y-6">
          {pendingList.map(req => (
            <Card key={req.id}>
              <CardHeader className="flex flex-row justify-between items-start border-b border-slate-800/80 pb-3 mb-4">
                <div>
                  <CardTitle className="text-base">Trip to {req.destination}</CardTitle>
                  <div className="text-xs text-slate-400 mt-1">Requested by Employee ID: <span className="text-cyan-400 font-semibold">{req.employeeId}</span> | Dates: {req.startDate} to {req.endDate}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-white">${req.estimatedCost}</div>
                  <div className="text-[10px] text-slate-500 uppercase mt-0.5">Est. Cost</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xs text-slate-350 bg-slate-950/30 p-3 rounded-lg border border-slate-850">
                  <span className="font-bold text-slate-400 block mb-1">Business Purpose:</span>
                  {req.purpose}
                </div>

                {req.policyFlags && (
                  <Alert variant="warning">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTitle>Engine Violation Flags Detected:</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 text-slate-300 mt-1">
                        {req.policyFlags.split(',').filter(Boolean).map((flag: string, idx: number) => (
                          <li key={idx}>{flag}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-4 items-center border-t border-slate-800 pt-4">
                  <Input 
                    type="text" 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Decision justification comments..."
                    className="flex-1 text-xs"
                  />
                  <Button 
                    onClick={() => handleDecision(req.id, true)}
                    className="text-xs font-extrabold"
                  >
                    Approve Request
                  </Button>
                  <Button 
                    onClick={() => handleDecision(req.id, false)}
                    variant="destructive"
                    className="text-xs font-extrabold"
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
