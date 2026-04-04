export function MultipleChoiceStage({ field, value, onChange }) {
  const options = field.meta?.options || ['Option 1', 'Option 2'];

  return (
    <div className="flex flex-col gap-3">
      {options.map((opt, idx) => {
        const isSelected = value === opt;
        
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onChange(field.id, opt)}
            className={`w-full text-left px-4 py-3 rounded-[8px] flex items-center gap-3 transition-colors duration-150 ease-out border ${
              isSelected 
                ? 'border-[var(--color-text-primary)] bg-[var(--color-bg-base)]' 
                : 'border-[var(--color-border-warm)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            {/* Custom Radio Button */}
            <div className={`w-[20px] h-[20px] rounded-full border flex items-center justify-center transition-colors ${
              isSelected ? 'border-[var(--color-text-primary)]' : 'border-[var(--color-border-warm)]'
            }`}>
               {isSelected && <div className="w-[10px] h-[10px] bg-[var(--color-text-primary)] rounded-full" />}
            </div>
            
            <span className="text-[15px] font-medium text-[var(--color-text-primary)]">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MultipleChoiceConfig({ field, updateField }) {
  const options = field.meta?.options || ['Option 1', 'Option 2'];

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
