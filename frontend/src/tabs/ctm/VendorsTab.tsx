import React, { useState, useEffect } from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';

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

  // Calculations for CTM metrics
  const totalVendorsCount = vendors.length;
  const avgPerformanceRating = vendors.length > 0 
    ? (vendors.reduce((sum, v) => sum + v.performanceRating, 0) / vendors.length).toFixed(1)
    : '0.0';
  const leaderboardVendors = [...vendors]
    .sort((a, b) => b.performanceRating - a.performanceRating)
    .slice(0, 3);

  return (
    <div className="space-y-6 text-left animate-fade-in-up">
      {/* 1. Page Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-cyan-400" />
            <span>Preferred Vendor Directory</span>
          </h2>
          <p className="text-sm text-slate-400">Configure global travel partners, monitor SLAs, and audit pricing contract compliance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-slate-355 flex items-center gap-1.5 shadow-sm">
            <span>Corporate Partners Locked: {totalVendorsCount}</span>
          </Badge>
        </div>
      </div>

      {/* 2. Top-level summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Active Vendors</p>
              <h4 className="text-lg font-black text-white mt-0.5">{totalVendorsCount} Registered</h4>
              <p className="text-[10px] text-slate-500">Locked negotiated rates active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-405">
              <span className="text-lg font-extrabold">⭐</span>
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Avg Partner Rating</p>
              <h4 className="text-lg font-black text-white mt-0.5">{avgPerformanceRating} / 5.0</h4>
              <p className="text-[10px] text-slate-500">Quality of Service (QoS) average</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <span className="text-lg font-extrabold">💵</span>
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Negotiated Savings</p>
              <h4 className="text-lg font-black text-white mt-0.5">14.6% saved</h4>
              <p className="text-[10px] text-cyan-450">Compliance vs off-policy options</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 12-Column Responsive Layout Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Create form card - span 4 */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="hover-glow bg-slate-900/40 border border-slate-850 h-fit">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Register Preferred Vendor
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
                    className="bg-slate-950 border-slate-800 text-white focus:border-cyan-500 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">Type</label>
                    <select 
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
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
                      className="bg-slate-950 border-slate-800 text-white focus:border-cyan-500 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Contract Terms &amp; Discounts</label>
                  <textarea 
                    rows={2}
                    value={contractTerms}
                    onChange={(e) => setContractTerms(e.target.value)}
                    placeholder="Describe negotiated corporate savings..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
                <Button type="submit" className="w-full text-xs font-bold btn-hover-scale">
                  {submitting ? 'Registering...' : 'Register Vendor'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Leaderboard Card List with Rating bars */}
          <Card className="bg-slate-900/40 border border-slate-850">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Vendor SLA Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {leaderboardVendors.length === 0 ? (
                <div className="text-xs text-slate-550 text-center py-4">No rated vendors logged yet.</div>
              ) : (
                leaderboardVendors.map((v, index) => (
                  <div key={v.id} className="space-y-1.5 p-2 bg-slate-950/20 border border-slate-850 rounded-lg text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-white">
                        {index + 1}. {v.name}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-bold uppercase">{v.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Horizontal progress bar representing rating */}
                      <div className="flex-1 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" 
                          style={{ width: `${(v.performanceRating / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-[10px] text-white shrink-0">⭐ {v.performanceRating.toFixed(1)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vendor list table - span 8 */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="bg-slate-900/40 border border-slate-850">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Negotiated Preferred Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vendors.length === 0 ? (
                <div className="text-center py-12 text-slate-550 space-y-2">
                  <p className="text-xs">No corporate vendors registered.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold text-slate-400">Name</TableHead>
                      <TableHead className="text-xs font-bold text-slate-400">Type</TableHead>
                      <TableHead className="text-xs font-bold text-slate-400">Terms</TableHead>
                      <TableHead className="text-xs font-bold text-slate-400">Performance</TableHead>
                      <TableHead className="text-xs font-bold text-slate-400 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map(v => (
                      <TableRow key={v.id} className="hover:bg-slate-900/30">
                        <TableCell className="font-bold text-white text-xs">{v.name}</TableCell>
                        <TableCell className="text-cyan-400 font-semibold text-xs">{v.type}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">{v.contractTerms || 'No contract terms defined'}</TableCell>
                        <TableCell className="font-bold text-xs">⭐ {v.performanceRating.toFixed(1)}</TableCell>
                        <TableCell className="text-right text-xs">
                          <Button onClick={() => deleteVendor(v.id)} variant="ghost" size="sm" className="btn-hover-scale p-1">
                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
