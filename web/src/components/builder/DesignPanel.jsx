import { useEffect, useState } from 'react';
import { useFormStore } from '../../store/formStore';
import { X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

const TEMPLATES = [
    { 
        id: 'minimal', 
        label: 'Warm Minimal', 
        css: "/* Default Soft Canvas */\n:root {\n  --color-bg-base: #FAFAF8;\n  --color-bg-surface: #F4F3EF;\n  --color-border-warm: #E5E3DD;\n  --color-text-primary: #1C1B19;\n  --color-text-secondary: #6B6860;\n  --color-accent: #C17F3E;\n}" 
    },
    { 
        id: 'dark', 
        label: 'Nocturnal Glass', 
        css: "/* Atmospheric Dark Mode */\n:root {\n  --color-bg-base: #000000;\n  --color-bg-surface: #111111;\n  --color-text-primary: #FFFFFF;\n  --color-text-secondary: #999999;\n  --color-border-warm: #222222;\n  --color-accent: #4F46E5;\n}\n.card, .input-base {\n  background: rgba(255,255,255,0.03);\n  backdrop-filter: blur(16px);\n  border-color: #333333;\n  color: #FFFFFF;\n}" 
    },
    { 
        id: 'brutalist', 
        label: 'Brutalist Studio', 
        css: "/* High Contrast Industrial */\n:root {\n  --color-bg-base: #FFFFFF;\n  --color-bg-surface: #FFFFFF;\n  --color-text-primary: #000000;\n  --color-text-secondary: #000000;\n  --color-border-warm: #000000;\n  --color-accent: #FF0000;\n}\n.card, .input-base {\n  border: 3px solid #000000;\n  box-shadow: 6px 6px 0px #000000;\n  border-radius: 0px;\n}\nbutton.btn-primary {\n  border-radius: 0px;\n  text-transform: uppercase;\n  letter-spacing: 0.1em;\n}" 
    }
];

export default function DesignPanel() {
    const schema = useFormStore(state => state.schema);
    const updateTheme = useFormStore(state => state.updateTheme);
    const updateSettings = useFormStore(state => state.updateSettings);
    const setTab = useUIStore(state => state.setTab);
    const [mailingListText, setMailingListText] = useState('');
    const [publishMessage, setPublishMessage] = useState('');

    useEffect(() => {
        setMailingListText((schema.settings.mailingListEmails || []).join('\n'));
        setPublishMessage(schema.settings.publishEmailMessage || '');
    }, [schema.id, schema.settings.mailingListEmails, schema.settings.publishEmailMessage]);

    return (
        <aside className="absolute right-0 top-0 bottom-0 w-[400px] bg-[var(--color-bg-surface)] border-l border-[var(--color-border-warm)] shadow-2xl transition-transform duration-200 ease-out z-50 flex flex-col translate-x-0 overflow-hidden">
            <div className="absolute -top-14 -left-8 w-40 h-40 rounded-full bg-[var(--color-accent-soft)] blur-3xl pointer-events-none opacity-70" />
            <div className="flex items-center justify-between p-8 border-b border-[var(--color-border-warm)] bg-white/55 backdrop-blur-sm relative z-10">
                <div>
                    <h2 className="label-upper text-[var(--color-text-primary)]">Design Engine</h2>
                    <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">Configure layout visuals.</p>
                </div>
                <button onClick={() => setTab('builder')} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2">
                    <X size={18} strokeWidth={1.5} />
                </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-10 custom-scrollbar relative z-10">
                <div>
                    <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-4">Preset Aesthetic Tiers</label>
                    <div className="flex flex-col gap-3">
                        {TEMPLATES.map(t => (
                            <button 
                                key={t.id}
                                onClick={() => updateTheme({ preset: t.id, customCSS: t.css })}
                                className={`p-4 border rounded-[16px] text-left transition-all shadow-sm ${schema.theme.preset === t.id ? 'border-[var(--color-accent)] ring-1 ring-[#C17F3E20] bg-white' : 'border-[var(--color-border-warm)] bg-white/80 hover:border-[#1C1B19]'}`}
                            >
                                <span className="text-[14px] font-medium text-[var(--color-text-primary)]">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-8 border-t border-[var(--color-border-warm)]">
                    <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Custom Raw CSS</label>
                    <p className="text-[12px] text-[var(--color-text-tertiary)] mb-4 leading-relaxed">
                        Override styling at the root layout block. Directly modifies `.card`, `.btn-primary`, and <code>:root</code> level variables.
                    </p>
                    <textarea 
                        value={schema.theme.customCSS || ''}
                        onChange={(e) => updateTheme({ preset: 'custom', customCSS: e.target.value })}
                        className="w-full h-[320px] p-4 text-[12px] font-mono bg-white/80 border border-[var(--color-border-warm)] rounded-[16px] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-text-primary)] resize-vertical shadow-inner"
                        placeholder="/* Inject rules... */"
                    />
                </div>

                <div className="pt-8 border-t border-[var(--color-border-warm)] space-y-4">
                    <div>
                        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Mailing List</label>
                        <p className="text-[12px] text-[var(--color-text-tertiary)] mb-3 leading-relaxed">
                            Add one email per line. When you publish, each address will receive the form link from verify.pragaticonnect@gmail.com.
                        </p>
                        <textarea
                            value={mailingListText}
                            onChange={(e) => {
                                const value = e.target.value;
                                setMailingListText(value);
                                updateSettings({
                                    mailingListEmails: value.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean),
                                });
                            }}
                            className="w-full h-[140px] p-4 text-[13px] font-mono bg-[#F4F3EF] border border-[var(--color-border-warm)] rounded-[8px] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-text-primary)] resize-vertical"
                            placeholder="first@example.com\nsecond@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Publish Email Message</label>
                        <textarea
                            value={publishMessage}
                            onChange={(e) => {
                                const value = e.target.value;
                                setPublishMessage(value);
                                updateSettings({ publishEmailMessage: value });
                            }}
                            className="w-full h-[140px] p-4 text-[13px] bg-[#F4F3EF] border border-[var(--color-border-warm)] rounded-[8px] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] text-[var(--color-text-primary)] resize-vertical"
                            placeholder="Write a custom message for subscribers..."
                        />
                    </div>
                </div>
            </div>
        </aside>
    );
}
