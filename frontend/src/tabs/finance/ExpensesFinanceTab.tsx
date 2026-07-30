import React, { useState, useEffect } from 'react';
import { AlertTriangle, DollarSign } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';

export default function ExpensesFinanceTab() {
  const { authFetch } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/expenses/pending`);
      if (res.ok) {
        setExpenses(await res.json());
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleAudit = async (id: number, approve: boolean) => {
    const action = approve ? 'approve' : 'reject';
    try {
      const res = await authFetch(`${API_BASE}/expenses/${id}/${action}`, { method: 'POST' });
      if (res.ok) {
        alert(approve ? 'Expense approved for reimbursement.' : 'Expense rejected.');
        loadPending();
      }
    } catch (e) {}
  };

  const handleReimburse = async (id: number) => {
    try {
      const res = await authFetch(`${API_BASE}/expenses/${id}/reimburse`, { method: 'POST' });
      if (res.ok) {
        alert('Expense marked as REIMBURSED.');
        loadPending();
      }
    } catch (e) {}
  };

  if (loading) return <div className="text-center text-slate-500 py-10">Loading expense claims...</div>;

  return (
    <div className="space-y-6 text-left">
      <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">Pending T&amp;E Expenses Auditing Queue</h3>

      {expenses.length === 0 ? (
        <div className="text-center text-slate-500 py-10 bg-slate-900/35 border border-slate-950 rounded-xl">No pending expenses to audit.</div>
      ) : (
        <div className="space-y-6">
          {expenses.map(exp => {
            let ocrVendor = '';
            let ocrAmount = 0;
            let ocrConfidence = 0;
            let hasDiscrepancy = false;
            
            if (exp.ocrExtractedData) {
              try {
                const parsed = JSON.parse(exp.ocrExtractedData);
                ocrVendor = parsed.vendor;
                ocrAmount = parsed.amount;
                ocrConfidence = parsed.confidence;
                hasDiscrepancy = Math.abs(exp.amount - ocrAmount) > 10.0;
              } catch (e) {}
            }

            return (
              <Card 
                key={exp.id} 
                className={hasDiscrepancy ? 'border-red-950/40 bg-red-950/5' : ''}
              >
                <CardHeader className="flex flex-row justify-between items-start border-b border-slate-800/80 pb-3 mb-4">
                  <div>
                    <CardTitle className="text-base">Expense ID: #{exp.id} - {exp.category}</CardTitle>
                    <p className="text-xs text-slate-400 mt-1">Submitted by Employee ID: <span className="font-bold text-cyan-400">{exp.employeeId}</span> | Trip Link Request ID: {exp.travelRequestId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-xs block">Claimed Amount</span>
                    <span className="text-lg font-black text-cyan-400">${exp.amount}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exp.ocrExtractedData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-850 space-y-1">
                        <span className="font-bold text-slate-400">Claim Details:</span>
                        <div>Category: {exp.category}</div>
                        <div>Amount: ${exp.amount}</div>
                        <div>Uploaded File Link: <a href={exp.receiptUrl} target="_blank" rel="noreferrer" className="text-cyan-400 underline">View Receipt Document</a></div>
                      </div>
                      <div className={`p-3 rounded-lg border space-y-1 ${hasDiscrepancy ? 'bg-red-950/20 border-red-900/30 text-red-300' : 'bg-slate-900 border-slate-850 text-slate-350'}`}>
                        <div className="flex justify-between items-center font-bold">
                          <span>Extracted OCR receipt:</span>
                          {hasDiscrepancy && (
                            <Badge variant="destructive" className="animate-pulse">
                              Discrepancy Fraud Risk Flagged
                            </Badge>
                          )}
                        </div>
                        <div>Merchant: {ocrVendor}</div>
                        <div>Scanned Amount: ${ocrAmount}</div>
                        <div>Scan confidence: {(ocrConfidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-900/40 rounded-lg text-xs text-slate-500 border border-slate-950 text-center">No scanned receipt uploaded. Manual review recommended.</div>
                  )}

                  <div className="flex gap-3 items-center pt-2">
                    <Button 
                      onClick={() => handleAudit(exp.id, true)}
                      className="text-xs font-extrabold"
                    >
                      Approve Claim
                    </Button>
                    <Button 
                      onClick={() => handleAudit(exp.id, false)}
                      variant="destructive"
                      className="text-xs font-extrabold"
                    >
                      Reject Claim
                    </Button>
                    <Button 
                      onClick={() => handleReimburse(exp.id)}
                      variant="secondary"
                      className="text-xs font-extrabold text-cyan-400 ml-auto"
                    >
                      Mark Reimbursed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
