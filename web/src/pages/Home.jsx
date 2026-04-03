import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFormStore } from '../store/formStore';

export default function Home() {
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const signup = useAuthStore((s) => s.signup);
  const initForms = useFormStore((s) => s.initForms);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setVerificationUrl('');
    setLoading(true);
    try {
      await login(username, password);
      await initForms();
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setVerificationUrl('');
    setLoading(true);
    try {
      const result = await signup(username, email, password);
      setSuccessMsg(result.message || 'Account created! Check your email to verify before logging in.');
      setVerificationUrl(result.verification_url || '');
      setTab('login');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center p-6 text-[var(--color-text-primary)]">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <h1 className="text-4xl display-font mb-2 text-[var(--color-text-primary)]">Zealflow</h1>
          <p className="text-[15px] text-[var(--color-text-secondary)]">
            {tab === 'login' ? 'Sign in to your workspace' : 'Create your workspace'}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 bg-[var(--color-bg-hover)] rounded-lg mb-6">
          {['login', 'signup'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all capitalize ${
                tab === t
                  ? 'bg-white text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-[#4A7C5912] border border-[var(--color-success)] text-[13px] text-[var(--color-success)]">
            {successMsg}
            {verificationUrl && (
              <div className="mt-2">
                <a
                  href={verificationUrl}
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Verify account now
                </a>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#FF000010] border border-[var(--color-error)] text-[13px] text-[var(--color-error)]">
            {error}
          </div>
        )}

        <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="yourname"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] text-[14px] outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          {tab === 'signup' && (
            <div>
              <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] text-[14px] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-warm)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] text-[14px] outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? tab === 'login' ? 'Signing in…' : 'Creating account…'
              : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
