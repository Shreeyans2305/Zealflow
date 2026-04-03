import { Star } from 'lucide-react';

export function RatingStage({ field, value, onChange }) {
  const max = field.meta?.max || 5;
  const isStars = field.meta?.mode !== 'nps';

  if (isStars) {
    return (
      <div className="flex gap-2">
        {Array.from({ length: max }).map((_, i) => {
          const ratingValue = i + 1;
          const isActive = value && ratingValue <= value;
          return (
            <button
              key={ratingValue}
              type="button"
              onClick={() => onChange(field.id, ratingValue)}
              className="p-1 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] rounded"
            >
              <Star 
                size={32} 
                className={isActive ? 'text-[var(--color-accent)] fill-[var(--color-accent)]' : 'text-[var(--color-border-warm)]'} 
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>
    );
  }

  // NPS mode (pill buttons)
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: max }).map((_, i) => {
        const ratingValue = i + 1;
        const isSelected = value === ratingValue;
        return (
          <button
            key={ratingValue}
            type="button"
            onClick={() => onChange(field.id, ratingValue)}
            className={`w-12 h-12 rounded-full border flex items-center justify-center font-medium transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
              isSelected 
                ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)] text-white' 
                : 'bg-[#FFFFFF] border-[var(--color-border-warm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            {ratingValue}
          </button>
        );
      })}
    </div>
  );
}

export function RatingConfig({ field, updateField }) {
  const mode = field.meta?.mode || 'stars';
  const max = field.meta?.max || 5;

  return (
    <div className="pt-6 border-t border-[var(--color-border-warm)] mt-6 space-y-6">
      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Display Mode</label>
        <select 
          value={mode}
          onChange={(e) => updateField(field.id, { meta: { ...field.meta, mode: e.target.value } })}
          className="input-base w-full"
        >
          <option value="stars">Star Rating</option>
          <option value="nps">Number Scale (NPS)</option>
        </select>
      </div>

      <div>
        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Maximum Scale</label>
        <input 
          type="number" 
          value={max}
          min={3}
          onChange={(e) => updateField(field.id, { meta: { ...field.meta, max: parseInt(e.target.value) || 5 } })}
          className="input-base w-full"
        />
      </div>
    </div>
  );
}
