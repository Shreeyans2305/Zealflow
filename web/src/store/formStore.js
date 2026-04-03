import { create } from 'zustand';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { arrayMove } from '@dnd-kit/sortable';
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
    allowAnonymousEntries: true,
    deadlineAt: null,
    timedResponseEnabled: false,
    timedResponseSeconds: 0,
    pages: [{ id: 'page_1', title: 'Page 1' }],
    mailingListEmails: [],
    publishEmailMessage: 'We just published a new form. Please take a look and submit a response.',
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

const ensureSchemaDefaults = (schema) => {
  const next = structuredClone(schema || {});
  next.settings = next.settings || {};
  next.theme = next.theme || {};
  next.fields = next.fields || [];
  next.logicRules = next.logicRules || [];

  if (typeof next.settings.allowAnonymousEntries !== 'boolean') {
    next.settings.allowAnonymousEntries = true;
  }

  if (!Object.prototype.hasOwnProperty.call(next.settings, 'deadlineAt')) {
    next.settings.deadlineAt = null;
  }

  if (typeof next.settings.timedResponseEnabled !== 'boolean') {
    next.settings.timedResponseEnabled = false;
  }

  if (typeof next.settings.timedResponseSeconds !== 'number' || Number.isNaN(next.settings.timedResponseSeconds)) {
    next.settings.timedResponseSeconds = 0;
  }

  if (next.settings.timedResponseEnabled && next.settings.timedResponseSeconds <= 0) {
    next.settings.timedResponseSeconds = 60;
  }

  if (!Array.isArray(next.settings.pages) || next.settings.pages.length === 0) {
    next.settings.pages = [{ id: 'page_1', title: 'Page 1' }];
  }

  if (!Array.isArray(next.settings.mailingListEmails)) {
    next.settings.mailingListEmails = typeof next.settings.mailingListEmails === 'string'
      ? next.settings.mailingListEmails.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean)
      : [];
  }

  if (typeof next.settings.publishEmailMessage !== 'string') {
    next.settings.publishEmailMessage = 'We just published a new form. Please take a look and submit a response.';
  }

  const firstPageId = next.settings.pages[0].id;
  next.fields = next.fields.map((f) => ({
    ...f,
    meta: {
      ...(f.meta || {}),
      pageId: f.meta?.pageId || firstPageId,
    },
  }));

  return next;
};

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
      const schema = ensureSchemaDefaults(forms[0].schema || forms[0]);
      set({
        forms,
        currentFormId: forms[0].id,
        schema,
        history: [structuredClone(schema)],
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
    const schema = ensureSchemaDefaults(target.schema || target);
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

  addField: (type, pageId = null) =>
    get().addFieldAtIndex(type, pageId, null),

  addFieldAtIndex: (type, pageId = null, insertIndex = null) =>
    get().applyToCurrentSchema((draft) => {
      const fieldId = `field_${uuidv4()}`;
      const defaultFieldSchema = fieldRegistry[type]?.defaultSchema || {};
      const currentPageId = pageId || draft.settings?.pages?.[0]?.id || 'page_1';
      const newField = {
        id: fieldId,
        type,
        label: 'New Question',
        placeholder: defaultFieldSchema.placeholder || 'Type your answer…',
        required: false,
        validation: {},
        meta: { hidden: false, width: 'full', pageId: currentPageId, ...defaultFieldSchema },
      };

      const pageFieldGlobalIndexes = draft.fields
        .map((field, idx) => ({ field, idx }))
        .filter(({ field }) => (field.meta?.pageId || draft.settings?.pages?.[0]?.id) === currentPageId)
        .map(({ idx }) => idx);

      if (insertIndex === null || insertIndex === undefined || pageFieldGlobalIndexes.length === 0) {
        draft.fields.push(newField);
        return;
      }

      const clampedIndex = Math.max(0, Math.min(insertIndex, pageFieldGlobalIndexes.length));
      const globalInsertIndex =
        clampedIndex >= pageFieldGlobalIndexes.length
          ? pageFieldGlobalIndexes[pageFieldGlobalIndexes.length - 1] + 1
          : pageFieldGlobalIndexes[clampedIndex];

      draft.fields.splice(globalInsertIndex, 0, newField);
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

  reorderFields: (activeId, overId, pageId = null) =>
    get().applyToCurrentSchema((draft) => {
      if (pageId) {
        const pageFields = draft.fields.filter((f) => (f.meta?.pageId || draft.settings.pages?.[0]?.id) === pageId);
        const oldIndex = pageFields.findIndex((f) => f.id === activeId);
        const newIndex = pageFields.findIndex((f) => f.id === overId);
        if (oldIndex === -1 || newIndex === -1) return;

        const reorderedPageIds = arrayMove(pageFields.map((f) => f.id), oldIndex, newIndex);
        const rankMap = new Map(reorderedPageIds.map((fid, idx) => [fid, idx]));

        const pageBucket = draft.fields
          .filter((f) => (f.meta?.pageId || draft.settings.pages?.[0]?.id) === pageId)
          .sort((a, b) => (rankMap.get(a.id) ?? 0) - (rankMap.get(b.id) ?? 0));

        let cursor = 0;
        draft.fields = draft.fields.map((f) => {
          if ((f.meta?.pageId || draft.settings.pages?.[0]?.id) !== pageId) return f;
          const nextField = pageBucket[cursor];
          cursor += 1;
          return nextField;
        });
      } else {
        const oldIndex = draft.fields.findIndex((f) => f.id === activeId);
        const newIndex = draft.fields.findIndex((f) => f.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const [moved] = draft.fields.splice(oldIndex, 1);
          draft.fields.splice(newIndex, 0, moved);
        }
      }
    }),

  addPage: (title = 'New Page') =>
    get().applyToCurrentSchema((draft) => {
      draft.settings.pages = draft.settings.pages || [{ id: 'page_1', title: 'Page 1' }];
      const nextNum = draft.settings.pages.length + 1;
      draft.settings.pages.push({ id: `page_${nextNum}_${uuidv4().slice(0, 4)}`, title: title || `Page ${nextNum}` });
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
