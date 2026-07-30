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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      {/* Submit Form */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
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
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
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
              {uploading && <div className="text-[10px] text-cyan-400 mt-1 animate-pulse font-semibold">Running optical character extraction (OCR)...</div>}
            </div>

            {ocrResult && (
              <Alert className="bg-cyan-950/15 border-cyan-500/25">
                <CheckCircle className="w-4 h-4 text-cyan-400" />
                <AlertTitle className="text-cyan-400">Extracted OCR Receipt Data</AlertTitle>
                <AlertDescription className="text-slate-300">
                  <div className="text-[11px] space-y-0.5 mt-1.5">
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
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
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Submit Expense Claim
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Expense History Table */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Reimbursement Claims History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Claimed</TableHead>
                <TableHead>OCR Scanned</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableRow key={exp.id}>
                    <TableCell className="font-semibold text-white">{exp.category}</TableCell>
                    <TableCell className="font-bold text-cyan-400">${exp.amount}</TableCell>
                    <TableCell className="text-slate-500">{ocrVal}</TableCell>
                    <TableCell>{new Date(exp.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                        exp.status === 'REIMBURSED' ? 'success' :
                        exp.status === 'APPROVED' ? 'default' :
                        exp.status === 'REJECTED' ? 'destructive' : 'warning'
                      }>{exp.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
