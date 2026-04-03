import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Hash, Type, Mail, Calendar } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

const ICONS = {
    text: <Type size={16} />,
    longtext: <Type size={16} />,
    number: <Hash size={16} />,
    email: <Mail size={16} />,
    date: <Calendar size={16} />,
    default: <Type size={16} />
};

export default function FieldCard({ field, isOverlay }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const selectField = useUIStore(state => state.selectField);
  const selectedFieldId = useUIStore(state => state.selectedFieldId);
  const isSelected = selectedFieldId === field.id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectField(field.id)}
      className={`group relative flex items-start bg-surface-container hover:bg-surface-container-high rounded-xl p-6 w-full cursor-pointer transition-all ${
        isSelected ? 'bg-surface-container-highest ambient-shadow' : ''
      } ${isOverlay ? 'ambient-shadow backdrop-blur-md' : ''}`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-[-16px] top-1/2 -translate-y-1/2 p-2 text-on-surface-variant opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity bg-surface-container-high rounded-full ghost-border ambient-shadow"
      >
        <GripVertical size={14} />
      </div>

      <div className="pt-1 pr-4 text-on-surface-variant opacity-50 group-hover:opacity-100 transition-opacity">
        {ICONS[field.type] || ICONS.default}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-medium text-on-surface truncate mb-1 display-font">
          {field.label} {field.required && <span className="text-error">*</span>}
        </h3>
        <p className="text-sm text-on-surface-variant italic opacity-70">
          {field.placeholder || 'No placeholder'}
        </p>
      </div>
    </div>
  );
}
