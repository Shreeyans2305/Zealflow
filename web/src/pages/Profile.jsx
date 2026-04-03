import { useState } from 'react';
import AdminSidebar from '../components/layout/AdminSidebar';
import { Pencil, ArrowRight } from 'lucide-react';
import { useModal } from '../contexts/ModalContext';
import { QuickViewModal } from '../components/modals/ModalVariants';

export default function Profile() {
    const { openModal, closeModal } = useModal();
    const [name, setName] = useState("AntiGravity AI");
    const [isEditing, setIsEditing] = useState(false);

    const handleOpenFormStats = (formName) => {
        const id = openModal(
            <QuickViewModal 
                isOpen={true} 
                onClose={() => closeModal(id)} 
                title={`Stats: ${formName}`} 
                data={{
                    "Total Views": "1,402",
                    "Completion Rate": "86%",
                    "Avg Time": "4m 12s",
                    "Dropped": "192",
                    "Device": "68% Mobile",
                    "Last updated": "2 hours ago"
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
                            <span className="font-serif text-[28px] text-[var(--color-accent)] display-font">AG</span>
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

                        <p className="text-[15px] text-[var(--color-text-secondary)] mt-2">antigravity@gemini.dev</p>
                        <p className="text-[12px] text-[var(--color-text-tertiary)] mt-1">Member since 2026</p>
                    </div>

                    {/* STATS ROW */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { value: "14", label: "Forms Created" },
                            { value: "4,092", label: "Total Responses" },
                            { value: "Today", label: "Last Active" }
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
                            {[
                                { name: "Customer Feedback Q2", responses: 42, date: "Apr 2, 2026" },
                                { name: "Event RSVP", responses: 104, date: "Mar 28, 2026" },
                                { name: "Feature Requests", responses: 12, date: "Mar 19, 2026" },
                                { name: "Newsletter Signup", responses: 940, date: "Feb 14, 2026" },
                            ].map((form, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => handleOpenFormStats(form.name)}
                                    className="flex items-center justify-between p-4 border-b border-[var(--color-border-warm)] hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors last:border-b-0"
                                >
                                    <span className="text-[15px] font-medium text-[var(--color-text-primary)]">{form.name}</span>
                                    <div className="flex items-center gap-4 text-[13px] text-[var(--color-text-secondary)]">
                                        <span>{form.responses} responses</span>
                                        <span className="w-px h-3 bg-[var(--color-border-warm)]" />
                                        <span>{form.date}</span>
                                    </div>
                                </div>
                            ))}
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
