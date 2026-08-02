import React, { useState, useEffect } from 'react';
import { FileText, Trash2, BadgeAlert, Upload, ShieldCheck, Plane, FileCheck, Globe, CreditCard, Box } from 'lucide-react';
import { useAuth, API_BASE, getFileUrl } from '../../context/AuthContext';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import AirportAutocompleteInput from '../../components/AirportAutocompleteInput';
import DatePicker from '../../components/DatePicker';
import { 
  validatePNR, 
  validateAirline, 
  OFFICIAL_AIRLINES, 
  OFFICIAL_AIRPORTS, 
  VERIFIED_FLIGHT_SCHEDULES 
} from '../../data/flightRegistry';

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
  const [fileUrl, setFileUrl] = useState('/uploads/passport_doc.pdf');
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
    setFileUrl(`/uploads/${newType.toLowerCase()}_doc.pdf`);
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
      docNum = (pnr || 'PNR-DL9842A').trim();
      authority = (carrier || 'Delta Air Lines').trim();

      // 1. Strict PNR Validation Check
      const pnrCheck = validatePNR(docNum);
      if (!pnrCheck.isValid) {
        alert(pnrCheck.message);
        setSubmitting(false);
        return;
      }

      // 2. Strict Accredited Airline Validation Check
      const airlineCheck = validateAirline(authority);
      if (!airlineCheck.isValid) {
        alert(airlineCheck.message);
        setSubmitting(false);
        return;
      }

      if (airlineCheck.matchedAirline) {
        authority = airlineCheck.matchedAirline.name;
      }

      detailsObj = { 
        pnr: docNum, 
        carrier: authority, 
        flightNo: flightNo || 'DL-104', 
        depAirport: departureCity, 
        arrAirport: arrivalCity 
      };
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in-up">
      {/* 1. Page Header */}
      <div className="v-page-header" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="v-page-title">
            <FileText size={24} style={{ color: 'var(--accent-primary)' }} />
            Travel Documents Vault
          </h2>
          <p className="v-page-subtitle">Manage passports, business visas, flight tickets, corporate insurance, and customs manifests.</p>
        </div>
        <span className="v-badge v-badge-accent">Total Vault Items: {totalDocsCount}</span>
      </div>

      {/* 2. Top Stats — Apple-style cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <div className="v-stat">
          <div className="v-stat-icon"><FileCheck size={22} /></div>
          <div>
            <p className="v-stat-label">Valid Vault Items</p>
            <p className="v-stat-value">{activeDocsCount} Active</p>
            <p className="v-stat-desc">Ready for border control security</p>
          </div>
        </div>

        <div className="v-stat">
          <div className="v-stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>
            <BadgeAlert size={22} />
          </div>
          <div>
            <p className="v-stat-label">Expiring / Expired</p>
            <p className="v-stat-value">{expiringSoonCount} Flagged</p>
            <p className="v-stat-desc">Renewal warnings active</p>
          </div>
        </div>

        <div className="v-stat">
          <div className="v-stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-secondary)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="v-stat-label">Storage Encryption</p>
            <p className="v-stat-value">AES-256</p>
            <p className="v-stat-desc" style={{ color: 'var(--accent-primary)' }}>Corporate compliance vault</p>
          </div>
        </div>
      </div>

      {/* 3. Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="lg-grid-12">
        {/* Upload Form Card */}
        <div style={{ gridColumn: 'span 5' }}>
          <div className="v-card">
            <div className="v-card-header">
              <h3 className="v-card-title">
                <Upload size={15} style={{ color: 'var(--accent-primary)' }} />
                Upload Document
              </h3>
            </div>
            <div className="v-card-body">
              <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Document Type Selection */}
                <div>
                  <label className="v-label">Select Document Type</label>
                  <select 
                    value={docType}
                    onChange={(e) => handleDocTypeChange(e.target.value)}
                    className="v-select"
                  >
                    {DOCUMENT_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Input Fields Based on Document Type */}
                {docType === 'PASSPORT' && (
                  <div className="v-section dropdown-enter" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="v-section-header">
                      <Globe size={14} />
                      <span>Passport Details</span>
                    </div>
                    <div>
                      <label className="v-label">Passport Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. P-984201948"
                        value={passportNo}
                        onChange={(e) => setPassportNo(e.target.value)}
                        className="v-input"
                      />
                    </div>
                    <div>
                      <label className="v-label">Issuing Country</label>
                      <select 
                        value={issuingCountry}
                        onChange={(e) => setIssuingCountry(e.target.value)}
                        className="v-select"
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
                      <DatePicker
                        label="Passport Expiry Date *"
                        value={expiryDate}
                        onChange={(val) => setExpiryDate(val)}
                        required
                      />
                    </div>
                  </div>
                )}

                {docType === 'VISA' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
                    <div>
                      <label className="v-label">Visa / Permit Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. GBR-VISA-883912"
                        value={visaNumber}
                        onChange={(e) => setVisaNumber(e.target.value)}
                        className="v-input"
                      />
                    </div>
                    <div>
                      <label className="v-label">Destination Country / Region</label>
                      <input 
                        type="text" 
                        placeholder="e.g. United Kingdom / Schengen Zone"
                        value={destinationCountry}
                        onChange={(e) => setDestinationCountry(e.target.value)}
                        className="v-input"
                      />
                    </div>
                    <div>
                      <label className="v-label">Entry Permit Type</label>
                      <select 
                        value={entryType}
                        onChange={(e) => setEntryType(e.target.value)}
                        className="v-select"
                      >
                        <option value="Multiple Entry">Multiple Entry (Corporate)</option>
                        <option value="Single Entry">Single Entry</option>
                        <option value="Transit Permit">Transit Permit</option>
                      </select>
                    </div>
                    <div>
                      <DatePicker
                        label="Visa Validity Expiry *"
                        value={expiryDate}
                        onChange={(val) => setExpiryDate(val)}
                        required
                      />
                    </div>
                  </div>
                )}

                {docType === 'TICKET' && (
                  <div className="v-section dropdown-enter" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="v-section-header" style={{ justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plane size={14} />
                        <span>Ticket & Itinerary Validation</span>
                      </span>
                      <span className="v-badge v-badge-success" style={{ fontSize: '8px' }}>IATA Accredited</span>
                    </div>

                    {/* Pre-loaded Real Flight Schedule Quick Picker */}
                    <div>
                      <label className="v-label">Quick Select Verified Flight Schedule</label>
                      <select 
                        onChange={(e) => {
                          const sched = VERIFIED_FLIGHT_SCHEDULES.find(s => s.flightNo === e.target.value);
                          if (sched) {
                            setCarrier(sched.airlineName);
                            setFlightNo(sched.flightNo);
                            setDepartureCity(`${sched.depCode} - ${sched.depName}`);
                            setArrivalCity(`${sched.arrCode} - ${sched.arrName}`);
                            if (!pnr) setPnr(`PNR-${sched.airlineCode}9842A`);
                          }
                        }}
                        className="v-select"
                      >
                        <option value="">-- Choose verified flight schedule (Optional) --</option>
                        {VERIFIED_FLIGHT_SCHEDULES.map(s => (
                          <option key={s.flightNo} value={s.flightNo}>
                            {s.airlineName} ({s.flightNo}) : {s.depCode} ✈ {s.arrCode} ({s.duration})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="v-label">PNR / Booking Reference (5-12 Alphanumeric)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. PNR-DL9842A or VSX23PJ7384"
                        value={pnr}
                        onChange={(e) => setPnr(e.target.value)}
                        className="v-input v-input-mono"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="v-label">Carrier Airline</label>
                        <select 
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                          className="v-select"
                        >
                          {OFFICIAL_AIRLINES.map(a => (
                            <option key={a.code} value={a.name}>{a.name} ({a.code})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="v-label">Flight Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. DL-104 or 6E-9842"
                          value={flightNo}
                          onChange={(e) => setFlightNo(e.target.value)}
                          className="v-input v-input-mono"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <AirportAutocompleteInput
                        label="Departure Airport / City"
                        placeholder="e.g. BLR, DEL, ORD, London..."
                        value={departureCity}
                        onChange={(val) => setDepartureCity(val)}
                      />
                      <AirportAutocompleteInput
                        label="Arrival Airport / City"
                        placeholder="e.g. LHR, DXB, BOM, Paris..."
                        value={arrivalCity}
                        onChange={(val) => setArrivalCity(val)}
                      />
                    </div>

                    <div>
                      <label className="v-label">Travel Date / Valid Until</label>
                      <input 
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="v-input"
                      />
                    </div>
                  </div>
                )}

                {docType === 'INSURANCE' && (
                  <div className="v-section dropdown-enter" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="v-section-header">
                      <ShieldCheck size={14} />
                      <span>Corporate Health Insurance</span>
                    </div>
                    <div>
                      <label className="v-label">Policy Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. AGS-992014"
                        value={policyNumber}
                        onChange={(e) => setPolicyNumber(e.target.value)}
                        className="v-input"
                      />
                    </div>
                    <div>
                      <label className="v-label">Insurance Provider</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Allianz Global Corporate Shield"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="v-input"
                      />
                    </div>
                    <div>
                      <label className="v-label">Coverage Plan Type</label>
                      <select 
                        value={coverageType}
                        onChange={(e) => setCoverageType(e.target.value)}
                        className="v-select"
                      >
                        <option value="Comprehensive Medical & Evacuation">Comprehensive Medical & Evacuation ($1M)</option>
                        <option value="Standard Corporate Shield">Standard Corporate Shield ($500K)</option>
                        <option value="High Risk Zone Emergency Protocol">High Risk Zone Emergency Protocol</option>
                      </select>
                    </div>
                    <div>
                      <label className="v-label">Policy Expiry Date *</label>
                      <input 
                        type="date" required
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="v-input"
                      />
                    </div>
                  </div>
                )}

                {docType === 'SHIPMENT_DOC' && (
                  <div className="v-section dropdown-enter" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="v-section-header">
                      <Box size={14} />
                      <span>Logistics & Customs Manifest</span>
                    </div>
                    <div>
                      <label className="v-label">Tracking / Waybill Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. FX-9842019"
                        value={waybillNumber}
                        onChange={(e) => setWaybillNumber(e.target.value)}
                        className="v-input"
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="v-label">Carrier</label>
                        <select 
                          value={logisticsCarrier}
                          onChange={(e) => setLogisticsCarrier(e.target.value)}
                          className="v-select"
                        >
                          <option value="FedEx Logistics">FedEx Logistics</option>
                          <option value="DHL Express">DHL Express</option>
                          <option value="UPS Freight">UPS Freight</option>
                        </select>
                      </div>
                      <div>
                        <label className="v-label">Customs Carnet No.</label>
                        <input 
                          type="text" 
                          placeholder="e.g. ATA-Carnet-GB-8832"
                          value={carnetNumber}
                          onChange={(e) => setCarnetNumber(e.target.value)}
                          className="v-input"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="v-label">Manifest Valid Until</label>
                      <input 
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="v-input"
                      />
                    </div>
                  </div>
                )}

                {/* File Attachment Upload Selector */}
                <div>
                  <label className="v-label">Attach Document PDF / Image Copy (Optional)</label>
                  <input 
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="v-file-input"
                  />
                  {uploadingFile && <p style={{ fontSize: '10px', color: 'var(--accent-primary)', marginTop: '6px', fontWeight: 600 }} className="animate-pulse">Uploading document attachment to vault...</p>}
                  {fileName && <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>Attached: <strong style={{ color: 'var(--text-primary)' }}>{fileName}</strong></p>}
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  className="v-btn"
                  style={{ marginTop: '4px' }}
                >
                  {submitting ? 'Saving Document...' : 'Save Document to Vault'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Docs List Card */}
        <div style={{ gridColumn: 'span 7' }}>
          <div className="v-card" style={{ marginBottom: '16px' }}>
            <div className="v-card-header">
              <h3 className="v-card-title">Saved Travel Documents Vault</h3>
            </div>
            <div className="v-card-body">
              {docs.length === 0 ? (
                <div className="v-empty">
                  <FileText className="v-empty-icon" />
                  <h4 className="v-empty-title">Vault is currently empty</h4>
                  <p className="v-empty-text">Upload digital copies of your passport, visas, or flight tickets to keep them accessible during security audit routing.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
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
                      <div key={doc.id} className="v-doc-card">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <span className="v-badge v-badge-accent">
                              {doc.type === 'PASSPORT' && <Globe size={10} />}
                              {doc.type === 'VISA' && <FileCheck size={10} />}
                              {doc.type === 'TICKET' && <Plane size={10} />}
                              {doc.type === 'INSURANCE' && <ShieldCheck size={10} />}
                              {doc.type === 'SHIPMENT_DOC' && <Box size={10} />}
                              {doc.type}
                            </span>
                            {isExpired ? (
                              <span className="v-badge v-badge-danger">Expired</span>
                            ) : isExpiringSoon ? (
                              <span className="v-badge v-badge-warning" style={{ animation: 'pulse-ring 2s infinite' }}>
                                <BadgeAlert size={9} />
                                Expiring ({daysLeft}d)
                              </span>
                            ) : (
                              <span className="v-badge v-badge-success">Valid</span>
                            )}
                          </div>

                          {/* Specific Document Details */}
                          <div className="v-section" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {doc.docNumber && (
                              <div className="v-detail-row">
                                <span className="v-detail-label">Ref Number:</span>
                                <span className="v-detail-value-mono">{doc.docNumber}</span>
                              </div>
                            )}
                            {doc.issuingAuthority && (
                              <div className="v-detail-row">
                                <span className="v-detail-label">Authority / Country:</span>
                                <span className="v-detail-value">{doc.issuingAuthority}</span>
                              </div>
                            )}
                            {details.entryType && (
                              <div className="v-detail-row">
                                <span className="v-detail-label">Permit Type:</span>
                                <span className="v-detail-value">{details.entryType}</span>
                              </div>
                            )}
                            {details.pnr && (
                              <div className="v-detail-row">
                                <span className="v-detail-label">PNR / Flight:</span>
                                <span className="v-detail-value">{details.pnr} ({details.flightNo || ''})</span>
                              </div>
                            )}
                            {details.provider && (
                              <div className="v-detail-row">
                                <span className="v-detail-label">Provider:</span>
                                <span className="v-detail-value">{details.provider}</span>
                              </div>
                            )}
                            {doc.expiryDate && (
                              <>
                                <hr className="v-divider" style={{ margin: '4px 0' }} />
                                <div className="v-detail-row">
                                  <span className="v-detail-label">Expiration Date:</span>
                                  <span className="v-detail-value">{doc.expiryDate}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                          <button 
                            onClick={() => openViewer(doc)}
                            className="v-btn-ghost"
                            style={{ flex: 1, fontSize: '11px' }}
                          >
                            View Document PDF
                          </button>
                          <button 
                            onClick={() => deleteDoc(doc.id)} 
                            className="v-btn-danger"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="v-info-card">
            <h4 className="v-info-title">Border Control & Vault Protocol</h4>
            <p className="v-info-text">
              • Passport validity must exceed 6 months from the date of entry for international clearance.<br />
              • Multi-entry business visas require active corporate authorization letters linked to travel request IDs.
            </p>
          </div>
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
