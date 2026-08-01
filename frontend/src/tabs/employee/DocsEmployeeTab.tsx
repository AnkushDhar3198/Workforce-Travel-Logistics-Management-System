import React, { useState, useEffect } from 'react';
import { FileText, Trash2, BadgeAlert, Upload, ShieldCheck, Plane, FileCheck, Globe, CreditCard, Box } from 'lucide-react';
import { useAuth, API_BASE, getFileUrl } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

import DocumentViewerModal from '../../components/DocumentViewerModal';

const DOCUMENT_TYPES = [
  { id: 'PASSPORT', label: 'Passport & Border Clearance', icon: Globe },
  { id: 'VISA', label: 'Business Visa & Permits', icon: FileCheck },
  { id: 'TICKET', label: 'Flight & Transit Tickets', icon: Plane },
  { id: 'INSURANCE', label: 'Corporate Health Insurance', icon: ShieldCheck },
  { id: 'SHIPMENT_DOC', label: 'Customs & Logistics Manifest', icon: Box }
];

export default function DocsEmployeeTab() {
  const { authFetch } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [docType, setDocType] = useState('PASSPORT');
  const [expiryDate, setExpiryDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUrl, setFileUrl] = useState('/uploads/passport_bob.pdf');
  const [fileName, setFileName] = useState('');

  // Modal Viewer State
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const openViewer = (doc: any) => {
    setSelectedDoc(doc);
    setIsViewerOpen(true);
  };

  // Dynamic Document Specific Form Fields
  // Passport
  const [passportNo, setPassportNo] = useState('');
  const [issuingCountry, setIssuingCountry] = useState('United States');

  // Visa
  const [visaNumber, setVisaNumber] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('United Kingdom');
  const [entryType, setEntryType] = useState('Multiple Entry');

  // Ticket
  const [pnr, setPnr] = useState('');
  const [carrier, setCarrier] = useState('Delta Air Lines');
  const [flightNo, setFlightNo] = useState('');
  const [departureCity, setDepartureCity] = useState('ORD - Chicago');
  const [arrivalCity, setArrivalCity] = useState('LHR - London');

  // Insurance
  const [policyNumber, setPolicyNumber] = useState('');
  const [provider, setProvider] = useState('Allianz Corporate Shield');
  const [coverageType, setCoverageType] = useState('Comprehensive Medical & Evacuation');

  // Shipment Doc
  const [waybillNumber, setWaybillNumber] = useState('');
  const [logisticsCarrier, setLogisticsCarrier] = useState('FedEx Logistics');
  const [carnetNumber, setCarnetNumber] = useState('');

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

  const handleDocTypeChange = (newType: string) => {
    setDocType(newType);
    if (newType === 'PASSPORT') {
      setFileUrl('/uploads/passport_bob.pdf');
    } else if (newType === 'VISA') {
      setFileUrl('/uploads/visa_uk_bob.pdf');
    } else {
      setFileUrl(`/uploads/${newType.toLowerCase()}_bob.pdf`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setFileName(file.name);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch(`${API_BASE}/expenses/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setFileUrl(data.url);
      }
    } catch (err) {}
    setUploadingFile(false);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let docNum = '';
    let authority = '';
    let detailsObj: any = {};

    if (docType === 'PASSPORT') {
      docNum = passportNo || 'P-984201948';
      authority = issuingCountry;
      detailsObj = { passportNo: docNum, issuingCountry, clearanceLevel: 'Level-3 Overseas Deployment' };
    } else if (docType === 'VISA') {
      docNum = visaNumber || 'GBR-VISA-883912';
      authority = destinationCountry;
      detailsObj = { visaNumber: docNum, destinationCountry, entryType };
    } else if (docType === 'TICKET') {
      docNum = pnr || 'PNR-DL9842';
      authority = carrier;
      detailsObj = { pnr: docNum, carrier, flightNo: flightNo || 'DL-104', depAirport: departureCity, arrAirport: arrivalCity };
    } else if (docType === 'INSURANCE') {
      docNum = policyNumber || 'AGS-992014';
      authority = provider;
      detailsObj = { policyNumber: docNum, provider, coverageType };
    } else if (docType === 'SHIPMENT_DOC') {
      docNum = waybillNumber || 'FX-9842019';
      authority = logisticsCarrier;
      detailsObj = { waybillNumber: docNum, carrier: logisticsCarrier, carnetNumber: carnetNumber || 'ATA-Carnet-GB-8832' };
    }

    try {
      const res = await authFetch(`${API_BASE}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          type: docType,
          expiryDate: expiryDate || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
          fileUrl,
          docNumber: docNum,
          issuingAuthority: authority,
          detailsJson: JSON.stringify(detailsObj)
        })
      });
      if (res.ok) {
        loadDocs();
        setPassportNo('');
        setVisaNumber('');
        setPnr('');
        setPolicyNumber('');
        setWaybillNumber('');
        setFileName('');
        alert('Document saved successfully to Travel Vault!');
      }
    } catch (err) {}
    setSubmitting(false);
  };

  const deleteDoc = async (id: number) => {
    if (!window.confirm('Delete this travel document from your vault?')) return;
    try {
      await authFetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
      loadDocs();
    } catch (e) {}
  };

  // Metrics
  const totalDocsCount = docs.length;
  const activeDocsCount = docs.filter(d => !d.expiryDate || new Date(d.expiryDate) >= new Date()).length;
  const expiringSoonCount = docs.filter(d => {
    if (!d.expiryDate) return false;
    const expiry = new Date(d.expiryDate);
    const daysLeft = Math.floor((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft < 30 && daysLeft >= 0;
  }).length;

  return (
    <div className="space-y-6 text-left animate-fade-in-up">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-cyan-400" />
            <span>Travel Documents Vault</span>
          </h2>
          <p className="text-sm text-slate-400">Manage passports, business visas, flight tickets, corporate insurance, and customs manifests with dynamic document validation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="px-3 py-1.5 bg-slate-900/85 border-slate-800 text-slate-350 flex items-center gap-1.5 shadow-sm">
            <span>Total Vault Items: {totalDocsCount}</span>
          </Badge>
        </div>
      </div>

      {/* 2. Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
              <FileCheck className="w-6 h-6" />
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
              <BadgeAlert className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-455 font-bold uppercase tracking-wider">Expiring / Expired</p>
              <h4 className="text-lg font-black text-white mt-0.5">{expiringSoonCount} Flagged</h4>
              <p className="text-[10px] text-slate-500">Renewal warnings active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate bg-slate-900/40 border border-slate-850">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Storage Encryption</p>
              <h4 className="text-lg font-black text-white mt-0.5">AES-256</h4>
              <p className="text-[10px] text-cyan-405">Corporate compliance vault</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. 12-Column Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Upload Form - span 5 */}
        <div className="col-span-12 lg:col-span-5">
          <Card className="hover-glow bg-slate-900/40 border border-slate-855 h-fit">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350 flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload Document</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* Document Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Select Document Type</label>
                  <select 
                    value={docType}
                    onChange={(e) => handleDocTypeChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {DOCUMENT_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Input Fields Based on Document Type */}
                {docType === 'PASSPORT' && (
                  <div className="space-y-3 p-3.5 bg-slate-950/40 rounded-xl border border-slate-850 animate-fade-in">
                    <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Passport Details</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Passport Number</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. P-984201948"
                        value={passportNo}
                        onChange={(e) => setPassportNo(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Issuing Country</label>
                      <select 
                        value={issuingCountry}
                        onChange={(e) => setIssuingCountry(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Germany">Germany</option>
                        <option value="Singapore">Singapore</option>
                        <option value="India">India</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Passport Expiry Date *</label>
                      <Input 
                        type="date" required
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {docType === 'VISA' && (
                  <div className="space-y-3 p-3.5 bg-slate-950/40 rounded-xl border border-slate-850 animate-fade-in">
                    <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Business Visa Credentials</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Visa / Permit Number</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. GBR-VISA-883912"
                        value={visaNumber}
                        onChange={(e) => setVisaNumber(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Destination Country / Region</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. United Kingdom / Schengen Zone"
                        value={destinationCountry}
                        onChange={(e) => setDestinationCountry(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Entry Permit Type</label>
                      <select 
                        value={entryType}
                        onChange={(e) => setEntryType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Multiple Entry">Multiple Entry (Corporate)</option>
                        <option value="Single Entry">Single Entry</option>
                        <option value="Transit Permit">Transit Permit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Visa Validity Expiry *</label>
                      <Input 
                        type="date" required
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {docType === 'TICKET' && (
                  <div className="space-y-3 p-3.5 bg-slate-950/40 rounded-xl border border-slate-850 animate-fade-in">
                    <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5" />
                      <span>Ticket & Itinerary Reference</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">PNR / Booking Reference</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. PNR-DL9842"
                        value={pnr}
                        onChange={(e) => setPnr(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Carrier / Transport</label>
                        <Input 
                          type="text" 
                          placeholder="e.g. Delta Air Lines"
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Flight / Train No.</label>
                        <Input 
                          type="text" 
                          placeholder="e.g. DL-104"
                          value={flightNo}
                          onChange={(e) => setFlightNo(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-white text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Departure Airport / City</label>
                        <Input 
                          type="text" 
                          placeholder="e.g. DEL - New Delhi"
                          value={departureCity}
                          onChange={(e) => setDepartureCity(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Arrival Airport / City</label>
                        <Input 
                          type="text" 
                          placeholder="e.g. LHR - London"
                          value={arrivalCity}
                          onChange={(e) => setArrivalCity(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-white text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Travel Date / Valid Until</label>
                      <Input 
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {docType === 'INSURANCE' && (
                  <div className="space-y-3 p-3.5 bg-slate-950/40 rounded-xl border border-slate-850 animate-fade-in">
                    <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Corporate Health Insurance</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Policy Number</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. AGS-992014"
                        value={policyNumber}
                        onChange={(e) => setPolicyNumber(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Insurance Provider</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. Allianz Global Corporate Shield"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Coverage Plan Type</label>
                      <select 
                        value={coverageType}
                        onChange={(e) => setCoverageType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Comprehensive Medical & Evacuation">Comprehensive Medical & Evacuation ($1M)</option>
                        <option value="Standard Corporate Shield">Standard Corporate Shield ($500K)</option>
                        <option value="High Risk Zone Emergency Protocol">High Risk Zone Emergency Protocol</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Policy Expiry Date *</label>
                      <Input 
                        type="date" required
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {docType === 'SHIPMENT_DOC' && (
                  <div className="space-y-3 p-3.5 bg-slate-950/40 rounded-xl border border-slate-850 animate-fade-in">
                    <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5" />
                      <span>Logistics & Customs Manifest</span>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tracking / Waybill Number</label>
                      <Input 
                        type="text" 
                        placeholder="e.g. FX-9842019"
                        value={waybillNumber}
                        onChange={(e) => setWaybillNumber(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Carrier</label>
                        <select 
                          value={logisticsCarrier}
                          onChange={(e) => setLogisticsCarrier(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none"
                        >
                          <option value="FedEx Logistics">FedEx Logistics</option>
                          <option value="DHL Express">DHL Express</option>
                          <option value="UPS Freight">UPS Freight</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Customs Carnet No.</label>
                        <Input 
                          type="text" 
                          placeholder="e.g. ATA-Carnet-GB-8832"
                          value={carnetNumber}
                          onChange={(e) => setCarnetNumber(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-white text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Manifest Valid Until</label>
                      <Input 
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* File Attachment Upload Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Attach Document PDF / Image Copy (Optional)</label>
                  <input 
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-600/10 file:text-cyan-400 hover:file:bg-cyan-600/20 file:cursor-pointer"
                  />
                  {uploadingFile && <p className="text-[10px] text-cyan-400 mt-1 animate-pulse font-semibold">Uploading document attachment to vault...</p>}
                  {fileName && <p className="text-[10px] text-slate-400 mt-1">Attached: <span className="text-white font-bold">{fileName}</span></p>}
                </div>

                <Button 
                  type="submit"
                  disabled={submitting}
                  className="w-full text-xs font-bold btn-hover-scale mt-2"
                >
                  {submitting ? 'Saving Document...' : 'Save Document to Vault'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Docs List - span 7 */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <Card className="bg-slate-900/40 border border-slate-850">
            <CardHeader className="border-b border-slate-850 pb-3 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-350">
                Saved Travel Documents Vault
              </CardTitle>
            </CardHeader>
            <CardContent>
              {docs.length === 0 ? (
                <div className="text-center py-16 text-slate-550 space-y-3">
                  <FileText className="w-12 h-12 mx-auto text-slate-650" />
                  <h4 className="text-sm font-bold text-white">Vault is currently empty</h4>
                  <p className="text-xs text-slate-450 max-w-xs mx-auto">Upload digital copies of your passport, visas, or flight tickets to keep them accessible during security audit routing.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docs.map(doc => {
                    const expiry = doc.expiryDate ? new Date(doc.expiryDate) : null;
                    const daysLeft = expiry ? Math.floor((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 999;
                    const isExpiringSoon = daysLeft < 30 && daysLeft >= 0;
                    const isExpired = daysLeft < 0;

                    let details: any = {};
                    if (doc.detailsJson) {
                      try { details = JSON.parse(doc.detailsJson); } catch (e) {}
                    }

                    return (
                      <div 
                        key={doc.id} 
                        className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 hover:border-cyan-500/35 transition-all bg-slate-900/60`}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-extrabold text-cyan-400 text-xs uppercase tracking-wider bg-slate-950 px-2.5 py-1 rounded border border-slate-850 flex items-center gap-1.5">
                              {doc.type === 'PASSPORT' && <Globe className="w-3 h-3 text-cyan-400" />}
                              {doc.type === 'VISA' && <FileCheck className="w-3 h-3 text-cyan-400" />}
                              {doc.type === 'TICKET' && <Plane className="w-3 h-3 text-cyan-400" />}
                              {doc.type === 'INSURANCE' && <ShieldCheck className="w-3 h-3 text-cyan-400" />}
                              {doc.type === 'SHIPMENT_DOC' && <Box className="w-3 h-3 text-cyan-400" />}
                              <span>{doc.type}</span>
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

                          {/* Specific Document Details */}
                          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-850/80 space-y-1 text-xs">
                            {doc.docNumber && (
                              <div className="font-bold text-white flex justify-between">
                                <span className="text-slate-450 font-normal">Ref Number:</span>
                                <span className="font-mono text-cyan-300">{doc.docNumber}</span>
                              </div>
                            )}
                            {doc.issuingAuthority && (
                              <div className="text-slate-300 flex justify-between">
                                <span className="text-slate-450">Authority / Country:</span>
                                <span className="font-semibold text-slate-200">{doc.issuingAuthority}</span>
                              </div>
                            )}
                            {details.entryType && (
                              <div className="text-slate-300 flex justify-between">
                                <span className="text-slate-450">Permit Type:</span>
                                <span className="text-slate-200">{details.entryType}</span>
                              </div>
                            )}
                            {details.pnr && (
                              <div className="text-slate-300 flex justify-between">
                                <span className="text-slate-450">PNR / Flight:</span>
                                <span className="text-slate-200">{details.pnr} ({details.flightNo || ''})</span>
                              </div>
                            )}
                            {details.provider && (
                              <div className="text-slate-300 flex justify-between">
                                <span className="text-slate-450">Provider:</span>
                                <span className="text-slate-200">{details.provider}</span>
                              </div>
                            )}
                            {doc.expiryDate && (
                              <div className="text-slate-450 flex justify-between pt-1 border-t border-slate-900 text-[11px]">
                                <span>Expiration Date:</span>
                                <span className="font-bold text-slate-200">{doc.expiryDate}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-850">
                          <button 
                            onClick={() => openViewer(doc)}
                            className="flex-1 inline-flex items-center justify-center h-8 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                          >
                            View Document PDF
                          </button>
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
              <CardTitle className="text-xs uppercase font-extrabold text-slate-350">Border Control & Vault Protocol</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400 space-y-2">
              <p>• Passport validity must exceed 6 months from the date of entry for international clearance.</p>
              <p>• Multi-entry business visas require active corporate authorization letters linked to travel request IDs.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interactive Document Specific Preview Modal */}
      <DocumentViewerModal 
        isOpen={isViewerOpen} 
        onClose={() => setIsViewerOpen(false)} 
        doc={selectedDoc} 
      />
    </div>
  );
}
