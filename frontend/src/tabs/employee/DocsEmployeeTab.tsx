import React, { useState, useEffect } from 'react';
import { FileText, Trash2, BadgeAlert } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
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
  const [fileUrl] = useState('http://localhost:8080/uploads/bob_docs.pdf');
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      {/* Upload card */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
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
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
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
              />
            </div>
            <Button 
              type="submit"
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Uploading...' : 'Save Document Details'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Docs List */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Saved Travel Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {docs.map(doc => {
            const expiry = new Date(doc.expiryDate);
            const daysLeft = Math.floor((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const isExpiringSoon = daysLeft < 30 && daysLeft >= 0;

            return (
              <div key={doc.id} className="flex justify-between items-center p-4 bg-slate-900/40 border border-slate-850 rounded-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">{doc.type}</span>
                    {isExpiringSoon && (
                      <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
                        <BadgeAlert className="w-3.5 h-3.5" />
                        <span>Expiring Soon ({daysLeft} days)</span>
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">Expires: <span className="font-semibold text-slate-300">{doc.expiryDate}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-8 rounded border border-slate-800 bg-transparent px-3 text-xs font-semibold text-slate-300 shadow-sm hover:bg-slate-800 hover:text-slate-100 transition-colors">View Document</a>
                  <Button onClick={() => deleteDoc(doc.id)} variant="destructive" size="sm" className="h-8 py-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
