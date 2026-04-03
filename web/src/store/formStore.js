import { create } from 'zustand';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';

const initialSchema = {
  id: "form_1",
  title: "Untitled form",
  version: 1,
  settings: {
    mode: "typeform",
    showProgressBar: true,
    submitLabel: "Submit",
    thankYouMessage: "Thank you!"
  },
  theme: {
    preset: "minimal",
    primaryColor: "#4F46E5",
    fontFamily: "Inter",
    customCSS: ""
  },
  fields: [],
  logicRules: []
};

// Undo/Redo middleware implementation
const withHistory = (config) => (set, get, api) => {
  let history = [structuredClone(initialSchema)];
  let pointer = 0;
  const maxHistory = 100;

  const setWithHistory = (fn) => {
    set((currentState) => {
      // Use Immer to produce the next schema
      const nextSchema = produce(currentState.schema, fn);
      
      // If no change, return current state
      if (nextSchema === currentState.schema) return currentState;

      // Slice history to current pointer (discards redo stack)
      history = history.slice(0, pointer + 1);
      history.push(nextSchema);
      
      if (history.length > maxHistory) {
        history.shift();
      } else {
        pointer++;
      }

      return { schema: nextSchema };
    });
  };

  const undo = () => {
    if (pointer > 0) {
      pointer--;
      set({ schema: history[pointer] });
    }
  };

  const redo = () => {
    if (pointer < history.length - 1) {
      pointer++;
      set({ schema: history[pointer] });
    }
  };

  return config(setWithHistory, get, api, undo, redo);
};

export const useFormStore = create(
  withHistory((setSchema, get, api, undo, redo) => ({
    schema: initialSchema,
    
    // History Actions
    undo,
    redo,
    
    // Form Metadata Actions
    updateTitle: (title) => setSchema(draft => { draft.title = title }),
    updateSettings: (settings) => setSchema(draft => { Object.assign(draft.settings, settings) }),
    updateTheme: (theme) => setSchema(draft => { Object.assign(draft.theme, theme) }),

    // Field Actions
    addField: (type) => setSchema(draft => {
      const fieldId = `field_${uuidv4()}`;
      draft.fields.push({
        id: fieldId,
        type,
        label: "New Question",
        placeholder: "Type your answer...",
        required: false,
        validation: {},
        meta: { hidden: false, width: "full" }
      });
    }),
    updateField: (id, updates) => setSchema(draft => {
      const idx = draft.fields.findIndex(f => f.id === id);
      if (idx !== -1) {
        Object.assign(draft.fields[idx], updates);
      }
    }),
    deleteField: (id) => setSchema(draft => {
      draft.fields = draft.fields.filter(f => f.id !== id);
      // Automatically clean up logic rules referencing this field
      draft.logicRules = draft.logicRules.map(rule => {
        rule.conditions = rule.conditions.filter(c => c.fieldId !== id);
        return rule;
      }).filter(rule => rule.conditions.length > 0 && rule.action.targetFieldId !== id);
    }),
    reorderFields: (activeId, overId) => setSchema(draft => {
      const oldIndex = draft.fields.findIndex(f => f.id === activeId);
      const newIndex = draft.fields.findIndex(f => f.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const [movedField] = draft.fields.splice(oldIndex, 1);
        draft.fields.splice(newIndex, 0, movedField);
      }
    }),

    // Logic Rules Actions
    addLogicRule: (rule) => setSchema(draft => {
      draft.logicRules.push({ id: `rule_${uuidv4()}`, ...rule });
    }),
    updateLogicRule: (id, updates) => setSchema(draft => {
      const idx = draft.logicRules.findIndex(r => r.id === id);
      if (idx !== -1) {
        Object.assign(draft.logicRules[idx], updates);
      }
    }),
    deleteLogicRule: (id) => setSchema(draft => {
      draft.logicRules = draft.logicRules.filter(r => r.id !== id);
    }),
  }))
);
