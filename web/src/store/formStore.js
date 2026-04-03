import { create } from 'zustand';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { fieldRegistry } from '../registry/fieldRegistry';
import { api } from '../utils/apiClient';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createEmptySchema = (overrides = {}) => ({
  id: `form_${uuidv4().slice(0, 8)}`,
  title: 'Untitled form',
  version: 1,
  settings: {
    mode: 'typeform',
    showProgressBar: true,
    submitLabel: 'Submit',
    thankYouMessage: 'Thank you!',
  },
  theme: {
    preset: 'minimal',
    primaryColor: '#4F46E5',
    fontFamily: 'Inter',
    customCSS: '',
  },
  fields: [],
  logicRules: [],
  ...overrides,
});

const maxHistory = 100;

// Module-level debounce timer for auto-saving schema changes to the API
let _autoSaveTimer = null;

function scheduleAutoSave(formId, schema) {
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(async () => {
    try {
      await api.put(`/api/forms/${formId}`, { schema });
    } catch (err) {
      console.error('[Zealflow] Auto-save failed:', err.message);
    }
  }, 800);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useFormStore = create((set, get) => ({
  forms: [],
  currentFormId: null,
  schema: createEmptySchema(),
  history: [],
  historyPointer: 0,
  isInitialized: false,

  // ---- API-backed initialisation ----

  initForms: async () => {
    try {
      const forms = await api.get('/api/forms');
      if (forms.length === 0) {
        set({ forms: [], currentFormId: null, isInitialized: true });
        return;
      }
      const schema = forms[0];
      set({
        forms,
        currentFormId: schema.id,
        schema: schema.schema || schema,
        history: [structuredClone(schema.schema || schema)],
        historyPointer: 0,
        isInitialized: true,
      });
    } catch (err) {
      console.error('[Zealflow] initForms failed:', err.message);
      set({ isInitialized: true });
    }
  },

  // ---- Form management ----

  createForm: () => {
    const newForm = createEmptySchema();
    // Update local state immediately for instant navigation
    set((state) => ({
      forms: [{ ...newForm, field_count: 0 }, ...state.forms],
      currentFormId: newForm.id,
      schema: newForm,
      history: [structuredClone(newForm)],
      historyPointer: 0,
    }));
    // Persist to API in background
    api.post('/api/forms', { id: newForm.id, title: newForm.title, schema: newForm })
      .catch((err) => console.error('[Zealflow] createForm API failed:', err.message));
    return newForm.id;
  },

  selectForm: (id) => {
    const target = get().forms.find((f) => f.id === id);
    if (!target) return false;
    const schema = target.schema || target;
    set({
      currentFormId: target.id,
      schema,
      history: [structuredClone(schema)],
      historyPointer: 0,
    });
    return true;
  },

  deleteForm: (id) => {
    set((state) => {
      if (state.forms.length <= 1) return state;
      const nextForms = state.forms.filter((f) => f.id !== id);
      if (nextForms.length === state.forms.length) return state;
      const nextCurrentId =
        state.currentFormId === id ? nextForms[0].id : state.currentFormId;
      const nextTarget = nextForms.find((f) => f.id === nextCurrentId) || nextForms[0];
      const nextSchema = nextTarget.schema || nextTarget;
      return {
        forms: nextForms,
        currentFormId: nextCurrentId,
        schema: nextSchema,
        history: [structuredClone(nextSchema)],
        historyPointer: 0,
      };
    });
    api.delete(`/api/forms/${id}`)
      .catch((err) => console.error('[Zealflow] deleteForm API failed:', err.message));
  },

  // ---- Schema mutations (local-first, debounced API sync) ----

  applyToCurrentSchema: (fn) => {
    let nextSchemaForSave = null;
    let formIdForSave = null;

    set((state) => {
      const nextSchema = produce(state.schema, fn);
      if (nextSchema === state.schema) return state;

      nextSchemaForSave = nextSchema;
      formIdForSave = state.currentFormId;

      const nextForms = state.forms.map((f) =>
        f.id === state.currentFormId ? { ...f, schema: nextSchema, title: nextSchema.title } : f
      );

      const trimmedHistory = state.history.slice(0, state.historyPointer + 1);
      trimmedHistory.push(structuredClone(nextSchema));
      if (trimmedHistory.length > maxHistory) trimmedHistory.shift();

      return {
        forms: nextForms,
        schema: nextSchema,
        history: trimmedHistory,
        historyPointer: Math.min(trimmedHistory.length - 1, maxHistory - 1),
      };
    });

    if (nextSchemaForSave && formIdForSave) {
      scheduleAutoSave(formIdForSave, nextSchemaForSave);
    }
  },

  // ---- History ----

  undo: () => {
    set((state) => {
      if (state.historyPointer <= 0) return state;
      const nextPointer = state.historyPointer - 1;
      const nextSchema = state.history[nextPointer];
      return {
        historyPointer: nextPointer,
        schema: nextSchema,
        forms: state.forms.map((f) =>
          f.id === state.currentFormId ? { ...f, schema: nextSchema } : f
        ),
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyPointer >= state.history.length - 1) return state;
      const nextPointer = state.historyPointer + 1;
      const nextSchema = state.history[nextPointer];
      return {
        historyPointer: nextPointer,
        schema: nextSchema,
        forms: state.forms.map((f) =>
          f.id === state.currentFormId ? { ...f, schema: nextSchema } : f
        ),
      };
    });
  },

  // ---- Schema property shortcuts ----

  updateTitle: (title) => get().applyToCurrentSchema((d) => { d.title = title; }),
  updateSettings: (settings) => get().applyToCurrentSchema((d) => { Object.assign(d.settings, settings); }),
  updateTheme: (theme) => get().applyToCurrentSchema((d) => { Object.assign(d.theme, theme); }),

  // ---- Field actions ----

  addField: (type) =>
    get().applyToCurrentSchema((draft) => {
      const fieldId = `field_${uuidv4()}`;
      const defaultFieldSchema = fieldRegistry[type]?.defaultSchema || {};
      draft.fields.push({
        id: fieldId,
        type,
        label: 'New Question',
        placeholder: defaultFieldSchema.placeholder || 'Type your answer…',
        required: false,
        validation: {},
        meta: { hidden: false, width: 'full', ...defaultFieldSchema },
      });
    }),

  updateField: (id, updates) =>
    get().applyToCurrentSchema((draft) => {
      const idx = draft.fields.findIndex((f) => f.id === id);
      if (idx !== -1) Object.assign(draft.fields[idx], updates);
    }),

  deleteField: (id) =>
    get().applyToCurrentSchema((draft) => {
      draft.fields = draft.fields.filter((f) => f.id !== id);
      draft.logicRules = draft.logicRules
        .map((rule) => {
          rule.conditions = rule.conditions.filter((c) => c.fieldId !== id);
          return rule;
        })
        .filter((rule) => rule.conditions.length > 0 && rule.action.targetFieldId !== id);
    }),

  reorderFields: (activeId, overId) =>
    get().applyToCurrentSchema((draft) => {
      const oldIndex = draft.fields.findIndex((f) => f.id === activeId);
      const newIndex = draft.fields.findIndex((f) => f.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const [moved] = draft.fields.splice(oldIndex, 1);
        draft.fields.splice(newIndex, 0, moved);
      }
    }),

  // ---- Logic rules ----

  addLogicRule: (rule) =>
    get().applyToCurrentSchema((draft) => {
      draft.logicRules.push({ id: `rule_${uuidv4()}`, ...rule });
    }),

  updateLogicRule: (id, updates) =>
    get().applyToCurrentSchema((draft) => {
      const idx = draft.logicRules.findIndex((r) => r.id === id);
      if (idx !== -1) Object.assign(draft.logicRules[idx], updates);
    }),

  deleteLogicRule: (id) =>
    get().applyToCurrentSchema((draft) => {
      draft.logicRules = draft.logicRules.filter((r) => r.id !== id);
    }),
}));
