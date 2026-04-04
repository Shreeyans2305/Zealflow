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
    <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center p-6 text-[var(--color-text-primary)] relative overflow-hidden">
      <div className="template-orb" />
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute left-[8%] top-[12%] w-64 h-64 rounded-full bg-[var(--color-accent-soft)] blur-3xl" />
        <div className="absolute right-[8%] bottom-[10%] w-72 h-72 rounded-full bg-[#4A7C5910] blur-3xl" />
      </div>

      <div className="w-full max-w-[980px] grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center relative z-10">
        <div className="hidden lg:block">
          <div className="card relative overflow-hidden min-h-[560px] p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(193,127,62,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(74,124,89,0.10),transparent_34%)]" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="template-ribbon">No-code forms, made beautiful</span>
                <h1 className="text-5xl display-font mt-6 mb-4 text-[var(--color-text-primary)] max-w-[10ch] leading-tight">
                  Build forms that feel handcrafted.
                </h1>
                <p className="text-[15px] text-[var(--color-text-secondary)] max-w-[34ch]">
                  Designed for modern teams with branching logic, elegant templates, file uploads, and collaborative editing.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--color-border-warm)] bg-white/75 backdrop-blur p-4 shadow-sm">
                  <p className="text-[12px] text-[var(--color-text-tertiary)] mb-2">Template</p>
                  <p className="text-[15px] font-medium">Dining Reservation</p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border-warm)] bg-white/75 backdrop-blur p-4 shadow-sm">
                  <p className="text-[12px] text-[var(--color-text-tertiary)] mb-2">Logic</p>
                  <p className="text-[15px] font-medium">Vegetarian routing</p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border-warm)] bg-white/75 backdrop-blur p-4 shadow-sm">
                  <p className="text-[12px] text-[var(--color-text-tertiary)] mb-2">Upload</p>
                  <p className="text-[15px] font-medium">Resume + file storage</p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border-warm)] bg-white/75 backdrop-blur p-4 shadow-sm">
                  <p className="text-[12px] text-[var(--color-text-tertiary)] mb-2">Sync</p>
                  <p className="text-[15px] font-medium">Live collaboration</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[400px] mx-auto lg:mx-0">
          <div className="text-center lg:text-left mb-10">
            <h1 className="text-4xl display-font mb-2 text-[var(--color-text-primary)]">Zealflow</h1>
            <p className="text-[15px] text-[var(--color-text-secondary)]">
              {tab === 'login' ? 'Sign in to your workspace' : 'Create your workspace'}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex gap-1 p-1 bg-[var(--color-bg-hover)] rounded-lg mb-6 border border-[var(--color-border-warm)]">
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

          <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="space-y-4 card">
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
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-warm)] bg-white text-[var(--color-text-primary)] text-[14px] outline-none focus:border-[var(--color-accent)] transition-colors"
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
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-warm)] bg-white text-[var(--color-text-primary)] text-[14px] outline-none focus:border-[var(--color-accent)] transition-colors"
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
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-warm)] bg-white text-[var(--color-text-primary)] text-[14px] outline-none focus:border-[var(--color-accent)] transition-colors"
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
    </div>
  );
}
