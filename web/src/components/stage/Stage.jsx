import { useState, useMemo } from 'react';
import { useFormStore } from '../../store/formStore';
import { evaluateFieldVisibility } from '../../utils/logicEngine';

export default function Stage() {
  const schema = useFormStore(state => state.schema);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const visibilityMap = useMemo(() => {
    return evaluateFieldVisibility(schema, answers);
  }, [schema, answers]);

  const visibleFields = schema.fields.filter(f => visibilityMap[f.id]);

  const handleAnswerChange = (fieldId, value) => setAnswers(prev => ({ ...prev, [fieldId]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-container rounded-xl ambient-shadow p-12 text-center ghost-border border">
          <div className="w-16 h-16 bg-surface-container-high text-primary rounded-full flex items-center justify-center mx-auto mb-8 text-3xl font-light">✓</div>
          <h1 className="text-display-lg display-font text-on-surface mb-2">{schema.settings?.thankYouMessage || "Thank you"}</h1>
          <p className="text-on-surface-variant font-medium text-sm">Response archived.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-6 py-24 md:py-32">
        <h1 className="text-display-lg display-font font-light text-on-surface mb-16">{schema.title}</h1>
        
        <form onSubmit={handleSubmit} className="space-y-16">
          {visibleFields.map(field => (
            <div key={field.id} className="space-y-6 group">
              <label 
                htmlFor={field.id} 
                className="block text-xl md:text-2xl font-light text-on-surface display-font"
              >
                {field.label} {field.required && <span className="text-error font-medium text-lg ml-1">*</span>}
              </label>
              
              <div className="relative">
                 <input
                    id={field.id}
                    type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                    required={field.required}
                    placeholder={field.placeholder || "Type your answer..."}
                    className="w-full text-lg md:text-xl border-b-2 border-surface-container-highest focus:border-primary outline-none py-3 bg-transparent text-on-surface transition-colors placeholder:text-on-surface-variant/30"
                    value={answers[field.id] || ''}
                    onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                 />
                 {/* Enter Hint */}
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity text-[10px] uppercase tracking-widest text-primary font-bold pr-2 bg-surface">
                   Return ↵
                 </div>
              </div>
            </div>
          ))}

          {visibleFields.length > 0 ? (
            <div className="pt-16">
              <button 
                type="submit"
                className="lit-gradient text-on-primary font-medium text-lg px-8 py-4 rounded-md shadow-2xl hover:opacity-90 transition-opacity focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary outline-none"
              >
                {schema.settings?.submitLabel || 'Submit Form'}
              </button>
            </div>
          ) : (
            <div className="text-on-surface-variant py-12 text-lg font-light italic">
              Awaiting blueprint inputs.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
