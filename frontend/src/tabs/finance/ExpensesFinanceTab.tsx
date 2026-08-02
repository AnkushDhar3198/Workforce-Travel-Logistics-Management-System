import React, { useState, useEffect } from 'react';
import { AlertTriangle, DollarSign, CheckCircle, Clock, TrendingDown, ShieldAlert } from 'lucide-react';
import { useAuth, API_BASE, getFileUrl } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import Pagination from '../../components/Pagination';

export default function ExpensesFinanceTab() {
  const { authFetch } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

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

  // Calculate metrics
  const pendingCount = expenses.length;
  const pendingTotalValue = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 text-left animate-fade-in-up">
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-cyan-400" />
            <span>T&amp;E Expenses Auditing</span>
          </h2>
          <p className="text-sm text-slate-400">Perform compliance audits on claims, check receipt OCR matches, and process corporate reimbursements.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={pendingCount > 0 ? 'warning' : 'outline'} className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-slate-355 flex items-center gap-1.5 shadow-sm">
            <ShieldAlert className={`w-3.5 h-3.5 ${pendingCount > 0 ? 'text-yellow-450 animate-pulse' : 'text-slate-500'}`} />
            <span>{pendingCount} Claims Awaiting Audit</span>
          </Badge>
        </div>
      </div>

      {/* 2. Top-level summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-450">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Claims to Audit</p>
              <h4 className="text-lg font-black text-white mt-0.5">{pendingCount} Pending</h4>
              <p className="text-[10px] text-slate-500">Requires OCR verification</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Pending Audit Value</p>
              <h4 className="text-lg font-black text-white mt-0.5">${pendingTotalValue.toFixed(2)}</h4>
              <p className="text-[10px] text-slate-500">Awaiting capital approval</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Turnaround SLA</p>
              <h4 className="text-lg font-black text-white mt-0.5">24 hrs</h4>
              <p className="text-[10px] text-emerald-450">OCR speed override active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 12-Column Responsive Layout Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Pending Audits Queue - span 8 */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Card className="bg-slate-900/40 border border-slate-850">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Pending T&amp;E Expenses Auditing Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              {expenses.length === 0 ? (
                /* Empty state check */
                <div className="text-center py-16 text-slate-500 space-y-4">
                  <CheckCircle className="w-12 h-12 mx-auto text-slate-650" />
                  <h4 className="text-sm font-bold text-white">Expense queue is completely clear!</h4>
                  <p className="text-xs text-slate-450 max-w-sm mx-auto">No pending employee reimbursement claims require auditing at this time. New expense filings will route here automatically.</p>
                </div>
              ) : (
                  <div className="space-y-6">
                    {expenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(exp => {
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
                        <div 
                          key={exp.id} 
                          className={`p-4 rounded-xl border bg-slate-900/60 space-y-4 ${
                            hasDiscrepancy ? 'border-red-500/25 shadow-lg shadow-red-950/20' : 'border-slate-850'
                          }`}
                        >
                          <div className="flex justify-between items-start border-b border-slate-800/80 pb-3">
                            <div>
                              <h4 className="font-extrabold text-white text-sm">
                                Expense ID: #{exp.id} – <span className="text-cyan-405">{exp.category}</span>
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-1">
                                Submitted by Employee ID: <span className="font-bold text-white">#{exp.employeeId}</span> | Trip Link Request ID: #{exp.travelRequestId}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-500 text-[9px] font-bold block mb-0.5">Claimed Amount</span>
                              <span className="text-lg font-black text-cyan-450">${exp.amount}</span>
                            </div>
                          </div>

                          {exp.ocrExtractedData ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-850 space-y-1">
                                <span className="font-bold text-slate-400">Claim Details:</span>
                                <div>Category: {exp.category}</div>
                                <div>Amount: ${exp.amount}</div>
                                <div>Uploaded File: <a href={getFileUrl(exp.receiptUrl)} target="_blank" rel="noreferrer" className="text-cyan-400 underline hover:text-cyan-300">View Receipt Document</a></div>
                              </div>
                              <div className={`p-3 rounded-lg border space-y-1 ${
                                hasDiscrepancy ? 'bg-red-950/20 border-red-900/30 text-red-300' : 'bg-slate-950/20 border-slate-850 text-slate-355'
                              }`}>
                                <div className="flex justify-between items-center font-bold">
                                  <span>Extracted OCR receipt:</span>
                                  {hasDiscrepancy && (
                                    <Badge variant="destructive" className="animate-pulse text-[8px] uppercase">
                                      Discrepancy Flag
                                    </Badge>
                                  )}
                                </div>
                                <div>Merchant: {ocrVendor}</div>
                                <div>Scanned Amount: ${ocrAmount}</div>
                                <div>Scan confidence: {(ocrConfidence * 100).toFixed(0)}%</div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-950/25 rounded-lg text-xs text-slate-500 border border-slate-900 text-center">
                              No scanned receipt uploaded. Manual review recommended.
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/60 items-center justify-between">
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleAudit(exp.id, true)}
                                className="text-xs font-bold btn-hover-scale h-8"
                              >
                                Approve Claim
                              </Button>
                              <Button 
                                onClick={() => handleAudit(exp.id, false)}
                                variant="destructive"
                                className="text-xs font-bold btn-hover-scale h-8"
                              >
                                Reject Claim
                              </Button>
                            </div>

                            {exp.status === 'APPROVED' && (
                              <Button 
                                onClick={() => handleReimburse(exp.id)}
                                variant="outline"
                                className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/30 h-8"
                              >
                                Mark Reimbursed
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(expenses.length / itemsPerPage)}
                      totalItems={expenses.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar turnaround speed - span 4 */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Turnaround speed gauge/metric card */}
          <Card className="bg-slate-900/40 border border-slate-850">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Reimbursement Turnaround
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Average Speed</span>
                  <div className="text-2xl font-black text-white mt-1">1.8 Days</div>
                  <span className="text-[9px] text-emerald-450 font-bold">&darr; 3.2 days using OCR automation</span>
                </div>
                <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>

              {/* Graphical Turnaround Gauge Indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Current SLA Compliance</span>
                  <span>94.2%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" style={{ width: '94.2%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-extrabold text-slate-350">Auditing Reference</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400 space-y-2">
              <p>• Discrepancies greater than $10.00 between claimed values and OCR extractions are highlighted in red.</p>
              <p>• Reject claims that do not correspond with the linked travel request category budget limits.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
