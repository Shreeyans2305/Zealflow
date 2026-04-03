import { useState } from 'react';
import AdminSidebar from '../components/layout/AdminSidebar';
import { useModal } from '../contexts/ModalContext';
import { ConfirmModal } from '../components/modals/ModalVariants';
import { Copy, Plus, Key, Download } from 'lucide-react';

export default function Settings() {
    const { openModal, closeModal } = useModal();
    const [activeTab, setActiveTab] = useState('account');
    const [notifications, setNotifications] = useState({
        "New response received": true,
        "Weekly summary email": true,
        "Collaborator joins": false,
        "Form published/unpublished": true
    });
    const [appearance, setAppearance] = useState({ theme: 'System', font: 'Medium', width: 'Comfortable' });

    const openPasswordModal = () => {
        const id = openModal(
            <ConfirmModal 
                isOpen={true} 
                onClose={() => closeModal(id)}
                title="Change Password"
                message="Are you sure you want to trigger a password reset? A magic link will be sent to your email."
                onConfirm={() => console.log('Reset triggered')}
                onCancel={() => {}}
            />
        );
    };

    const openDeleteModal = () => {
        const id = openModal(
            <ConfirmModal 
                isOpen={true} 
                onClose={() => closeModal(id)}
                title="Delete Account"
                message="This action is absolutely irreversible. All of your forms, data, and active workspaces will be instantly destroyed. Are you certain?"
                danger={true}
                onConfirm={() => console.log('Account deleted')}
                onCancel={() => {}}
            />
        );
    };

    const navItems = [
        { id: 'account', label: 'Account' },
        { id: 'appearance', label: 'Appearance' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'integrations', label: 'Integrations' },
        { id: 'api', label: 'API & Export' }
    ];

    return (
        <div className="flex min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
            <AdminSidebar />

            <main className="flex-1 overflow-y-auto px-12 py-16">
                <div className="max-w-[900px] mx-auto">
                    <h1 className="text-4xl display-font mb-12">Settings</h1>
                    
                    <div className="flex gap-12">
                        {/* LEFT NAV */}
                        <aside className="w-[200px] flex-shrink-0 flex flex-col gap-1">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full text-left px-4 py-2.5 rounded-[8px] text-[14px] transition-colors ${
                                        activeTab === item.id 
                                            ? 'bg-[#EEECEA] text-[#1C1B19] font-medium' 
                                            : 'text-[var(--color-text-secondary)] hover:text-[#1C1B19]'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </aside>

                        {/* RIGHT CONTENT */}
                        <div className="flex-1 flex flex-col gap-8 min-w-0">
                            {activeTab === 'account' && (
                                <div className="space-y-8 animate-in fade-in duration-150">
                                    <section>
                                        <h2 className="text-[11px] uppercase tracking-[0.08em] text-[#A8A49E] mb-4">Identity</h2>
                                        <div className="flex flex-col gap-4">
                                            <div>
                                                <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Full Name</label>
                                                <input type="text" defaultValue="AntiGravity AI" className="input-base w-full max-w-[400px]" />
                                            </div>
                                            <div>
                                                <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Email address</label>
                                                <div className="flex items-center gap-3">
                                                    <input type="email" defaultValue="antigravity@gemini.dev" readOnly className="input-base w-full max-w-[400px] bg-[var(--color-bg-base)] text-[var(--color-text-secondary)]" />
                                                    <span className="text-[11px] font-medium bg-[#4A7C5915] text-[#4A7C59] px-2 py-1 rounded">Verified</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <h2 className="text-[11px] uppercase tracking-[0.08em] text-[#A8A49E] mb-4">Security</h2>
                                        <div className="py-4 border-b border-[var(--color-border-warm)] flex items-center justify-between">
                                            <div>
                                                <div className="text-[15px] font-medium">Password</div>
                                                <div className="text-[13px] text-[var(--color-text-secondary)] mt-1">Last changed 3 months ago</div>
                                            </div>
                                            <button onClick={openPasswordModal} className="btn-secondary text-[13px] py-2 px-4">Change Password</button>
                                        </div>
                                    </section>

                                    <section className="bg-[#B8404008] border border-[#B8404030] rounded-[12px] p-6 mt-8">
                                        <h2 className="text-[11px] uppercase tracking-[0.08em] text-[#B84040] mb-2 font-medium">Danger Zone</h2>
                                        <div className="flex items-center justify-between">
                                            <div className="text-[13px] text-[#B84040] max-w-[280px]">Permanently remove your account and all associated forms.</div>
                                            <button onClick={openDeleteModal} className="text-[13px] font-medium text-white bg-[#B84040] hover:bg-red-800 rounded px-4 py-2 transition-colors">Delete Account</button>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'appearance' && (
                                <div className="space-y-8 animate-in fade-in duration-150">
                                    <section>
                                        <div className="py-4 border-b border-[var(--color-border-warm)] flex items-center justify-between">
                                            <div>
                                                <div className="text-[15px] font-medium">Theme Base</div>
                                                <div className="text-[13px] text-[var(--color-text-secondary)] mt-1">Light mode only supported directly.</div>
                                            </div>
                                            <div className="flex gap-2 bg-[#F4F3EF] p-1 rounded-[8px]">
                                                {['Light', 'System'].map(t => (
                                                    <button key={t} onClick={() => setAppearance(p => ({...p, theme: t}))} className={`px-4 py-1.5 text-[13px] font-medium rounded transition-colors ${appearance.theme === t ? 'bg-[#FFFFFF] text-[#1C1B19] shadow-sm' : 'text-[#6B6860] hover:text-[#1C1B19]'}`}>{t}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="py-4 border-b border-[var(--color-border-warm)] flex items-center justify-between">
                                            <div>
                                                <div className="text-[15px] font-medium">Font Scale</div>
                                                <div className="text-[13px] text-[var(--color-text-secondary)] mt-1">Base sizing for editor.</div>
                                            </div>
                                            <div className="flex gap-2">
                                                {['Small', 'Medium', 'Large'].map(sz => (
                                                    <button key={sz} onClick={() => setAppearance(p => ({...p, font: sz}))} className={`px-4 py-1.5 border rounded-[20px] text-[13px] font-medium transition-colors ${appearance.font === sz ? 'bg-[#1C1B19] text-[#FFFFFF] border-[#1C1B19]' : 'border-[var(--color-border-warm)] text-[var(--color-text-secondary)] hover:border-[#1C1B19]'}`}>{sz}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="py-4 border-b border-[var(--color-border-warm)] flex items-center justify-between">
                                            <div>
                                                <div className="text-[15px] font-medium">Language</div>
                                                <div className="text-[13px] text-[var(--color-text-secondary)] mt-1">Dashboard locale.</div>
                                            </div>
                                            <select className="input-base text-[13px]">
                                                <option>English (US)</option>
                                                <option>Spanish</option>
                                                <option>Japanese</option>
                                            </select>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-4 animate-in fade-in duration-150">
                                    <h2 className="text-[11px] uppercase tracking-[0.08em] text-[#A8A49E] mb-4">Email Preferences</h2>
                                    {Object.entries(notifications).map(([key, value]) => (
                                        <div key={key} className="py-4 border-b border-[var(--color-border-warm)] flex items-center justify-between last:border-0">
                                            <div className="text-[15px] font-medium">{key}</div>
                                            <button 
                                                onClick={() => setNotifications(p => ({...p, [key]: !value}))}
                                                className={`w-11 h-6 rounded-full relative transition-colors duration-150 ease-out flex items-center focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-base)] ${value ? 'bg-[#1C1B19]' : 'bg-[#E5E3DD]'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-150 ease-out absolute ${value ? 'translate-x-[22px]' : 'translate-x-[4px]'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'integrations' && (
                                <div className="space-y-6 animate-in fade-in duration-150">
                                    {[
                                        { name: 'Slack', desc: 'Send responses to channels.', status: 'Connected ✓', active: true },
                                        { name: 'Zapier', desc: 'Automate forms with 5000+ apps.', status: 'Connect', active: false },
                                        { name: 'CSV Auto-export', desc: 'Daily dumps to your inbox.', status: 'Connect', active: false },
                                        { name: 'Webhooks', desc: 'Send JSON payloads to your servers.', status: 'Connect', active: false },
                                    ].map(int => (
                                        <div key={int.name} className="p-5 border border-[var(--color-border-warm)] rounded-[12px] bg-[#FFFFFF] flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-[#F4F3EF] rounded flex items-center justify-center">
                                                    <Plus size={18} className="text-[#A8A49E]" />
                                                </div>
                                                <div>
                                                    <div className="text-[15px] font-medium">{int.name}</div>
                                                    <div className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">{int.desc}</div>
                                                </div>
                                            </div>
                                            <button className={int.active ? 'text-[#4A7C59] font-medium text-[13px]' : 'btn-secondary text-[13px] py-1.5 px-4'}>
                                                {int.status}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'api' && (
                                <div className="space-y-8 animate-in fade-in duration-150">
                                    <section>
                                        <h2 className="text-[11px] uppercase tracking-[0.08em] text-[#A8A49E] mb-4">Access Tokens</h2>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                                                <input readOnly value="sk_live_9f8d7e6c_antigravity" className="input-base w-full pl-10 font-mono text-[13px] text-[var(--color-text-secondary)] bg-[#F4F3EF]" />
                                            </div>
                                            <button className="btn-secondary p-2.5" title="Copy"><Copy size={16} /></button>
                                            <button className="px-4 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[#1C1B19] transition-colors">Regenerate</button>
                                        </div>
                                    </section>
                                    
                                    <section>
                                        <h2 className="text-[11px] uppercase tracking-[0.08em] text-[#A8A49E] mb-4">Export Data</h2>
                                        <div className="py-4 border-t border-b border-[var(--color-border-warm)] flex items-center justify-between">
                                            <div>
                                                <div className="text-[15px] font-medium">Download Archive</div>
                                                <div className="text-[13px] text-[var(--color-text-secondary)] mt-1">Export all schema definitions and responses as a ZIP file.</div>
                                            </div>
                                            <button className="flex items-center gap-2 btn-secondary text-[13px] py-2 px-4"><Download size={14} /> Download ZIP</button>
                                        </div>
                                    </section>

                                    <section>
                                        <h2 className="text-[11px] uppercase tracking-[0.08em] text-[#A8A49E] mb-4">Usage</h2>
                                        <div className="bg-[#FFFFFF] border border-[var(--color-border-warm)] p-6 rounded-[12px]">
                                            <div className="flex justify-between text-[13px] mb-2 font-medium">
                                                <span>API Requests Today</span>
                                                <span className="text-[var(--color-text-secondary)]">240 / 10,000</span>
                                            </div>
                                            <div className="h-2 w-full bg-[#E5E3DD] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#1C1B19]" style={{ width: '2.4%' }} />
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
