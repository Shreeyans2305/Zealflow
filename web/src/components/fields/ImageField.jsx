import { Image } from 'lucide-react';

export function ImageStage({ field }) {
  const url = field.meta?.url;

  return (
    <div className="w-full relative rounded-[8px] overflow-hidden border border-[var(--color-border-warm)] bg-[var(--color-bg-base)] group min-h-[200px] flex items-center justify-center">
      {url ? (
        <img 
            src={url} 
            alt={field.label || "Embedded image"} 
            className="w-full h-auto object-cover max-h-[600px]"
        />
      ) : (
        <div className="text-center p-12 text-[var(--color-text-tertiary)] flex flex-col items-center gap-3">
            <Image size={32} strokeWidth={1.5} />
            <span className="text-[13px]">No image provided in blueprint.</span>
        </div>
      )}
    </div>
  );
}

export function ImageConfig({ field, updateField }) {
  const url = field.meta?.url || '';

  return (
    <div className="pt-6 border-t border-[var(--color-border-warm)] mt-6 space-y-4">
      <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Image Source URL</label>
      <input 
        type="url" 
        value={url}
        placeholder="https://example.com/image.jpg"
        onChange={(e) => updateField(field.id, { meta: { ...field.meta, url: e.target.value } })}
        className="input-base w-full"
      />
    </div>
  );
}
