import { useState, useMemo, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { evaluateFieldVisibility } from '../../utils/logicEngine';
import { fieldRegistry } from '../../registry/fieldRegistry';
import { api } from '../../utils/apiClient';

export default function Stage() {
  const { id } = useParams();
  const [schema, setSchema] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoadState('error');
      return;
    }
    setLoadState('loading');
    api.get(`/api/forms/${id}`)
      .then((form) => {
        // API returns the full DB row; schema is nested under `schema` key
        setSchema(form.schema || form);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [id]);

  const visibilityMap = useMemo(() => {
    if (!schema) return {};
    return evaluateFieldVisibility(schema, answers);
  }, [schema, answers]);

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <span className="text-[var(--color-text-tertiary)] text-[14px]">Loading form…</span>
      </div>
    );
  }

  if (loadState === 'error' || !schema) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-6">
        <div className="max-w-[720px] w-full card text-center">
          <h1 className="text-4xl display-font text-[var(--color-text-primary)] mb-4">Form not found</h1>
          <p className="text-[15px] text-[var(--color-text-secondary)] mb-8">
            This form link is invalid or the form has been removed.
          </p>
          <Link to="/" className="btn-primary inline-flex">Return to Directory</Link>
        </div>
      </div>
    );
  }

  const visibleFields = schema.fields.filter((f) => visibilityMap[f.id]);

  const handleAnswerChange = (fieldId, value) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await api.post(`/api/forms/${id}/submit`, { data: answers });
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-6">
        <div className="max-w-[720px] w-full card text-center p-12">
          <div className="w-16 h-16 rounded-full border-2 border-[var(--color-success)] flex items-center justify-center mx-auto mb-8 bg-[#4A7C5908]">
            <svg className="w-8 h-8 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl display-font text-[var(--color-text-primary)] mb-2">
            {schema.settings?.thankYouMessage || 'Thank you'}
          </h1>
          <p className="text-[15px] text-[var(--color-text-secondary)] mt-4">Your response was recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] transition-all duration-150 ease-out">
      {schema?.theme?.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: schema.theme.customCSS }} />
      )}

      <div className="max-w-[720px] mx-auto px-6 py-[96px]">
        <h1 className="text-5xl display-font text-[var(--color-text-primary)] mb-[64px]">{schema.title}</h1>

        <form onSubmit={handleSubmit} className="space-y-[48px]">
          {visibleFields.map((field) => {
            const fieldDef = fieldRegistry[field.type];
            const StageComponent = fieldDef?.StageComponent;
            return (
              <div key={field.id} className="space-y-3 group max-w-[500px]">
                <label
                  htmlFor={field.id}
                  className="block text-[16px] font-medium text-[var(--color-text-primary)] mb-4"
                >
                  {field.label}{' '}
                  {field.required && (
                    <span className="text-[var(--color-accent)] font-medium ml-1">*</span>
                  )}
                </label>
                {StageComponent ? (
                  <StageComponent field={field} value={answers[field.id]} onChange={handleAnswerChange} />
                ) : (
                  <div className="text-[var(--color-error)] text-[13px] p-4 border border-[var(--color-error)] rounded">
                    Field renderer for {field.type} not found.
                  </div>
                )}
              </div>
            );
          })}

          {submitError && (
            <p className="text-[13px] text-[var(--color-error)]">{submitError}</p>
          )}

          {visibleFields.length > 0 ? (
            <div className="pt-[32px] border-t border-[var(--color-border-warm)] max-w-[500px]">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-8 py-3 text-[16px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : schema.settings?.submitLabel || 'Submit Form'}
              </button>
            </div>
          ) : (
            <div className="text-[var(--color-text-secondary)] py-12 text-[15px] italic border border-dashed border-[var(--color-border-warm)] rounded-[12px] text-center bg-[#FFFFFF]">
              This form blueprint contains no visible inputs.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
