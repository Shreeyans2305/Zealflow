export function LongTextStage({ field, value, onChange }) {
  const limit = field.meta?.limit;

  return (
    <div className="flex flex-col gap-2">
      <textarea
        id={field.id}
        required={field.required}
        placeholder={field.placeholder || ''}
        className="input-base w-full text-[15px] resize-none"
        style={{ minHeight: '96px', maxHeight: '240px' }}
        value={value || ''}
        onChange={(e) => {
          const val = e.target.value;
          if (!limit || val.length <= limit) {
             onChange(field.id, val);
          }
        }}
      />
      {limit && (
        <div className="text-[12px] text-[var(--color-text-tertiary)] self-end">
          {(value || '').length} / {limit} characters
        </div>
      )}
    </div>
  );
}

export function LongTextConfig({ field, updateField }) {
  const limit = field.meta?.limit || '';

  return (
    <div className="pt-6 border-t border-[var(--color-border-warm)] mt-6">
      <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Character Limit (optional)</label>
      <input 
        type="number" 
        value={limit}
        placeholder="No limit"
        onChange={(e) => {
            const val = e.target.value;
            updateField(field.id, { meta: { ...field.meta, limit: val ? parseInt(val) : null } });
        }}
        className="input-base w-full"
      />
    </div>
  );
}
