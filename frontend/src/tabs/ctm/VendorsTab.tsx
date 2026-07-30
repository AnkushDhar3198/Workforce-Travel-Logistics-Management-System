import React, { useState, useEffect } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';

const VENDOR_TYPES = ['AIRLINE', 'HOTEL', 'TRANSPORT', 'LOGISTICS'];

export default function VendorsTab() {
  const { authFetch } = useAuth();
  const [vendors, setVendors] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('AIRLINE');
  const [contractTerms, setContractTerms] = useState('');
  const [performanceRating, setPerformanceRating] = useState(4.5);
  const [isPreferred] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadVendors = async () => {
    try {
      const res = await authFetch(`${API_BASE}/vendors`);
      if (res.ok) {
        setVendors(await res.json());
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE}/vendors`, {
        method: 'POST',
        body: JSON.stringify({ name, type, contractTerms, performanceRating, isPreferred })
      });
      if (res.ok) {
        loadVendors();
        setName('');
        setContractTerms('');
      }
    } catch (err) {}
    setSubmitting(false);
  };

  const deleteVendor = async (id: number) => {
    if (!window.confirm('Remove this preferred vendor?')) return;
    try {
      await authFetch(`${API_BASE}/vendors/${id}`, { method: 'DELETE' });
      loadVendors();
    } catch (e) {}
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      {/* Create form */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Register Preferred Vendor</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">Vendor Name</label>
              <Input 
                type="text" required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {VENDOR_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Rating (1-5)</label>
                <Input 
                  type="number" required min="1" max="5" step="0.1"
                  value={performanceRating}
                  onChange={(e) => setPerformanceRating(Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">Contract Terms &amp; Discounts</label>
              <textarea 
                rows={2}
                value={contractTerms}
                onChange={(e) => setContractTerms(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none"
              />
            </div>
            <Button type="submit" className="w-full">
              {submitting ? 'Registering...' : 'Register Vendor'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Vendors list */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Negotiated Preferred Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Terms</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-bold text-white">{v.name}</TableCell>
                  <TableCell className="text-cyan-400 font-semibold">{v.type}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{v.contractTerms || 'No contract terms defined'}</TableCell>
                  <TableCell className="font-bold">⭐ {v.performanceRating.toFixed(1)}</TableCell>
                  <TableCell className="text-right">
                    <Button onClick={() => deleteVendor(v.id)} variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
