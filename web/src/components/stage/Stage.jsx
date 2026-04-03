import { useState, useMemo, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { evaluateFieldVisibility } from '../../utils/logicEngine';
import { fieldRegistry } from '../../registry/fieldRegistry';
import { api } from '../../utils/apiClient';

function formatDeadline(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

function getTimedSessionStorageKey(formId) {
  return `zealflow_timed_session_${formId}`;
}

function readCachedTimedSession(formId) {
  try {
    const raw = sessionStorage.getItem(getTimedSessionStorageKey(formId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedTimedSession(formId, session) {
  try {
    sessionStorage.setItem(getTimedSessionStorageKey(formId), JSON.stringify(session));
  } catch {
    // no-op
  }
}

function clearCachedTimedSession(formId) {
  try {
    sessionStorage.removeItem(getTimedSessionStorageKey(formId));
  } catch {
    // no-op
  }
}

export default function Stage() {
  const { id } = useParams();
  const [schema, setSchema] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [answers, setAnswers] = useState({});
  const [respondent, setRespondent] = useState({ name: '', email: '' });
  const [pageIndex, setPageIndex] = useState(0);
  const [deadlineAt, setDeadlineAt] = useState(null);
  const [isClosedByDeadline, setIsClosedByDeadline] = useState(false);
  const [timedSession, setTimedSession] = useState({ enabled: false, seconds: 0, remaining: 0, token: null });
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
        const nextSchema = form.schema || form;
        setSchema(nextSchema);
        const dl = nextSchema?.settings?.deadlineAt || null;
        setDeadlineAt(dl);
        if (dl && new Date(dl).getTime() < Date.now()) {
          setIsClosedByDeadline(true);
        }
        setPageIndex(0);

        const isTimedEnabled = Boolean(nextSchema?.settings?.timedResponseEnabled);
        const configuredSeconds = Number(nextSchema?.settings?.timedResponseSeconds || 0);
        if (!isTimedEnabled || configuredSeconds <= 0) {
          clearCachedTimedSession(id);
          return api.post(`/api/forms/${id}/open`, {});
        }

        const cached = readCachedTimedSession(id);
        if (cached?.token && Number(cached.startedAt) > 0 && Number(cached.seconds) === configuredSeconds) {
          const elapsed = Math.max(0, Math.floor(Date.now() / 1000) - Number(cached.startedAt));
          const remaining = Math.max(0, configuredSeconds - elapsed);

          setTimedSession({
            enabled: true,
            seconds: configuredSeconds,
            remaining,
            token: cached.token,
          });
          setLoadState('ready');
          return null;
        }

        return api.post(`/api/forms/${id}/open`, {});
      })
      .then((session) => {
        if (!session) return;
        const seconds = Number(session.timed_seconds || 0);
        const enabled = Boolean(session.timed_enabled) && seconds > 0;
        setTimedSession({
          enabled,
          seconds,
          remaining: seconds,
          token: session.session_token || null,
        });
        if (enabled && session.session_token && Number(session.started_at) > 0) {
          writeCachedTimedSession(id, {
            token: session.session_token,
            startedAt: Number(session.started_at),
            seconds,
          });
        } else {
          clearCachedTimedSession(id);
        }
        if (session.deadline_at) setDeadlineAt(session.deadline_at);
        setLoadState('ready');
      })
      .catch((err) => {
        if ((err?.message || '').toLowerCase().includes('deadline')) {
          setIsClosedByDeadline(true);
          setLoadState('ready');
          return;
        }
        setLoadState('error');
      });
  }, [id]);

  useEffect(() => {
    if (!timedSession.enabled || timedSession.seconds <= 0) return;
    const timer = setInterval(() => {
      setTimedSession((prev) => {
        if (!prev.enabled) return prev;
        const next = Math.max(0, prev.remaining - 1);
        return { ...prev, remaining: next };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timedSession.enabled, timedSession.seconds]);

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

  if (isClosedByDeadline) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-6">
        <div className="max-w-[720px] w-full card text-center p-12">
          <h1 className="text-4xl display-font text-[var(--color-text-primary)] mb-2">Form Closed</h1>
          <p className="text-[15px] text-[var(--color-text-secondary)] mt-4">
            This form is no longer accepting responses.
          </p>
          {deadlineAt && (
            <p className="text-[13px] text-[var(--color-text-tertiary)] mt-2">Deadline: {formatDeadline(deadlineAt)}</p>
          )}
        </div>
      </div>
    );
  }

  const pages = schema.settings?.pages?.length
    ? schema.settings.pages
    : [{ id: 'page_1', title: 'Page 1' }];
  const isAnonymousAllowed = schema.settings?.allowAnonymousEntries !== false;

  const visibleFields = schema.fields.filter((f) => visibilityMap[f.id]);
  const fieldsByPage = pages.map((p) => ({
    ...p,
    fields: visibleFields.filter((f) => (f.meta?.pageId || pages[0].id) === p.id),
  }));
  const currentPage = fieldsByPage[Math.min(pageIndex, Math.max(fieldsByPage.length - 1, 0))] || { fields: [] };
  const isLastPage = pageIndex >= fieldsByPage.length - 1;

  const handleAnswerChange = (fieldId, value) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!isLastPage) {
      setPageIndex((i) => Math.min(i + 1, fieldsByPage.length - 1));
      return;
    }

    if (timedSession.enabled && timedSession.remaining <= 0) {
      setSubmitError('Time limit exceeded for this form.');
      return;
    }

    if (!isAnonymousAllowed && (!respondent.name.trim() || !respondent.email.trim())) {
      setSubmitError('Please provide your name and email to continue.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/api/forms/${id}/submit`, {
        data: answers,
        meta: {
          ...(isAnonymousAllowed
            ? {}
            : { submitter_name: respondent.name.trim(), submitter_email: respondent.email.trim() }),
          ...(timedSession.token ? { session_token: timedSession.token } : {}),
        },
      });
      clearCachedTimedSession(id);
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

        {(deadlineAt || timedSession.enabled) && (
          <div className="mb-6 max-w-[500px] text-[13px] text-[var(--color-text-secondary)] space-y-1">
            {deadlineAt && <div>Deadline: {formatDeadline(deadlineAt)}</div>}
            {timedSession.enabled && (
              <div className={timedSession.remaining <= 30 ? 'text-[var(--color-error)] font-medium' : ''}>
                Time remaining: {Math.floor(timedSession.remaining / 60)}:{String(timedSession.remaining % 60).padStart(2, '0')}
              </div>
            )}
          </div>
        )}

        {fieldsByPage.length > 1 && (
          <div className="mb-8 max-w-[500px]">
            <div className="flex items-center justify-between text-[12px] text-[var(--color-text-secondary)] mb-2">
              <span>{currentPage.title || `Page ${pageIndex + 1}`}</span>
              <span>Page {pageIndex + 1} / {fieldsByPage.length}</span>
            </div>
            <div className="h-1.5 rounded bg-[var(--color-border-warm)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)]"
                style={{ width: `${((pageIndex + 1) / fieldsByPage.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-[48px]">
          {currentPage.fields.map((field) => {
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

          <div className="pt-[32px] border-t border-[var(--color-border-warm)] max-w-[500px]">
              {currentPage.fields.length === 0 && (
                <div className="text-[var(--color-text-secondary)] py-4 text-[14px] italic">
                  No visible questions on this page.
                </div>
              )}

              {!isAnonymousAllowed && isLastPage && (
                <div className="space-y-3 mb-5">
                  <p className="text-[13px] text-[var(--color-text-secondary)]">This form requires respondent details.</p>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={respondent.name}
                    onChange={(e) => setRespondent((r) => ({ ...r, name: e.target.value }))}
                    className="input-base w-full"
                  />
                  <input
                    type="email"
                    placeholder="Your email"
                    value={respondent.email}
                    onChange={(e) => setRespondent((r) => ({ ...r, email: e.target.value }))}
                    className="input-base w-full"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                {pageIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setPageIndex((i) => Math.max(i - 1, 0))}
                    className="btn-secondary px-6 py-3 text-[15px]"
                  >
                    Back
                  </button>
                )}
              <button
                type="submit"
                  disabled={submitting || (timedSession.enabled && timedSession.remaining <= 0)}
                className="btn-primary px-8 py-3 text-[16px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : isLastPage ? (schema.settings?.submitLabel || 'Submit Form') : 'Next'}
              </button>
              </div>
          </div>
        </form>
      </div>
    </div>
  );
}
