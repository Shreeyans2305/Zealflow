import { Layers } from 'lucide-react';
import FieldPicker from '../builder/FieldPicker';
import { useFormStore } from '../../store/formStore';

export default function LeftSidebar() {
  const addField = useFormStore(state => state.addField);

  return (
    <aside className="w-[260px] flex-shrink-0 bg-[var(--color-bg-surface)] border-r border-[var(--color-border-warm)] flex flex-col h-full hidden md:flex transition-all duration-150 ease-out z-20 overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="p-6 border-b border-[var(--color-border-warm)] shrink-0 bg-[#F4F3EF] sticky top-0 z-10">
        <button className="w-full text-left p-2 rounded hover:bg-[var(--color-bg-hover)] transition-colors flex items-center gap-3">
          <Layers size={16} strokeWidth={1.5} className="text-[var(--color-text-secondary)]" />
          <span className="text-[13px] font-medium text-[var(--color-text-primary)]">Start Screen</span>
        </button>
        <ul className="mt-2 pl-9">
          <li className="text-[13px] text-[var(--color-text-secondary)] py-1 border-l border-[var(--color-border-warm)] pl-3 ml-[6px]">Main Form</li>
        </ul>
      </div>
      
      <div className="p-4 flex-grow relative pb-12 w-full">
        <FieldPicker onSelect={(type) => addField(type)} />
      </div>
    </aside>
  );
}
