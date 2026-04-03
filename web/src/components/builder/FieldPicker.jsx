import { Type, Hash, Mail, Calendar, List } from 'lucide-react';

const FIELD_TYPES = [
    { id: 'text', label: 'Short Text', icon: <Type size={16} /> },
    { id: 'longtext', label: 'Long Text', icon: <Type size={16} /> },
    { id: 'number', label: 'Number', icon: <Hash size={16} /> },
    { id: 'email', label: 'Email', icon: <Mail size={16} /> },
    { id: 'date', label: 'Date', icon: <Calendar size={16} /> },
    { id: 'dropdown', label: 'Dropdown', icon: <List size={16} /> }
];

export default function FieldPicker({ onSelect }) {
    return (
        <div className="flex flex-col gap-1 p-2">
            <div className="px-3 py-2 text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.1em] border-b border-white/5 mb-2 pb-3">
                Nodes
            </div>
            {FIELD_TYPES.map(type => (
                <button
                    key={type.id}
                    onClick={() => onSelect(type.id)}
                    className="flex items-center gap-4 px-3 py-3 text-sm text-on-surface hover:bg-surface-container-high rounded-md transition-colors w-full text-left"
                >
                    <div className="text-on-surface-variant opacity-70">
                        {type.icon}
                    </div>
                    {type.label}
                </button>
            ))}
        </div>
    );
}
