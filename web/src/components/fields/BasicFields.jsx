export function BasicStageInput({ field, value, onChange }) {
  return (
    <input
      id={field.id}
      type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
      required={field.required}
      placeholder={field.placeholder || ''}
      className="input-base w-full text-[15px]"
      value={value || ''}
      onChange={(e) => onChange(field.id, e.target.value)}
    />
  );
}

export function BasicConfig({ field, updateField }) {
    // Basic config properties are actually handled globally in the ConfigPanel (Label, Placeholder, Required).
    // If a text field had specific properties (like min-length), they'd go here.
    return (
        <div className="pt-6 border-t border-[var(--color-border-warm)] mt-6">
            <p className="text-[13px] text-[var(--color-text-secondary)]">Standard configuration applies.</p>
        </div>
    );
}
