import React, { useState, useRef, useEffect } from 'react';
import { Plane, X, Check, Globe, Sparkles } from 'lucide-react';
import { OFFICIAL_AIRPORTS, findOrGenerateAirport, type Airport } from '../data/flightRegistry';

interface AirportAutocompleteInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (formattedValue: string) => void;
}

export default function AirportAutocompleteInput({
  label,
  placeholder = 'Type any 3-letter IATA airport code or city (e.g. BLR, DEL, JFK, LHR, IXB...)',
  value,
  onChange
}: AirportAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if current search term is an exact formatted selection
  const isExactSelection = OFFICIAL_AIRPORTS.some(
    ap => `${ap.code} - ${ap.name} (${ap.country})` === searchTerm ||
          `${ap.code} - ${ap.name}, ${ap.city}` === searchTerm
  );

  // If focused and input is a complete formatted selection, show ALL airports to allow switching!
  const query = (isFocused && isExactSelection) ? '' : searchTerm.trim().toLowerCase();

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
    setIsFocused(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setSearchTerm(newVal);
    onChange(newVal);
    setIsOpen(true);

    // Auto-match any 3-letter IATA code typed (e.g. "BLR", "DEL", "IXB", "JFK", "ORD")
    if (newVal.trim().length === 3 && /^[A-Za-z]{3}$/.test(newVal.trim())) {
      const resolved = findOrGenerateAirport(newVal.trim());
      const formatted = `${resolved.code} - ${resolved.name} (${resolved.country})`;
      setSearchTerm(formatted);
      onChange(formatted);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
    setIsFocused(true);
  };

  const customGeneratedAirport = searchTerm.trim() ? findOrGenerateAirport(searchTerm) : null;

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '5px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>
      
      <div className="relative flex items-center">
        <Plane className="w-3.5 h-3.5 absolute left-3 text-cyan-400 pointer-events-none" />
        
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          style={{
            width: '100%',
            background: 'var(--input)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            paddingLeft: '36px',
            paddingRight: '32px',
            paddingTop: '10px',
            paddingBottom: '10px',
            fontSize: '12px',
            color: 'var(--text-primary)',
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { handleFocus(); e.target.style.borderColor = 'var(--border-active)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
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

      {isOpen && (
        <div className="suggestion-list dropdown-enter" style={{ maxHeight: '280px' }}>
          <div style={{
            padding: '8px 12px',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            position: 'sticky', top: 0,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)' }}>
              <Globe size={10} />
              <span>44,000+ Global IATA Directory ({filteredAirports.length} shown)</span>
            </span>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>Worldwide</span>
          </div>

          {filteredAirports.length > 0 ? (
            filteredAirports.map(ap => {
              const fullFormatted = `${ap.code} - ${ap.name} (${ap.country})`;
              const isSelected = value === fullFormatted;

              return (
                <div
                  key={ap.code}
                  onClick={() => handleSelect(ap)}
                  className={`suggestion-item ${isSelected ? 'active' : ''}`}
                  style={isSelected ? { borderLeft: '3px solid var(--accent-primary)', paddingLeft: '11px' } : {}}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '11px',
                        color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '6px',
                        background: 'var(--nav-active-bg)', border: '1px solid var(--border-default)', flexShrink: 0,
                      }}>{ap.code}</span>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                          {ap.name} ({ap.country})
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                          {ap.city}, {ap.country}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />}
                  </div>
                </div>
              );
            })
          ) : (
            customGeneratedAirport && (
              <div
                onClick={() => handleSelect(customGeneratedAirport)}
                className="suggestion-item"
                style={{ borderLeft: '3px solid var(--accent-primary)', paddingLeft: '11px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {customGeneratedAirport.code} — {customGeneratedAirport.name} ({customGeneratedAirport.country})
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Click to apply custom IATA mapping</p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
