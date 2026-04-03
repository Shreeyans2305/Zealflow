import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export function DateStage({ field, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDay }, (_, i) => i);

  const handleSelectDate = (date) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), date);
    // Adjust for local timezone offset when emitting to string
    const offset = newDate.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(newDate - offset)).toISOString().split('T')[0];
    onChange(field.id, localISOTime);
    setIsOpen(false);
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const prevMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const isToday = (d) => {
    const today = new Date();
    return today.getDate() === d && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
  };

  const isSelected = (d) => {
    if (!value) return false;
    const selected = new Date(value);
    // Add timezone adjustment if evaluating
    // But since HTML input date and JS parsing is simple, we just check day/month/year strictly.
    const selectedParts = value.split('-');
    return parseInt(selectedParts[2]) === d && parseInt(selectedParts[1]) - 1 === currentMonth.getMonth() && parseInt(selectedParts[0]) === currentMonth.getFullYear();
  };

  return (
    <div className="relative w-full" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[48px] px-4 flex items-center justify-between border border-[var(--color-border-warm)] bg-[#FFFFFF] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-colors"
      >
        <span className={value ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}>
          {value ? new Date(value).toLocaleDateString() : (field.placeholder || "Select a date")}
        </span>
        <CalendarIcon size={18} className="text-[var(--color-text-secondary)]" strokeWidth={1.5} />
      </button>

      {isOpen && (
        <div className="absolute top-[56px] left-0 z-50 p-4 bg-[#FFFFFF] rounded-[12px] shadow-[0_12px_24px_rgba(0,0,0,0.1)] border border-[var(--color-border-warm)] w-[320px] origin-top transition-transform duration-150 ease-out">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={prevMonth} className="p-1 hover:bg-[var(--color-bg-hover)] rounded transition-colors"><ChevronLeft size={16} /></button>
            <span className="font-medium text-[15px] text-[var(--color-text-primary)]">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 hover:bg-[var(--color-bg-hover)] rounded transition-colors"><ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-[11px] font-medium text-[var(--color-text-secondary)] uppercase">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => handleSelectDate(day)}
                className={`w-8 h-8 rounded-[6px] text-[13px] mx-auto flex items-center justify-center transition-colors ${
                  isSelected(day) 
                    ? 'bg-[var(--color-text-primary)] text-white font-medium' 
                    : isToday(day) 
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-white'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DateConfig({ field, updateField }) {
  return (
    <div className="pt-6 border-t border-[var(--color-border-warm)] mt-6">
      <p className="text-[13px] text-[var(--color-text-secondary)]">The custom calendar popover will automatically attach logic.</p>
    </div>
  );
}
