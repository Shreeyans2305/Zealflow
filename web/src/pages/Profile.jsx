import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../components/layout/AdminSidebar';
import { Pencil, ArrowRight } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';
import { QuickViewModal } from '../components/modals/ModalVariants';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/apiClient';

function formatDate(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function Profile() {
    const { openModal, closeModal } = useModal();
    const admin = useAuthStore((s) => s.admin);
    const [name, setName] = useState(admin?.username || '');
    const [isEditing, setIsEditing] = useState(false);
    const [summary, setSummary] = useState({
        forms_created: 0,
        total_responses: 0,
        member_since: null,
        last_activity_at: null,
        recent_forms: [],
    });
    const [loadingSummary, setLoadingSummary] = useState(true);

    useEffect(() => {
        setName(admin?.username || '');
    }, [admin?.username]);

    useEffect(() => {
        let cancelled = false;

        async function loadSummary() {
            setLoadingSummary(true);
            try {
                const data = await api.get('/api/auth/profile-summary');
                if (!cancelled) setSummary(data);
            } catch (_) {
                if (!cancelled) {
                    setSummary({
                        forms_created: 0,
                        total_responses: 0,
                        member_since: admin?.created_at || null,
                        last_activity_at: admin?.created_at || null,
                        recent_forms: [],
                    });
                }
            } finally {
                if (!cancelled) setLoadingSummary(false);
            }
        }

        loadSummary();
        return () => { cancelled = true; };
    }, [admin?.created_at]);

    const initials = useMemo(() => {
        const source = name || admin?.username || admin?.email || 'A';
        const parts = source.split(/[^A-Za-z0-9]+/).filter(Boolean);
        const value = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
        return value || 'A';
    }, [name, admin?.username, admin?.email]);

    const handleOpenFormStats = (form) => {
        const id = openModal(
            <QuickViewModal 
                isOpen={true} 
                onClose={() => closeModal(id)} 
                title={`Stats: ${form.title}`} 
                data={{
                    "Responses": form.response_count,
                    "Fields": form.field_count,
                    "Last response": formatDateTime(form.last_response_at),
                    "Updated": formatDateTime(form.updated_at),
                }} 
            />
        );
    };

    return (
        <div className="flex min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
            <AdminSidebar />

            <main className="flex-1 overflow-y-auto w-full relative py-20 px-8">
                <div className="max-w-[600px] mx-auto flex flex-col gap-12">
                    
                    {/* AVATAR BLOCK */}
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-[var(--color-accent-soft)] rounded-full flex items-center justify-center mb-4">
                            <span className="font-serif text-[28px] text-[var(--color-accent)] display-font">{initials}</span>
                        </div>
                        <button className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-medium mb-6">
                            Change photo
                        </button>

                        <div className="flex items-center gap-2 group cursor-pointer relative" onClick={() => setIsEditing(true)}>
                            {isEditing ? (
                                <input 
                                    autoFocus
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onBlur={() => setIsEditing(false)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') setIsEditing(false) }}
                                    className="text-[24px] display-font text-[var(--color-text-primary)] bg-transparent border-b border-[var(--color-text-primary)] outline-none w-[200px] text-center"
                                />
                            ) : (
                                <>
                                    <h1 className="text-[24px] display-font text-[var(--color-text-primary)]">{name}</h1>
                                    <Pencil size={14} className="text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </>
                            )}
                        </div>

                        <p className="text-[15px] text-[var(--color-text-secondary)] mt-2">{admin?.email || '—'}</p>
                        <p className="text-[12px] text-[var(--color-text-tertiary)] mt-1">Member since {formatDate(summary.member_since || admin?.created_at)}</p>
                    </div>

                    {/* STATS ROW */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { value: summary.forms_created, label: "Forms Created" },
                            { value: summary.total_responses, label: "Total Responses" },
                            { value: formatDate(summary.last_activity_at), label: "Last Active" }
                        ].map(stat => (
                            <div key={stat.label} className="bg-[var(--color-bg-surface)] rounded-[12px] p-5 text-center flex flex-col gap-1 border border-[var(--color-border-warm)]">
                                <span className="text-[28px] display-font text-[var(--color-text-primary)]">{stat.value}</span>
                                <span className="label-upper">{stat.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* RECENT FORMS */}
                    <div className="flex flex-col gap-4">
                        <h2 className="label-upper text-[var(--color-text-primary)]">Recent Activity</h2>
                        
                        <div className="bg-[#FFFFFF] border border-[var(--color-border-warm)] rounded-[12px] overflow-hidden">
                            {loadingSummary ? (
                                <div className="p-4 text-[13px] text-[var(--color-text-secondary)]">Loading recent forms…</div>
                            ) : summary.recent_forms.length === 0 ? (
                                <div className="p-4 text-[13px] text-[var(--color-text-secondary)]">No form activity yet.</div>
                            ) : (
                                summary.recent_forms.map((form) => (
                                    <div 
                                        key={form.id} 
                                        onClick={() => handleOpenFormStats(form)}
                                        className="flex items-center justify-between p-4 border-b border-[var(--color-border-warm)] hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors last:border-b-0"
                                    >
                                        <span className="text-[15px] font-medium text-[var(--color-text-primary)]">{form.title}</span>
                                        <div className="flex items-center gap-4 text-[13px] text-[var(--color-text-secondary)]">
                                            <span>{form.response_count} responses</span>
                                            <span className="w-px h-3 bg-[var(--color-border-warm)]" />
                                            <span>{formatDate(form.last_response_at || form.updated_at || form.created_at)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button className="text-[13px] text-[var(--color-accent)] font-medium flex items-center justify-end gap-1 hover:text-[var(--color-text-primary)] transition-colors mt-2">
                            View all <ArrowRight size={14} />
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}
