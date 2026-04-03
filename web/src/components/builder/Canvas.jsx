import { Fragment, useMemo, useState } from 'react';
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
import { fieldRegistry } from '../../registry/fieldRegistry';

export default function Canvas() {
  const schema = useFormStore(state => state.schema);
  const addFieldAtIndex = useFormStore(state => state.addFieldAtIndex);
  const reorderFields = useFormStore(state => state.reorderFields);
  const deselectField = useUIStore(state => state.deselectField);
  const currentPageId = useUIStore(state => state.currentPageId);
  
  const [activeId, setActiveId] = useState(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const [hoverInsertIndex, setHoverInsertIndex] = useState(null);
  const [draggedFieldType, setDraggedFieldType] = useState(null);

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
      reorderFields(active.id, over.id, currentPageId || null);
    }
    setActiveId(null);
  };

  const handleDragCancel = () => setActiveId(null);

  const handleNativeDrop = (event) => {
    const type = event.dataTransfer.getData('application/zealflow-field-type') || draggedFieldType;
    if (!type) return;
    event.preventDefault();
    event.stopPropagation();
    const insertIndex = hoverInsertIndex ?? pageFields.length;
    addFieldAtIndex(type, currentPageId || schema?.settings?.pages?.[0]?.id || null, insertIndex);
    setIsDropActive(false);
    setHoverInsertIndex(null);
    setDraggedFieldType(null);
  };

  const pageId = currentPageId || schema?.settings?.pages?.[0]?.id;
  const pageFields = useMemo(
    () => schema.fields.filter((f) => (f.meta?.pageId || schema?.settings?.pages?.[0]?.id) === pageId),
    [schema.fields, schema?.settings?.pages, pageId]
  );

  const activeField = useMemo(
    () => pageFields.find((f) => f.id === activeId),
    [activeId, pageFields]
  );

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0.9' } }
    }),
  };

  return (
    <div 
      className={`w-full max-w-[720px] min-h-full pb-32 pt-8 relative z-10 ${isDropActive ? 'ring-2 ring-[var(--color-accent)] ring-offset-4 ring-offset-[var(--color-bg-base)] rounded-[16px]' : ''}`}
      onClick={(e) => {
          if (e.target === e.currentTarget) deselectField();
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/zealflow-field-type')) {
          e.preventDefault();
          setIsDropActive(true);
          const type = e.dataTransfer.getData('application/zealflow-field-type');
          if (type) setDraggedFieldType(type);

          const cards = Array.from(e.currentTarget.querySelectorAll('[data-page-field="true"]'));
          if (cards.length === 0) {
            setHoverInsertIndex(0);
            return;
          }

          const y = e.clientY;
          let nextIndex = cards.length;
          for (let i = 0; i < cards.length; i += 1) {
            const rect = cards[i].getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            if (y < midpoint) {
              nextIndex = i;
              break;
            }
          }
          setHoverInsertIndex(nextIndex);
        }
      }}
      onDragEnter={(e) => {
        if (e.dataTransfer.types.includes('application/zealflow-field-type')) {
          setIsDropActive(true);
          const type = e.dataTransfer.getData('application/zealflow-field-type');
          if (type) setDraggedFieldType(type);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDropActive(false);
        setHoverInsertIndex(null);
        setDraggedFieldType(null);
      }}
      onDrop={handleNativeDrop}
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
          <SortableContext items={pageFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {pageFields.map((field, index) => (
              <Fragment key={field.id}>
                {isDropActive && draggedFieldType && hoverInsertIndex === index && (
                  <div className="group relative flex items-start bg-[#FFFFFF] border border-dashed border-[var(--color-accent)] rounded-[12px] p-6 w-full opacity-80">
                    <div className="pt-[2px] pr-4 text-[var(--color-text-secondary)] opacity-60">
                      {fieldRegistry[draggedFieldType]?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[17px] font-medium text-[var(--color-text-primary)] truncate mb-1 display-font">
                        {fieldRegistry[draggedFieldType]?.label || 'New Field'}
                      </h3>
                      <p className="text-[13px] text-[var(--color-text-tertiary)] italic">Preview insertion point</p>
                    </div>
                  </div>
                )}
                <FieldCard field={field} />
              </Fragment>
            ))}

            {isDropActive && draggedFieldType && hoverInsertIndex === pageFields.length && (
              <div className="group relative flex items-start bg-[#FFFFFF] border border-dashed border-[var(--color-accent)] rounded-[12px] p-6 w-full opacity-80">
                <div className="pt-[2px] pr-4 text-[var(--color-text-secondary)] opacity-60">
                  {fieldRegistry[draggedFieldType]?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-medium text-[var(--color-text-primary)] truncate mb-1 display-font">
                    {fieldRegistry[draggedFieldType]?.label || 'New Field'}
                  </h3>
                  <p className="text-[13px] text-[var(--color-text-tertiary)] italic">Preview insertion point</p>
                </div>
              </div>
            )}
            
            {pageFields.length === 0 && !isDropActive && (
                <div className="text-center p-12 bg-[#FFFFFF] border border-[var(--color-border-warm)] rounded-[12px] text-[var(--color-text-secondary)] flex flex-col items-center gap-3">
                    <span className="text-[15px]">This page has no fields yet.</span>
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
