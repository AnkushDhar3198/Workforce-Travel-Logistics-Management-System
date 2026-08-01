import React, { useState, useRef, useEffect } from 'react';
import { Plane, X, Check } from 'lucide-react';
import { OFFICIAL_AIRPORTS, type Airport } from '../data/flightRegistry';

interface AirportAutocompleteInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (formattedValue: string) => void;
}

export default function AirportAutocompleteInput({
  label,
  placeholder = 'Type airport code or city (e.g. BLR, DEL, ORD, London...)',
  value,
  onChange
}: AirportAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Handle click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter airports based on search term
  const query = searchTerm.trim().toLowerCase();
  const filteredAirports = OFFICIAL_AIRPORTS.filter(ap => {
    if (!query) return true;
    return (
      ap.code.toLowerCase().includes(query) ||
      ap.name.toLowerCase().includes(query) ||
      ap.city.toLowerCase().includes(query) ||
      ap.country.toLowerCase().includes(query)
    );
  });

  const handleSelect = (airport: Airport) => {
    const formatted = `${airport.code} - ${airport.name} (${airport.country})`;
    setSearchTerm(formatted);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setSearchTerm(newVal);
    onChange(newVal);
    setIsOpen(true);

    // Auto-match exact 3-letter IATA code typed (e.g. "BLR", "DEL", "ORD")
    const exactCodeMatch = OFFICIAL_AIRPORTS.find(
      ap => ap.code.toLowerCase() === newVal.trim().toLowerCase()
    );
    if (exactCodeMatch) {
      const formatted = `${exactCodeMatch.code} - ${exactCodeMatch.name} (${exactCodeMatch.country})`;
      setSearchTerm(formatted);
      onChange(formatted);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{label}</label>
      
      <div className="relative flex items-center">
        <Plane className="w-3.5 h-3.5 absolute left-3 text-cyan-400 pointer-events-none" />
        
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md divide-y divide-slate-850 animate-fade-in">
          {filteredAirports.length > 0 ? (
            filteredAirports.map(ap => {
              const fullFormatted = `${ap.code} - ${ap.name} (${ap.country})`;
              const isSelected = value === fullFormatted;

              return (
                <div
                  key={ap.code}
                  onClick={() => handleSelect(ap)}
                  className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors hover:bg-cyan-500/10 ${
                    isSelected ? 'bg-cyan-500/15 border-l-2 border-cyan-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono font-black text-cyan-400 text-xs px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                      {ap.code}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-white truncate">
                        {ap.name} ({ap.country})
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {ap.city}, {ap.country}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                </div>
              );
            })
          ) : (
            <div className="p-3 text-xs text-slate-400 text-center">
              Custom entry "{searchTerm}". Press submit to proceed.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
