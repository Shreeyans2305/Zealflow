export function BinaryStage({ field, value, onChange }) {
  const leftLabel = field.meta?.leftLabel || 'Yes';
  const rightLabel = field.meta?.rightLabel || 'No';

  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => onChange(field.id, leftLabel)}
        className={`flex-1 h-[48px] rounded-[8px] font-medium transition-colors duration-120 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
          value === leftLabel 
            ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[#FFFFFF]' 
            : 'border-[var(--color-border-warm)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border hover:bg-[var(--color-bg-hover)]'
        }`}
      >
        {leftLabel}
      </button>

      <button
        type="button"
        onClick={() => onChange(field.id, rightLabel)}
        className={`flex-1 h-[48px] rounded-[8px] font-medium transition-colors duration-120 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
          value === rightLabel 
            ? 'border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[#FFFFFF]' 
            : 'border-[var(--color-border-warm)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border hover:bg-[var(--color-bg-hover)]'
        }`}
      >
        {rightLabel}
      </button>
    </div>
  );
}

export function BinaryConfig({ field, updateField }) {
  const leftLabel = field.meta?.leftLabel || 'Yes';
  const rightLabel = field.meta?.rightLabel || 'No';

  return (
    <div className="pt-6 border-t border-[var(--color-border-warm)] mt-6 space-y-6">
      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Option 1 Label</label>
        <input 
          type="text" 
          value={leftLabel}
          onChange={(e) => updateField(field.id, { meta: { ...field.meta, leftLabel: e.target.value } })}
          className="input-base w-full"
        />
      </div>
      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Option 2 Label</label>
        <input 
          type="text" 
          value={rightLabel}
          onChange={(e) => updateField(field.id, { meta: { ...field.meta, rightLabel: e.target.value } })}
          className="input-base w-full"
        />
      </div>
    </div>
  );
}
