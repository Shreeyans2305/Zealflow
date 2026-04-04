import { useState } from 'react';
import { Sparkles, X, Loader2, Plus, RefreshCw, Check } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useFormStore } from '../../store/formStore';
import { useAIGenerate } from '../../hooks/useAIGenerate';
import { v4 as uuidv4 } from 'uuid';

export default function AIGeneratePanel() {
  const isAIPanelOpen = useUIStore((s) => s.isAIPanelOpen);
  const toggleAIPanel = useUIStore((s) => s.toggleAIPanel);
  const applyToCurrentSchema = useFormStore((s) => s.applyToCurrentSchema);
  const schema = useFormStore((s) => s.schema);
  const currentPageId = useUIStore((s) => s.currentPageId);

  const { generateForm, loading, error } = useAIGenerate();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);

  if (!isAIPanelOpen) return null;

  const handleGenerate = async () => {
    try {
      const data = await generateForm(prompt, JSON.stringify({
        title: schema.title,
        fields: schema.fields.map(f => ({ type: f.type, label: f.label }))
      }));
      setResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApply = (mode) => {
    if (!result) return;

    applyToCurrentSchema((draft) => {
      const newFields = result.fields.map((f) => ({
        id: `field_${uuidv4()}`,
        type: f.type,
        label: f.label || 'New Question',
        placeholder: f.placeholder || '',
        required: f.required ?? false,
        validation: {},
        meta: {
          hidden: false,
          width: 'full',
          pageId: currentPageId || draft.settings.pages?.[0]?.id || 'page_1',
          options: f.options || [],
          ...(f.meta || {}),
        },
      }));

      if (mode === 'replace') {
        draft.fields = newFields;
        if (result.title) draft.title = result.title;
        if (result.settings) {
          if (result.settings.submitLabel) draft.settings.submitLabel = result.settings.submitLabel;
          if (result.settings.thankYouMessage) draft.settings.thankYouMessage = result.settings.thankYouMessage;
        }
      } else {
        draft.fields.push(...newFields);
      }
    });

    toggleAIPanel();
    setResult(null);
    setPrompt('');
  };

  const suggestions = [
    'Job application form',
    'Customer feedback survey',
    'Event registration site',
    'Lead generation for real estate'
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] z-[100] bg-[var(--color-bg-base)] border-l border-[var(--color-border-warm)] shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-warm)]">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--color-accent)]" />
          <h2 className="font-semibold text-[15px]">AI Form Generator</h2>
        </div>
        <button onClick={toggleAIPanel} className="p-1 hover:bg-[var(--color-bg-secondary)] rounded transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <label className="text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">
            What kind of form do you need?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-warm)] rounded-lg p-3 text-[14px] min-h-[120px] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
            placeholder="e.g. A patient intake form with contact info and medical history..."
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full mt-3 btn-primary flex items-center justify-center gap-2 py-2.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
            {loading ? 'Generating...' : 'Generate Form'}
          </button>
        </div>

        {!result && !loading && (
          <div className="space-y-3">
             <label className="text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider block">
              Suggestions
            </label>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="text-[13px] px-3 py-1.5 rounded-full border border-[var(--color-border-warm)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-[13px] text-[var(--color-error)] bg-[var(--color-error)]/5 p-4 rounded-lg border border-[var(--color-error)]/20">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                Preview ({result.fields?.length} fields)
              </label>
              <button
                onClick={() => setResult(null)}
                className="text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 border-y border-[var(--color-border-warm)] py-4">
              {result.fields?.map((f, i) => (
                <div key={i} className="p-3 rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-bg-secondary)] text-[13px]">
                  <div className="font-medium mb-1">{f.label}</div>
                  <div className="text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-2">
                    <span className="capitalize px-1.5 py-0.5 bg-[var(--color-bg-tertiary)] rounded text-[var(--color-text-secondary)]">{f.type}</span>
                    {f.required && <span className="text-[var(--color-accent)] font-medium">Required</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
               <button
                onClick={() => handleApply('replace')}
                className="btn-primary py-2.5"
              >
                Apply (Replace All)
              </button>
              <button
                onClick={() => handleApply('add')}
                className="w-full text-[var(--color-text-primary)] border border-[var(--color-border-warm)] hover:bg-[var(--color-bg-secondary)] px-4 py-2.5 rounded-lg text-[14px] font-medium transition-all"
              >
                Add to Form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
