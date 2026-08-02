import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';

interface DatePickerProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string;
  required?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date...',
  minDate,
  required = false,
  className = '',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parsed initial view date (year/month)
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date for trigger button
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return placeholder;
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formatted = `${viewYear}-${monthStr}-${dayStr}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handlePresetSelect = (daysFromNow: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    onChange(formatted);
    setViewYear(year);
    setViewMonth(target.getMonth());
    setIsOpen(false);
  };

  // Generate calendar grid days
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const selectedDateObj = value ? new Date(value + 'T00:00:00') : null;
  const isSelected = (day: number) => {
    if (!selectedDateObj) return false;
    return (
      selectedDateObj.getFullYear() === viewYear &&
      selectedDateObj.getMonth() === viewMonth &&
      selectedDateObj.getDate() === day
    );
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}

      {/* APPLE-STYLE TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer shadow-sm"
        style={{
          background: 'var(--input)',
          borderColor: isOpen ? 'var(--accent-primary)' : 'var(--border-default)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          boxShadow: isOpen ? '0 0 16px var(--accent-glow)' : 'none',
        }}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon size={16} style={{ color: 'var(--accent-primary)' }} />
          <span className="truncate">{formatDateDisplay(value)}</span>
        </div>
        {value && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={12} />
          </span>
        )}
      </button>

      {/* APPLE-STYLE FLOATING CALENDAR POPOVER */}
      {isOpen && (
        <div
          className="absolute left-0 mt-2 z-50 w-72 p-4 rounded-2xl border shadow-2xl animate-zoom-in"
          style={{
            background: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 20px var(--accent-glow)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Header Month / Year Nav */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ background: 'var(--nav-hover-bg)', color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-extrabold tracking-wide" style={{ color: 'var(--text-primary)' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ background: 'var(--nav-hover-bg)', color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Presets Bar */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => handlePresetSelect(0)}
              className="px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all shrink-0"
              style={{ background: 'var(--nav-active-bg)', border: '1px solid var(--nav-active-border)', color: 'var(--accent-primary)' }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect(14)}
              className="px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all shrink-0"
              style={{ background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              +14 Days (Lead)
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect(30)}
              className="px-2 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all shrink-0"
              style={{ background: 'var(--nav-hover-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              +1 Month
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES.map(day => (
              <span key={day} className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                {day}
              </span>
            ))}
          </div>

          {/* Days 7x6 Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }
              const selected = isSelected(day);
              const currentToday = isToday(day);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-150 cursor-pointer"
                  style={{
                    background: selected
                      ? 'var(--btn-primary-bg)'
                      : currentToday
                      ? 'var(--nav-active-bg)'
                      : 'transparent',
                    color: selected
                      ? 'var(--btn-primary-text)'
                      : currentToday
                      ? 'var(--accent-primary)'
                      : 'var(--text-primary)',
                    border: currentToday && !selected ? '1px solid var(--accent-primary)' : 'none',
                    boxShadow: selected ? '0 4px 12px var(--accent-glow)' : 'none',
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
