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

  // We slightly increase activation constraint so click events fire correctly
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
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
      styles: { active: { opacity: '0.9' } }
    }),
  };

  return (
    <div 
      className="w-full max-w-[720px] min-h-full pb-32 pt-8 relative z-10"
      onClick={(e) => {
          if (e.target === e.currentTarget) deselectField();
      }}
    >
      <h1 className="text-4xl display-font mb-12 text-[var(--color-text-primary)] transition-all">
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
        <div className="flex flex-col gap-8 relative min-h-[200px]">
          <SortableContext items={schema.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {schema.fields.map(field => (
              <FieldCard key={field.id} field={field} />
            ))}
            
            {schema.fields.length === 0 && (
                <div className="text-center p-12 bg-[#FFFFFF] border border-[var(--color-border-warm)] rounded-[12px] text-[var(--color-text-secondary)] flex flex-col items-center gap-3">
                    <span className="text-[15px]">The canvas is empty.</span>
                </div>
            )}
          </SortableContext>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeId && activeField ? <FieldCard field={activeField} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
