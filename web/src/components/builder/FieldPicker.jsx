import { getFieldTypesArray } from '../../registry/fieldRegistry';

export default function FieldPicker({ onSelect }) {
    const fields = getFieldTypesArray();

    const handleDragStart = (event, type) => {
        event.dataTransfer.setData('application/zealflow-field-type', type);
        event.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="flex flex-col p-1 bg-[#FFFFFF] rounded-[14px]">
            <div className="px-4 py-3 label-upper border-b border-[var(--color-border-warm)] mb-2 mt-1">
                Insert Element
            </div>
            {fields.map(type => (
                <button
                    key={type.type}
                    onClick={() => onSelect(type.type)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, type.type)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-[8px] transition-colors w-full text-left"
                >
                    <div className="text-[var(--color-text-secondary)]">
                        {type.icon}
                    </div>
                    {type.label}
                </button>
            ))}
        </div>
    );
}
