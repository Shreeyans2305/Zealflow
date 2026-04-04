import { Check } from 'lucide-react';

export function CheckboxStage({ field, value, onChange }) {
  const options = field.meta?.options || ['Option A', 'Option B'];
  const safeValue = Array.isArray(value) ? value : []; // Multiselect dictates an array.

  const toggleOption = (opt) => {
    if (safeValue.includes(opt)) {
      onChange(field.id, safeValue.filter(v => v !== opt));
    } else {
      onChange(field.id, [...safeValue, opt]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {options.map((opt, idx) => {
        const isSelected = safeValue.includes(opt);
        
        return (
          <button
            key={idx}
            type="button"
            onClick={() => toggleOption(opt)}
            className={`w-full text-left px-4 py-3 rounded-[8px] flex items-center gap-3 transition-colors duration-150 ease-out border ${
              isSelected 
                ? 'border-[var(--color-text-primary)] bg-[var(--color-bg-base)]' 
                : 'border-[var(--color-border-warm)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            {/* Custom Checkbox Button */}
            <div className={`w-[20px] h-[20px] rounded-[4px] border flex items-center justify-center transition-colors ${
              isSelected ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)]' : 'border-[var(--color-border-warm)] bg-[var(--color-bg-surface)]'
            }`}>
               {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
            </div>
            
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CheckboxConfig({ field, updateField }) {
  const options = field.meta?.options || ['Option A', 'Option B'];

  const handleUpdate = (newOptions) => {
    updateField(field.id, { meta: { ...field.meta, options: newOptions } });
  };

  return (
    <div className="pt-6 border-t border-[var(--color-border-warm)] mt-6 space-y-4">
      <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Options</label>
      
      {options.map((opt, i) => (
        <div key={i} className="flex gap-2">
           <input 
             type="text" 
             value={opt}
             onChange={(e) => {
               const copy = [...options];
               copy[i] = e.target.value;
               handleUpdate(copy);
             }}
             className="input-base w-full py-2 text-[14px]"
           />
           <button 
             onClick={() => {
               const copy = options.filter((_, idx) => idx !== i);
               handleUpdate(copy);
             }}
             className="px-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]"
           >
             ×
           </button>
        </div>
      ))}

      <button 
        onClick={() => handleUpdate([...options, `Option ${options.length + 1}`])}
        className="w-full text-left py-2 text-[13px] text-[var(--color-accent)] font-medium"
      >
        + Add Option
      </button>
    </div>
  );
}
