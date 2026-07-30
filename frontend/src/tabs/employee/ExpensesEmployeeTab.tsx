import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';

const EXPENSE_CATEGORIES = ['FLIGHT', 'HOTEL', 'TRANSPORT', 'MEAL', 'OTHER'];

export default function ExpensesEmployeeTab() {
  const { authFetch } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<string>('');
  const [category, setCategory] = useState('HOTEL');
  const [amount, setAmount] = useState(100);
  const [uploading, setUploading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [expenseList, setExpenseList] = useState<any[]>([]);

  const loadExpenses = async () => {
    try {
      const res = await authFetch(`${API_BASE}/travel/employee`);
      if (res.ok) {
        const list = await res.json();
        setRequests(list);
        if (list.length > 0) setSelectedReqId(list[0].id.toString());
      }
      
      const expRes = await authFetch(`${API_BASE}/expenses/employee`);
      if (expRes.ok) {
        setExpenseList(await expRes.json());
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setOcrResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch(`${API_BASE}/expenses/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setReceiptUrl(data.url);
        
        const name = file.name.toLowerCase();
        let extAmount = 50 + Math.floor(Math.random() * 200);
        let extVendor = "Hilton Hotels";
        if (name.includes('uber') || name.includes('taxi')) {
          extAmount = 35;
          extVendor = "Uber Inc.";
        } else if (name.includes('delta') || name.includes('flight')) {
          extAmount = 650;
          extVendor = "Delta Air Lines";
        }
        
        setOcrResult({
          vendor: extVendor,
          amount: extAmount,
          date: new Date().toLocaleDateString(),
          confidence: 0.98
        });
        
        setAmount(extAmount);
      }
    } catch (err) {}
    setUploading(false);
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqId) return;

    try {
      const res = await authFetch(`${API_BASE}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          travelRequestId: Number(selectedReqId),
          category,
          amount,
          receiptUrl
        })
      });
      if (res.ok) {
        alert('Expense report submitted successfully.');
        setOcrResult(null);
        setReceiptUrl('');
        loadExpenses();
      }
    } catch (err) {}
  };

  // Calculate statistics from current expense list
  const totalClaimsCount = expenseList.length;
  const totalReimbursedAmount = expenseList
    .filter(e => e.status === 'REIMBURSED')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalPendingAmount = expenseList
    .filter(e => e.status === 'PENDING' || e.status === 'APPROVED')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 text-left animate-fade-in-up">
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-cyan-400" />
            <span>Expense Submission & Claims</span>
          </h2>
          <p className="text-sm text-slate-400">File expense claims, scan receipts using AI OCR simulation, and monitor approval status.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-slate-350 flex items-center gap-1.5 shadow-sm">
            <span>Claims Logged: {totalClaimsCount}</span>
          </Badge>
        </div>
      </div>

      {/* 2. Top-level summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Reimbursed YTD</p>
              <h4 className="text-lg font-black text-white mt-0.5">${totalReimbursedAmount.toFixed(2)}</h4>
              <p className="text-[10px] text-emerald-450">&uarr; Direct bank deposit active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-405">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Pending Audit</p>
              <h4 className="text-lg font-black text-white mt-0.5">${totalPendingAmount.toFixed(2)}</h4>
              <p className="text-[10px] text-slate-500">Awaiting Finance verification</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Avg Settlement Speed</p>
              <h4 className="text-lg font-black text-white mt-0.5">1.8 Days</h4>
              <p className="text-[10px] text-cyan-405">Automated OCR routing enabled</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 12-Column Layout */}
      <div className="grid grid-cols-12 gap-8">
        {/* Submit Form Card - span 5 */}
        <div className="col-span-12 lg:col-span-5">
          <Card className="hover-glow bg-slate-900/40 border border-slate-850 h-fit">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span>Upload Receipt Claim</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Select Approved Trip</label>
                  <select 
                    value={selectedReqId}
                    onChange={(e) => setSelectedReqId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {requests.map(r => (
                      <option key={r.id} value={r.id}>{r.destination} ({r.startDate})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Scan Receipt Image (OCR Simulation)</label>
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600/10 file:text-cyan-400 hover:file:bg-cyan-600/20 file:cursor-pointer"
                  />
                  {uploading && <div className="text-[10px] text-cyan-400 mt-1.5 animate-pulse font-semibold">Running optical character extraction (OCR)...</div>}
                </div>

                {ocrResult && (
                  <Alert className="bg-cyan-950/15 border-cyan-500/25 p-4">
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                    <AlertTitle className="text-cyan-400 font-bold text-xs">Extracted OCR Receipt Data</AlertTitle>
                    <AlertDescription className="text-slate-300">
                      <div className="text-[11px] space-y-0.5 mt-2">
                        <div><span className="text-slate-500">Merchant:</span> {ocrResult.vendor}</div>
                        <div><span className="text-slate-500">Total Scanned:</span> ${ocrResult.amount}</div>
                        <div><span className="text-slate-500">Confidence:</span> {(ocrResult.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none"
                    >
                      {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">Claim Amount ($)</label>
                    <Input 
                      type="number" required
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="bg-slate-950 border-slate-800 text-white focus:border-cyan-500 text-xs"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full text-xs font-bold btn-hover-scale mt-2">
                  Submit Expense Claim
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Expense History Table - span 7 */}
        <div className="col-span-12 lg:col-span-7">
          <Card className="bg-slate-900/40 border border-slate-850">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Reimbursement Claims History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseList.length === 0 ? (
                /* Empty state check */
                <div className="text-center py-12 text-slate-500 space-y-3">
                  <DollarSign className="w-10 h-10 mx-auto text-slate-650" />
                  <p className="text-xs">No reimbursement claims logged. Upload your first scanned receipt to begin.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-slate-400 text-xs">Category</TableHead>
                      <TableHead className="text-slate-400 text-xs">Claimed</TableHead>
                      <TableHead className="text-slate-400 text-xs">OCR Scanned</TableHead>
                      <TableHead className="text-slate-400 text-xs">Date</TableHead>
                      <TableHead className="text-slate-400 text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseList.map(exp => {
                      let ocrVal = '-';
                      if (exp.ocrExtractedData) {
                        try {
                          const parsed = JSON.parse(exp.ocrExtractedData);
                          ocrVal = `$${parsed.amount}`;
                        } catch (e) {}
                      }
                      return (
                        <TableRow key={exp.id} className="hover:bg-slate-900/30">
                          <TableCell className="font-semibold text-white text-xs">{exp.category}</TableCell>
                          <TableCell className="font-bold text-cyan-400 text-xs">${exp.amount}</TableCell>
                          <TableCell className="text-slate-500 text-xs">{ocrVal}</TableCell>
                          <TableCell className="text-xs">{new Date(exp.submittedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              exp.status === 'REIMBURSED' ? 'success' :
                              exp.status === 'APPROVED' ? 'default' :
                              exp.status === 'REJECTED' ? 'destructive' : 'warning'
                            } className="text-[10px]">{exp.status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
