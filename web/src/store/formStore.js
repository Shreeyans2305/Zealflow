import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { fieldRegistry } from '../registry/fieldRegistry';
const createEmptySchema = (overrides = {}) => ({
  id: `form_${uuidv4().slice(0, 8)}`,
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
  logicRules: [],
  ...overrides,
});

const initialSchema = createEmptySchema({ id: 'form_1' });
const maxHistory = 100;

export const useFormStore = create(
  persist(
    (set, get) => ({
      forms: [initialSchema],
    currentFormId: initialSchema.id,
    schema: initialSchema,
    history: [structuredClone(initialSchema)],
    historyPointer: 0,

    createForm: () => {
      const newForm = createEmptySchema();
      set((state) => ({
        forms: [...state.forms, newForm],
        currentFormId: newForm.id,
        schema: newForm,
        history: [structuredClone(newForm)],
        historyPointer: 0,
      }));
      return newForm.id;
    },

    selectForm: (id) => {
      const target = get().forms.find((form) => form.id === id);
      if (!target) return false;

      set({
        currentFormId: target.id,
        schema: target,
        history: [structuredClone(target)],
        historyPointer: 0,
      });

      return true;
    },

    deleteForm: (id) => {
      set((state) => {
        if (state.forms.length <= 1) return state;

        const nextForms = state.forms.filter((form) => form.id !== id);
        if (nextForms.length === state.forms.length) return state;

        const nextCurrentId = state.currentFormId === id ? nextForms[0].id : state.currentFormId;
        const nextSchema = nextForms.find((form) => form.id === nextCurrentId) || nextForms[0];

        return {
          forms: nextForms,
          currentFormId: nextCurrentId,
          schema: nextSchema,
          history: [structuredClone(nextSchema)],
          historyPointer: 0,
        };
      });
    },

    applyToCurrentSchema: (fn) => {
      set((state) => {
        const nextSchema = produce(state.schema, fn);
        if (nextSchema === state.schema) return state;

        const nextForms = state.forms.map((form) => (
          form.id === state.currentFormId ? nextSchema : form
        ));

        const trimmedHistory = state.history.slice(0, state.historyPointer + 1);
        trimmedHistory.push(structuredClone(nextSchema));

        if (trimmedHistory.length > maxHistory) {
          trimmedHistory.shift();
        }

        return {
          forms: nextForms,
          schema: nextSchema,
          history: trimmedHistory,
          historyPointer: Math.min(trimmedHistory.length - 1, maxHistory - 1),
        };
      });
    },
    
    // History Actions
    undo: () => {
      set((state) => {
        if (state.historyPointer <= 0) return state;

        const nextPointer = state.historyPointer - 1;
        const nextSchema = state.history[nextPointer];
        const nextForms = state.forms.map((form) => (
          form.id === state.currentFormId ? nextSchema : form
        ));

        return {
          historyPointer: nextPointer,
          schema: nextSchema,
          forms: nextForms,
        };
      });
    },
    redo: () => {
      set((state) => {
        if (state.historyPointer >= state.history.length - 1) return state;

        const nextPointer = state.historyPointer + 1;
        const nextSchema = state.history[nextPointer];
        const nextForms = state.forms.map((form) => (
          form.id === state.currentFormId ? nextSchema : form
        ));

        return {
          historyPointer: nextPointer,
          schema: nextSchema,
          forms: nextForms,
        };
      });
    },
    
    // Form Metadata Actions
    updateTitle: (title) => get().applyToCurrentSchema(draft => { draft.title = title }),
    updateSettings: (settings) => get().applyToCurrentSchema(draft => { Object.assign(draft.settings, settings) }),
    updateTheme: (theme) => get().applyToCurrentSchema(draft => { Object.assign(draft.theme, theme) }),

    // Field Actions
    addField: (type) => get().applyToCurrentSchema(draft => {
      const fieldId = `field_${uuidv4()}`;
      const defaultFieldSchema = fieldRegistry[type]?.defaultSchema || {};
      
      draft.fields.push({
        id: fieldId,
        type,
        label: "New Question",
        placeholder: defaultFieldSchema.placeholder || "Type your answer...",
        required: false,
        validation: {},
        meta: { 
            hidden: false, 
            width: "full",
            ...defaultFieldSchema 
        }
      });
    }),
    updateField: (id, updates) => get().applyToCurrentSchema(draft => {
      const idx = draft.fields.findIndex(f => f.id === id);
      if (idx !== -1) {
        Object.assign(draft.fields[idx], updates);
      }
    }),
    deleteField: (id) => get().applyToCurrentSchema(draft => {
      draft.fields = draft.fields.filter(f => f.id !== id);
      // Automatically clean up logic rules referencing this field
      draft.logicRules = draft.logicRules.map(rule => {
        rule.conditions = rule.conditions.filter(c => c.fieldId !== id);
        return rule;
      }).filter(rule => rule.conditions.length > 0 && rule.action.targetFieldId !== id);
    }),
    reorderFields: (activeId, overId) => get().applyToCurrentSchema(draft => {
      const oldIndex = draft.fields.findIndex(f => f.id === activeId);
      const newIndex = draft.fields.findIndex(f => f.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const [movedField] = draft.fields.splice(oldIndex, 1);
        draft.fields.splice(newIndex, 0, movedField);
      }
    }),

    // Logic Rules Actions
    addLogicRule: (rule) => get().applyToCurrentSchema(draft => {
      draft.logicRules.push({ id: `rule_${uuidv4()}`, ...rule });
    }),
    updateLogicRule: (id, updates) => get().applyToCurrentSchema(draft => {
      const idx = draft.logicRules.findIndex(r => r.id === id);
      if (idx !== -1) {
        Object.assign(draft.logicRules[idx], updates);
      }
    }),
    deleteLogicRule: (id) => get().applyToCurrentSchema(draft => {
      draft.logicRules = draft.logicRules.filter(r => r.id !== id);
    }),
  }),
  {
    name: 'zealflow-form-storage',
  }
));
