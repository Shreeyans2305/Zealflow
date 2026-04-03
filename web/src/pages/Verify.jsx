import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../utils/apiClient';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const hasRequested = useRef(false);

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (hasRequested.current) return;

    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    hasRequested.current = true;

    api.get(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then((data) => {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Verification failed. The link may have expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-6 text-[var(--color-text-primary)]">
      <div className="w-full max-w-[400px] text-center">
        {status === 'loading' && (
          <p className="text-[var(--color-text-secondary)] text-[15px]">Verifying your email…</p>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full border-2 border-[var(--color-success)] flex items-center justify-center mx-auto mb-6 bg-[#4A7C5908]">
              <svg className="w-7 h-7 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl display-font mb-2">Email Verified</h1>
            <p className="text-[15px] text-[var(--color-text-secondary)] mb-8">{message}</p>
            <Link to="/" className="btn-primary inline-flex">Sign In</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full border-2 border-[var(--color-error)] flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl display-font mb-2">Verification Failed</h1>
            <p className="text-[15px] text-[var(--color-text-secondary)] mb-8">{message}</p>
            <Link to="/" className="btn-secondary inline-flex">Back to Sign In</Link>
          </>
        )}
      </div>
    </div>
  );
}
