import { useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { api } from '../../utils/apiClient';
import { Check, Copy, Link as LinkIcon, Lock, X } from 'lucide-react';

export function ShareFormModal({ formId, formTitle }) {
  const { closeModal } = useModal();
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState(24);
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/api/forms/${formId}/share`, {
        password: password || null,
        expires_in_hours: parseInt(expiresIn)
      });
      setShareLink(res.link);
    } catch (err) {
      alert('Failed to generate sharing link: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[var(--color-bg-elevated)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--color-border-subtle)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Share "{formTitle}"</h2>
          <button onClick={() => closeModal()} className="p-1 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!shareLink ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                  Password Protection (Optional)
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                  <input
                    type="password"
                    placeholder="Enter a password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                  Link Expiration
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                >
                  <option value={1}>1 hour</option>
                  <option value={24}>24 hours</option>
                  <option value={168}>7 days</option>
                  <option value={720}>30 days</option>
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? 'Generating...' : <><LinkIcon size={18} /> Generate Collaboration Link</>}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--color-bg-base)] rounded-xl border border-[var(--color-border-subtle)] flex items-center gap-3">
                <div className="flex-1 truncate text-sm text-[var(--color-text-secondary)] font-mono">
                  {shareLink}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-primary)] transition-all"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] text-center">
                Anyone with this link {password ? 'and password ' : ''} can edit this form. 
                Expires in {expiresIn} hours.
              </p>
              <button
                onClick={() => setShareLink('')}
                className="w-full border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] font-medium py-2.5 rounded-xl transition-all"
              >
                Create New Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
