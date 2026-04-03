export function OpinionStage({ field, value, onChange }) {
  const leftLabel = field.meta?.leftLabel || 'Strongly Disagree';
  const rightLabel = field.meta?.rightLabel || 'Strongly Agree';
  const scale = [1, 2, 3, 4, 5];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center w-full max-w-[500px]">
        {scale.map((num, i) => {
          const isSelected = value === num;
          return (
            <div key={num} className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => onChange(field.id, num)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
                  isSelected 
                    ? 'border-2 border-[var(--color-accent)]' 
                    : 'border border-[var(--color-border-warm)] hover:border-[var(--color-text-secondary)]'
                }`}
              >
                {isSelected && <div className="w-3 h-3 rounded-full bg-[var(--color-accent)]" />}
              </button>
              
              {/* Optional labels only on ends to keep clean */}
              {(i === 0 || i === scale.length - 1) && (
                <span className="text-[12px] text-[var(--color-text-secondary)] w-20 text-center leading-tight">
                  {i === 0 ? leftLabel : rightLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OpinionConfig({ field, updateField }) {
  const leftLabel = field.meta?.leftLabel || 'Strongly Disagree';
  const rightLabel = field.meta?.rightLabel || 'Strongly Agree';

  return (
    <div className="pt-6 border-t border-[var(--color-border-warm)] mt-6 space-y-6">
      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Left Anchor</label>
        <input 
          type="text" 
          value={leftLabel}
          onChange={(e) => updateField(field.id, { meta: { ...field.meta, leftLabel: e.target.value } })}
          className="input-base w-full"
        />
      </div>
      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Right Anchor</label>
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
