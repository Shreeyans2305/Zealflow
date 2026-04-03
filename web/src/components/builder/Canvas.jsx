import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';

import { useFormStore } from '../../store/formStore';
import { useUIStore } from '../../store/uiStore';
import FieldCard from './FieldCard';
import FieldPicker from './FieldPicker';

export default function Canvas() {
  const schema = useFormStore(state => state.schema);
  const reorderFields = useFormStore(state => state.reorderFields);
  const addField = useFormStore(state => state.addField);
  const deselectField = useUIStore(state => state.deselectField);
  
  const [activeId, setActiveId] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderFields(active.id, over.id);
    }
    setActiveId(null);
  };

  const handleDragCancel = () => setActiveId(null);

  const activeField = useMemo(
    () => schema.fields.find((f) => f.id === activeId),
    [activeId, schema.fields]
  );

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.4' } }
    }),
  };

  return (
    <div 
      className="w-full max-w-2xl min-h-full pb-32 pt-8 relative z-10"
      onClick={(e) => {
          if (e.target === e.currentTarget) deselectField();
      }}
    >
      <h1 className="text-display-lg display-font mb-12 text-on-surface bg-transparent border-none outline-none -ml-2 rounded transition-all">
        {schema.title}
      </h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        {/* We use vertical whitespace gap-6 instead of tight grids or lines */}
        <div className="flex flex-col gap-6 relative min-h-[200px]">
          <SortableContext items={schema.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {schema.fields.map(field => (
              <FieldCard key={field.id} field={field} />
            ))}
            
            {schema.fields.length === 0 && (
                <div className="text-center p-12 bg-surface-container-low ghost-border border rounded-lg text-on-surface-variant flex flex-col items-center gap-3">
                    <span className="text-sm">The slate is empty.</span>
                </div>
            )}
          </SortableContext>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeId && activeField ? <FieldCard field={activeField} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-12 relative flex justify-center z-40">
        <button 
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className="flex items-center justify-center w-12 h-12 bg-surface-container-high text-on-surface rounded-full ambient-shadow hover:bg-surface-container-highest transition-all ghost-border focus:outline-none z-10"
        >
          <span className="text-2xl font-light leading-none">+</span>
        </button>
        
        {isPickerOpen && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 mt-4 w-64 bg-surface-container glass-panel rounded-xl ghost-border border ambient-shadow z-50 p-2 transform origin-top transition-all scale-100 opacity-100">
                <FieldPicker onSelect={(type) => { addField(type); setIsPickerOpen(false); }} />
            </div>
        )}
      </div>
    </div>
  );
}
