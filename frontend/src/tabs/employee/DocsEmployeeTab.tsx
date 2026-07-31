import React, { useState, useEffect } from 'react';
import { FileText, Trash2, BadgeAlert } from 'lucide-react';
import { useAuth, API_BASE, BACKEND_URL } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const DOCUMENT_TYPES = ['PASSPORT', 'VISA', 'TICKET', 'INSURANCE', 'SHIPMENT_DOC'];

export default function DocsEmployeeTab() {
  const { authFetch } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [docType, setDocType] = useState('PASSPORT');
  const [expiryDate, setExpiryDate] = useState('');
  const [fileUrl] = useState(`${BACKEND_URL}/uploads/bob_docs.pdf`);
  const [submitting, setSubmitting] = useState(false);

  const loadDocs = async () => {
    try {
      const res = await authFetch(`${API_BASE}/documents`);
      if (res.ok) {
        setDocs(await res.json());
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE}/documents`, {
        method: 'POST',
        body: JSON.stringify({ type: docType, expiryDate, fileUrl })
      });
      if (res.ok) {
        loadDocs();
        setExpiryDate('');
      }
    } catch (err) {}
    setSubmitting(false);
  };

  const deleteDoc = async (id: number) => {
    if (!window.confirm('Delete this travel document?')) return;
    try {
      await authFetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
      loadDocs();
    } catch (e) {}
  };

  // Calculate metrics
  const totalDocsCount = docs.length;
  const activeDocsCount = docs.filter(d => new Date(d.expiryDate) >= new Date()).length;
  const expiringSoonCount = docs.filter(d => {
    const expiry = new Date(d.expiryDate);
    const daysLeft = Math.floor((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft < 30 && daysLeft >= 0;
  }).length;

  return (
    <div className="space-y-6 text-left animate-fade-in-up">
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-cyan-400" />
            <span>Travel Documents Vault</span>
          </h2>
          <p className="text-sm text-slate-400">Securely store and manage your passport, visa, tickets, and corporate travel certificates.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-slate-350 flex items-center gap-1.5 shadow-sm">
            <span>Total Vault Items: {totalDocsCount}</span>
          </Badge>
        </div>
      </div>

      {/* 2. Top-level stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Valid Vault Items</p>
              <h4 className="text-lg font-black text-white mt-0.5">{activeDocsCount} Active</h4>
              <p className="text-[10px] text-slate-500">Ready for border control security</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10 text-red-405">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Expiring / Expired</p>
              <h4 className="text-lg font-black text-white mt-0.5">{expiringSoonCount} Expiring Soon</h4>
              <p className="text-[10px] text-slate-500">Renewal warnings flagged</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Storage Security</p>
              <h4 className="text-lg font-black text-white mt-0.5">AES-256</h4>
              <p className="text-[10px] text-cyan-405">Compliant corporate encryption</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 12-Column Layout */}
      <div className="grid grid-cols-12 gap-8">
        {/* Upload Form - span 4 */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="hover-glow bg-slate-900/40 border border-slate-855 h-fit">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Upload Document</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Document Type</label>
                  <select 
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Expiry Date</label>
                  <Input 
                    type="date" required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white focus:border-cyan-500 text-xs"
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={submitting}
                  className="w-full text-xs font-bold btn-hover-scale mt-2"
                >
                  {submitting ? 'Uploading...' : 'Save Document Details'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Docs List Card - span 8 */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Card className="bg-slate-900/40 border border-slate-850">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Saved Travel Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {docs.length === 0 ? (
                /* Empty state check */
                <div className="text-center py-16 text-slate-550 space-y-3">
                  <FileText className="w-12 h-12 mx-auto text-slate-650" />
                  <h4 className="text-sm font-bold text-white">Vault is currently empty</h4>
                  <p className="text-xs text-slate-450 max-w-xs mx-auto">Upload digital copies of your passport or travel insurance cards to keep them accessible during security audit routing.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docs.map(doc => {
                    const expiry = new Date(doc.expiryDate);
                    const daysLeft = Math.floor((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    const isExpiringSoon = daysLeft < 30 && daysLeft >= 0;
                    const isExpired = daysLeft < 0;

                    return (
                      <div 
                        key={doc.id} 
                        className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 hover:border-cyan-500/35 transition-all bg-slate-900/60`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-extrabold text-white text-xs uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                              {doc.type}
                            </span>
                            {isExpired ? (
                              <Badge variant="destructive" className="text-[8px] uppercase">Expired</Badge>
                            ) : isExpiringSoon ? (
                              <Badge variant="destructive" className="animate-pulse text-[8px] uppercase flex items-center gap-1">
                                <BadgeAlert className="w-2.5 h-2.5" />
                                <span>Expiring ({daysLeft}d)</span>
                              </Badge>
                            ) : (
                              <Badge variant="success" className="text-[8px] uppercase">Valid</Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            Expires: <span className="font-bold text-slate-200">{doc.expiryDate}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-850">
                          <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex-1 inline-flex items-center justify-center h-8 rounded-lg border border-slate-800 bg-slate-950 px-3 text-xs font-bold text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            View PDF
                          </a>
                          <Button 
                            onClick={() => deleteDoc(doc.id)} 
                            variant="destructive" 
                            size="sm" 
                            className="h-8 w-8 p-0 shrink-0 btn-hover-scale"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/20 border border-slate-850">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-extrabold text-slate-350">Border Crossing Safety Checklist</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400 space-y-2">
              <p>• Make sure passport validation matches at least 6 months lead time before returning home.</p>
              <p>• Keep printed copies of corporate travel authorization letters for quick local customs overrides.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
