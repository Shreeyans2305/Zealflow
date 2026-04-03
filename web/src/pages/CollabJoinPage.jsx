import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/apiClient';
import { useAuthStore } from '../store/authStore';
import { Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export default function CollabJoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const admin = useAuthStore((s) => s.admin);
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [verifying, setVerifying] = useState(true);

  // Initial check: try joining without password to see if one is required
  useEffect(() => {
    if (!token) {
      setError('Invalid collaboration link');
      setVerifying(false);
      return;
    }

    if (!admin) {
      navigate(`/?redirect=/collab/join?token=${token}`);
      return;
    }

    let cancelled = false;

    const tryJoin = async () => {
      try {
        const res = await api.post('/api/forms/join', {
          token,
          password: null
        });
        if (!cancelled && res.success) {
          navigate(`/builder/${res.form_id}`, { replace: true });
        }
      } catch (err) {
        if (cancelled) return;
        if (err.status === 403) {
          setNeedsPassword(true);
        } else {
          setError(err.message || 'Failed to join collaboration');
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    };

    tryJoin();

    return () => { cancelled = true; };
  }, [token, admin]);


  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/forms/join', {
        token,
        password
      });
      if (res.success) {
        navigate(`/builder/${res.form_id}`, { replace: true });
      }
    } catch (err) {
      if (err.status === 403) {
        setError('Incorrect password');
      } else {
        setError(err.message || 'Failed to join collaboration');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
          <p className="text-[var(--color-text-tertiary)]">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-3xl shadow-2xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Join Collaboration</h1>
          <p className="text-[var(--color-text-secondary)]">You've been invited to edit a form.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {needsPassword && (
          <form onSubmit={handleSubmitPassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                This link is password protected
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  required
                  autoFocus
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <><ArrowRight size={18} /> Join Now</>}
            </button>
          </form>
        )}

        <div className="pt-4 text-center">
          <button 
            onClick={() => navigate('/admin')}
            className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-primary)] transition-colors"
          >
            Cancel and return to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
