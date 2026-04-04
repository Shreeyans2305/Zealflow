import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { fieldRegistry } from '../../registry/fieldRegistry';

export default function FieldCard({ field, isOverlay }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const selectField = useUIStore(state => state.selectField);
  const selectedFieldId = useUIStore(state => state.selectedFieldId);
  const isSelected = selectedFieldId === field.id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.9 : 1,
  };

  const fieldDef = fieldRegistry[field.type] || fieldRegistry['text'];

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-page-field="true"
      data-field-id={field.id}
      onClick={() => selectField(field.id)}
      className={`zealflow-field-card group relative flex items-start border rounded-[12px] p-6 w-full cursor-pointer transition-all duration-150 ease-out ${
        isSelected ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent-soft)]' : 'border-[var(--color-border-warm)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
      } ${isOverlay ? 'shadow-xl scale-[1.02]' : ''}`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-[-16px] top-1/2 -translate-y-1/2 p-2 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity bg-[var(--color-bg-surface)] border border-[var(--color-border-warm)] shadow-sm rounded-full"
      >
        <GripVertical size={14} />
      </div>

      <div className="pt-[2px] pr-4 text-[var(--color-text-secondary)] opacity-60 group-hover:opacity-100 transition-opacity">
        {fieldDef.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-[17px] font-medium text-[var(--color-text-primary)] truncate mb-1 display-font">
          {field.label} {field.required && <span className="text-[var(--color-error)] ml-1">*</span>}
        </h3>
        <p className="text-[13px] text-[var(--color-text-tertiary)] italic">
          {field.placeholder || 'No placeholder provided'}
        </p>
      </div>
    </div>
  );
}
