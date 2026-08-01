import React from 'react';
import { X, Printer, ExternalLink, ShieldCheck, Plane, Globe, FileCheck, Box, CheckCircle2, User, Building, QrCode } from 'lucide-react';
import { getFileUrl } from '../context/AuthContext';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: any;
}

export default function DocumentViewerModal({ isOpen, onClose, doc }: DocumentViewerModalProps) {
  if (!isOpen || !doc) return null;

  const docType = doc.type ? doc.type.toUpperCase() : 'PASSPORT';

  let details: any = {};
  if (doc.detailsJson) {
    try {
      details = JSON.parse(doc.detailsJson);
    } catch (e) {}
  }

  // -------------------------------------------------------------
  // Dynamic Extraction & Smart Deterministic Computation Per Document
  // -------------------------------------------------------------

  // 1. TICKET DYNAMICS
  const pnr = doc.docNumber || details.pnr || 'PNR-DL9842A';
  const carrier = details.carrier || doc.issuingAuthority || 'Delta Air Lines';
  const flightNo = details.flightNo || 'DL-104';
  const travelDate = doc.expiryDate || details.travelDate || '2026-08-03';

  // Dynamic Route Variations for Fallbacks if not user-specified
  const SAMPLE_ROUTES = [
    { dep: 'ORD', depCity: "CHICAGO O'HARE", arr: 'LHR', arrCity: 'LONDON HEATHROW', depTime: '10:00 AM EST', arrTime: '10:45 PM GMT', dur: '7h 45m NON-STOP' },
    { dep: 'DEL', depCity: 'NEW DELHI (DEL)', arr: 'LHR', arrCity: 'LONDON HEATHROW', depTime: '02:15 AM IST', arrTime: '07:30 AM GMT', dur: '9h 45m NON-STOP' },
    { dep: 'BOM', depCity: 'MUMBAI (BOM)', arr: 'DXB', arrCity: 'DUBAI INTL', depTime: '04:30 PM IST', arrTime: '06:15 PM GST', dur: '3h 15m NON-STOP' },
    { dep: 'JFK', depCity: 'NEW YORK (JFK)', arr: 'CDG', arrCity: 'PARIS CHARLES DE GAULLE', depTime: '06:40 PM EST', arrTime: '07:55 AM CET', dur: '7h 15m NON-STOP' },
    { dep: 'SFO', depCity: 'SAN FRANCISCO (SFO)', arr: 'HND', arrCity: 'TOKYO HANEDA', depTime: '11:20 AM PST', arrTime: '03:10 PM JST', dur: '11h 50m NON-STOP' },
    { dep: 'BLR', depCity: 'BENGALURU (BLR)', arr: 'SIN', arrCity: 'SINGAPORE CHANGI', depTime: '11:05 PM IST', arrTime: '06:10 AM SGT', dur: '4h 35m NON-STOP' }
  ];

  const pnrHash = (pnr + flightNo).split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
  const selectedFallback = SAMPLE_ROUTES[pnrHash % SAMPLE_ROUTES.length];

  // Departure & Arrival Airports / Cities
  const rawDep = details.depAirport || details.departureCity || `${selectedFallback.dep} - ${selectedFallback.depCity}`;
  const rawArr = details.arrAirport || details.arrivalCity || `${selectedFallback.arr} - ${selectedFallback.arrCity}`;

  const depParts = rawDep.split('-');
  const depCode = (depParts[0] || selectedFallback.dep).trim().toUpperCase().slice(0, 4);
  const depCityName = (depParts[1] || depParts[0] || selectedFallback.depCity).trim().toUpperCase();

  const arrParts = rawArr.split('-');
  const arrCode = (arrParts[0] || selectedFallback.arr).trim().toUpperCase().slice(0, 4);
  const arrCityName = (arrParts[1] || arrParts[0] || selectedFallback.arrCity).trim().toUpperCase();

  const seats = ['14A', '08B', '22F', '11C', '04D', '19E', '12A', '07K'];
  const seatNo = details.seatNo || seats[pnrHash % seats.length];

  const gates = ['B22', 'A14', 'C08', 'D19', 'E02', 'F11'];
  const gateNo = details.gateNo || gates[pnrHash % gates.length];

  const boardingTime = details.boardingTime || `${8 + (pnrHash % 4)}:${(pnrHash % 2 === 0 ? '15' : '45')} AM`;
  const depTime = details.depTime || selectedFallback.depTime;
  const arrTime = details.arrTime || selectedFallback.arrTime;
  const duration = selectedFallback.dur;

  // 2. PASSPORT DYNAMICS
  const passportNo = doc.docNumber || details.passportNo || 'P-984201948';
  const issuingCountry = (doc.issuingAuthority || details.issuingCountry || 'UNITED STATES').toUpperCase();
  const passportExpiry = doc.expiryDate || '2030-07-31';
  const userFullName = (doc.userName || 'BOB EMPLOYEE').toUpperCase();
  const [givenName, ...surnameParts] = userFullName.split(' ');
  const surname = surnameParts.join(' ') || 'EMPLOYEE';

  // 3. VISA DYNAMICS
  const visaNo = doc.docNumber || details.visaNumber || 'GBR-VISA-883912';
  const destCountry = (doc.issuingAuthority || details.destinationCountry || 'UNITED KINGDOM').toUpperCase();
  const visaEntryType = (details.entryType || 'MULTIPLE ENTRY').toUpperCase();
  const visaExpiry = doc.expiryDate || '2027-12-31';

  // 4. INSURANCE DYNAMICS
  const policyNo = doc.docNumber || details.policyNumber || 'AGS-992014';
  const insProvider = (doc.issuingAuthority || details.provider || 'ALLIANZ GLOBAL CORPORATE SHIELD').toUpperCase();
  const coveragePlan = details.coverageType || details.planType || 'Comprehensive Medical & Evacuation';
  const insExpiry = doc.expiryDate || '2026-12-31';

  // 5. SHIPMENT DYNAMICS
  const waybillNo = doc.docNumber || details.waybillNumber || 'FX-9842019';
  const logisticsCompany = (doc.issuingAuthority || details.carrier || details.logisticsCarrier || 'FEDEX EXPRESS FREIGHT').toUpperCase();
  const carnetNo = details.carnetNumber || details.carnetNo || 'ATA-Carnet-GB-8832';
  const shipmentExpiry = doc.expiryDate || '2026-12-31';

  // Native Direct Window Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      id="printable-wrapper" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent backdrop-blur-md animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 8mm;
          }
          body > * {
            display: none !important;
          }
          #printable-wrapper {
            display: flex !important;
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 10px !important;
            justify-content: center !important;
            align-items: flex-start !important;
            z-index: 999999 !important;
            overflow: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          #printable-document {
            display: block !important;
            width: 100% !important;
            max-width: 680px !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border-radius: 16px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-document * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div 
        className="relative w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-left mx-1 sm:mx-0"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        
        {/* Modal Top Navigation Bar */}
        <div 
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 gap-3 border-b print:hidden"
          style={{ borderBottomColor: 'var(--border-subtle)', background: 'var(--nav-hover-bg)' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 sm:p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
              {docType === 'PASSPORT' && <Globe className="w-4 h-4 sm:w-5 sm:h-5" />}
              {docType === 'TICKET' && <Plane className="w-4 h-4 sm:w-5 sm:h-5" />}
              {docType === 'VISA' && <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />}
              {docType === 'INSURANCE' && <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />}
              {docType === 'SHIPMENT_DOC' && <Box className="w-4 h-4 sm:w-5 sm:h-5" />}
            </span>
            <div>
              <h3 className="text-xs sm:text-base font-extrabold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <span>Official Document Preview</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ background: 'var(--nav-active-bg)', color: 'var(--accent-primary)', border: '1px solid var(--border-subtle)' }}>
                  {docType}
                </span>
              </h3>
              <p className="text-[10px] sm:text-xs" style={{ color: 'var(--text-secondary)' }}>Authenticated Workforce Credential</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer"
              style={{ background: 'var(--nav-hover-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">Print</span>
            </button>
            <a
              href={getFileUrl(doc.fileUrl)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">Raw Stream</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border text-slate-400 hover:text-white transition-colors ml-auto sm:ml-0"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Canvas Body */}
        <div className="p-3 sm:p-6 md:p-8 overflow-y-auto flex justify-center items-center max-w-full">
          
          {/* 1. REALISTIC DYNAMIC PASSPORT DOCUMENT */}
          {docType === 'PASSPORT' && (
            <div id="printable-document" className="w-full max-w-2xl bg-[#0f172a] rounded-2xl border-2 border-[#1e293b] p-6 md:p-8 shadow-2xl text-slate-100 relative overflow-hidden font-sans">
              <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="flex justify-between items-start border-b-2 border-amber-500/40 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
                    <Globe className="w-7 h-7 text-slate-950" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-widest text-amber-400 uppercase">{issuingCountry}</h2>
                    <p className="text-xs font-bold tracking-wider text-slate-350 uppercase">OFFICIAL PASSPORT & BORDER CLEARANCE</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">PASSPORT NO.</span>
                  <p className="text-lg font-mono font-black text-amber-300">{passportNo}</p>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6 items-center">
                <div className="col-span-12 sm:col-span-4 flex flex-col items-center">
                  <div className="relative w-32 h-40 bg-slate-900 border-2 border-amber-500/40 rounded-xl overflow-hidden shadow-inner flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-950">
                    <User className="w-20 h-20 text-slate-400 mt-2" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-amber-500/10 to-transparent pointer-events-none" />
                    <div className="absolute bottom-1 right-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded shadow">
                      BIOMETRIC
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase mt-2">Hologram Audited</span>
                </div>

                <div className="col-span-12 sm:col-span-8 space-y-3.5 text-left text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">SURNAME / NOM</span>
                      <p className="font-black text-white text-sm">{surname}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">GIVEN NAMES / PRENOMS</span>
                      <p className="font-black text-white text-sm">{givenName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">NATIONALITY / NATIONALITE</span>
                      <p className="font-bold text-amber-200">{issuingCountry}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">EMPLOYEE ID / MATRICULE</span>
                      <p className="font-mono font-bold text-white">EMP-88219</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">DATE OF EXPIRY / EXPIRATION</span>
                      <p className="font-bold text-cyan-400">{passportExpiry}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">AUTHORITY / AUTORITE</span>
                      <p className="font-bold text-slate-300">CBG GLOBAL SECURITY</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">SECURITY CLEARANCE STATUS</span>
                    <div className="mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>LEVEL-3 OVERSEAS DEPLOYMENT AUTHORIZED</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 pt-4 border-t-2 border-slate-800 font-mono text-[9px] sm:text-[11px] text-amber-400 tracking-widest bg-slate-950/80 p-2.5 sm:p-3 rounded-lg border border-slate-800 shadow-inner overflow-x-auto break-all max-w-full">
                <p className="break-all">{`P<${issuingCountry.slice(0, 3)}PASSPORT<<${surname}<<${givenName}${'<'.repeat(16)}`}</p>
                <p className="break-all">{`${passportNo.padEnd(9, 'X')}8${issuingCountry.slice(0, 3)}3007315M3007315${'<'.repeat(14)}04`}</p>
              </div>
            </div>
          )}

          {/* 2. REALISTIC DYNAMIC FLIGHT / TRANSIT E-TICKET */}
          {docType === 'TICKET' && (
            <div id="printable-document" className="w-full max-w-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950 rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden font-sans text-left">
              <div className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-slate-950">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <Plane className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950 shrink-0" />
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-wider uppercase">{carrier}</h2>
                    <p className="text-[10px] sm:text-[11px] font-bold opacity-90">BOARDING PASS & ELECTRONIC TICKET</p>
                  </div>
                </div>
                <div className="text-left sm:text-right font-mono font-black shrink-0">
                  <span className="text-[9px] sm:text-[10px] block opacity-80 uppercase">CONFIRMATION PNR</span>
                  <span className="text-sm sm:text-lg bg-slate-950 text-cyan-400 px-2.5 py-1 rounded-md shadow border border-slate-800">
                    {pnr}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-12 p-3.5 sm:p-6 gap-4 sm:gap-6 relative">
                <div className="col-span-12 md:col-span-8 space-y-6">
                  {/* Route Airport Graphic */}
                  <div className="flex justify-between items-center p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div>
                      <h3 className="text-3xl font-black text-white">{depCode}</h3>
                      <p className="text-[11px] text-slate-400 font-semibold">{depCityName}</p>
                      <p className="text-xs font-bold text-cyan-400 mt-1">{depTime}</p>
                    </div>

                    <div className="flex flex-col items-center px-4">
                      <span className="text-[10px] text-slate-400 font-bold mb-1">{duration}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-0.5 bg-cyan-500" />
                        <Plane className="w-5 h-5 text-cyan-400 transform rotate-90" />
                        <div className="w-12 h-0.5 bg-cyan-500" />
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold mt-1">CONFIRMED</span>
                    </div>

                    <div className="text-right">
                      <h3 className="text-3xl font-black text-white">{arrCode}</h3>
                      <p className="text-[11px] text-slate-400 font-semibold">{arrCityName}</p>
                      <p className="text-xs font-bold text-cyan-400 mt-1">{arrTime}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">PASSENGER NAME</span>
                      <p className="font-extrabold text-white">BOB EMPLOYEE</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">FLIGHT NUMBER</span>
                      <p className="font-mono font-extrabold text-cyan-400">{flightNo}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">TRAVEL DATE</span>
                      <p className="font-extrabold text-white">{travelDate}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">GATE</span>
                      <p className="font-black text-amber-400 text-sm">{gateNo}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">BOARDING</span>
                      <p className="font-black text-white text-sm">{boardingTime}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">SEAT</span>
                      <p className="font-mono font-black text-cyan-400 text-sm">{seatNo}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">CLASS</span>
                      <p className="font-bold text-emerald-400 text-xs">ECONOMY PLUS</p>
                    </div>
                  </div>
                </div>

                <div className="hidden md:block absolute top-0 bottom-0 left-[66.6%] border-r-2 border-dashed border-slate-800" />

                <div className="col-span-12 md:col-span-4 flex flex-col justify-between space-y-4 pl-0 md:pl-4">
                  <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">BOARDING STUB</span>
                      <span className="font-mono text-cyan-400 font-bold">{flightNo}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">PASSENGER</span>
                      <p className="font-bold text-white text-xs">BOB EMPLOYEE</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">SEAT</span>
                        <p className="font-mono font-black text-cyan-300">{seatNo}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">ZONE</span>
                        <p className="font-black text-amber-400">ZONE 2</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl flex flex-col items-center justify-center space-y-1 shadow">
                    <QrCode className="w-16 h-16 text-slate-950" />
                    <span className="text-[9px] font-mono text-slate-700 font-bold">CBG-TKT-{pnr}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. REALISTIC DYNAMIC BUSINESS VISA */}
          {docType === 'VISA' && (
            <div id="printable-document" className="w-full max-w-2xl bg-[#fffbeb] rounded-2xl border-4 border-amber-600 p-6 md:p-8 shadow-2xl text-slate-900 relative overflow-hidden font-serif">
              <div className="flex justify-between items-start border-b-2 border-amber-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <Building className="w-10 h-10 text-amber-900" />
                  <div>
                    <h2 className="text-base font-black text-amber-950 tracking-wider uppercase">{destCountry} VISAS & IMMIGRATION</h2>
                    <p className="text-xs font-bold text-amber-800 uppercase">ENTRY CLEARANCE & BUSINESS PERMIT</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[9px] font-bold text-amber-900 block">VISA NUMBER</span>
                  <span className="text-base font-black text-red-700">{visaNo}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">NAME OF HOLDER</span>
                  <p className="font-black text-slate-950 text-sm">EMPLOYEE, BOB</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">VISA CATEGORY</span>
                  <p className="font-bold text-amber-900">TIER-2 BUSINESS & NEGOTIATIONS</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">DESTINATION COUNTRY</span>
                  <p className="font-bold text-slate-900">{destCountry}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">VALID UNTIL</span>
                  <p className="font-bold text-red-700">{visaExpiry}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">NUMBER OF ENTRIES</span>
                  <p className="font-black text-emerald-800">{visaEntryType}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">SPONSOR ORGANISATION</span>
                  <p className="font-bold text-slate-900">CBG GLOBAL OPERATIONS LTD</p>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-end border-t border-amber-800/40 pt-4">
                <div className="font-mono text-[10px] text-slate-600">
                  <p>REMARKS: WORKFORCE LOGISTICS AUTHORIZED</p>
                  <p>NO PUBLIC FUNDS - STRICTLY BUSINESS PURPOSES</p>
                </div>

                <div className="w-20 h-20 border-2 border-red-700 rounded-full flex flex-col items-center justify-center text-red-700 transform -rotate-12 shadow-sm font-sans font-black text-[9px] uppercase p-1 text-center bg-red-500/10">
                  <span>IMMIGRATION</span>
                  <span className="text-[11px] font-extrabold text-red-800">STAMPED</span>
                  <span>{destCountry.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. REALISTIC DYNAMIC HEALTH INSURANCE CARD */}
          {docType === 'INSURANCE' && (
            <div id="printable-document" className="w-full max-w-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 rounded-2xl border-2 border-indigo-500/40 p-6 md:p-8 shadow-2xl text-white relative overflow-hidden font-sans text-left">
              <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-cyan-400/15 via-indigo-500/10 to-transparent rounded-full pointer-events-none" />

              <div className="flex justify-between items-start border-b border-indigo-800/80 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center shadow-lg">
                    <ShieldCheck className="w-6 h-6 text-slate-950" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white tracking-wider">{insProvider}</h2>
                    <p className="text-xs text-cyan-400 font-bold">{coveragePlan.toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">POLICY NO.</span>
                  <span className="font-mono font-black text-amber-400 text-sm">{policyNo}</span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">INSURED MEMBER</span>
                    <p className="font-extrabold text-white text-sm">BOB EMPLOYEE</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">EMPLOYEE ID</span>
                    <p className="font-mono font-bold text-cyan-300">EMP-88219</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">MEDICAL BENEFIT LIMIT</span>
                    <p className="font-black text-emerald-400 text-sm">$1,000,000.00 USD</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">POLICY EXPIRY</span>
                    <p className="font-bold text-amber-300">{insExpiry}</p>
                  </div>
                </div>

                <div className="p-3 bg-indigo-900/30 rounded-xl border border-indigo-500/30 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-indigo-300 font-bold uppercase block">24/7 GLOBAL SOS ASSISTANCE HOTLINE</span>
                    <p className="font-mono font-black text-white text-sm">+1-800-555-ALLIANZ (+1-800-555-2554)</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                    ACTIVE COVERAGE
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 5. REALISTIC DYNAMIC CUSTOMS MANIFEST */}
          {docType === 'SHIPMENT_DOC' && (
            <div id="printable-document" className="w-full max-w-2xl bg-slate-900 rounded-2xl border-2 border-slate-700 p-6 md:p-8 shadow-2xl text-slate-100 text-left font-sans">
              <div className="flex justify-between items-start border-b-2 border-slate-700 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <Box className="w-8 h-8 text-cyan-400" />
                  <div>
                    <h2 className="text-base font-black text-white tracking-wider uppercase">{logisticsCompany} / CARGO MANIFEST</h2>
                    <p className="text-xs text-slate-400 font-bold">INTERNATIONAL ATA CARNET CUSTOMS DECLARATION</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">WAYBILL / TRACKING</span>
                  <span className="font-black text-cyan-400 text-sm">{waybillNo}</span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">LOGISTICS CARRIER</span>
                    <p className="font-bold text-white">{logisticsCompany}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">ATA CARNET PERMIT NO.</span>
                    <p className="font-mono font-bold text-amber-400">{carnetNo}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-2">DECLARATION CARGO MANIFEST ITEMS</span>
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-850 text-slate-350 text-[10px] uppercase font-bold border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">ITEM DESCRIPTION</th>
                          <th className="p-2.5">QTY</th>
                          <th className="p-2.5 text-right">DECLARED VALUE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 text-slate-300">
                        <tr>
                          <td className="p-2.5 font-semibold text-white">CBG Mobile Prototypes & Telemetry Gear</td>
                          <td className="p-2.5 font-mono">2 Crates</td>
                          <td className="p-2.5 font-mono text-right text-emerald-400 font-bold">$30,000 USD</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold text-white">Field Calibration Workstations & Hardcases</td>
                          <td className="p-2.5 font-mono">1 Crate</td>
                          <td className="p-2.5 font-mono text-right text-emerald-400 font-bold">$15,000 USD</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase block">CUSTOMS STATUS</span>
                    <p className="font-bold text-white text-xs">PRE-CLEARED / PRIORITY GREEN CHANNEL DIRECT</p>
                  </div>
                  <span className="px-3 py-1 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                    PASSED
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
