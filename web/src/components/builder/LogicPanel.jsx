import { useMemo } from 'react';
import { ArrowRight, Plus, Trash2, X } from 'lucide-react';
import { useFormStore } from '../../store/formStore';
import { useUIStore } from '../../store/uiStore';

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
];

function getFieldOptions(field) {
  if (!field) return [];
  if (Array.isArray(field?.meta?.options)) return field.meta.options.filter(Boolean);
  if (field.type === 'binary') {
    return [field?.meta?.leftLabel || 'Yes', field?.meta?.rightLabel || 'No'];
  }
  return [];
}

export default function LogicPanel() {
  const schema = useFormStore((state) => state.schema);
  const addLogicRule = useFormStore((state) => state.addLogicRule);
  const updateLogicRule = useFormStore((state) => state.updateLogicRule);
  const deleteLogicRule = useFormStore((state) => state.deleteLogicRule);
  const setTab = useUIStore((state) => state.setTab);

  const pages = schema?.settings?.pages?.length
    ? schema.settings.pages
    : [{ id: 'page_1', title: 'Page 1' }];

  const fields = schema?.fields || [];

  const branchingRules = useMemo(
    () => (schema?.logicRules || []).filter((rule) => rule?.action?.type === 'jump_to_page'),
    [schema?.logicRules]
  );

  const addBranchRule = () => {
    if (fields.length === 0 || pages.length < 2) return;
    const sourceField = fields[0];
    const sourcePageId = sourceField?.meta?.pageId || pages[0]?.id;
    const fallbackTarget = pages.find((p) => p.id !== sourcePageId)?.id || pages[0]?.id;
    const valueCandidate = getFieldOptions(sourceField)[0] || '';

    addLogicRule({
      conditionOperator: 'AND',
      conditions: [
        {
          fieldId: sourceField.id,
          operator: 'equals',
          value: valueCandidate,
        },
      ],
      action: {
        type: 'jump_to_page',
        sourcePageId,
        targetPageId: fallbackTarget,
      },
    });
  };

  const updateRuleCondition = (rule, patch) => {
    const currentCondition = (rule.conditions && rule.conditions[0]) || {
      fieldId: fields[0]?.id || '',
      operator: 'equals',
      value: '',
    };
    updateLogicRule(rule.id, {
      conditions: [{ ...currentCondition, ...patch }],
    });
  };

  const renderRuleCard = (rule) => {
    const condition = (rule.conditions && rule.conditions[0]) || {
      fieldId: fields[0]?.id || '',
      operator: 'equals',
      value: '',
    };

    const selectedField = fields.find((f) => f.id === condition.fieldId) || fields[0] || null;
    const selectedFieldOptions = getFieldOptions(selectedField);
    const sourcePageId = selectedField?.meta?.pageId || pages[0]?.id;

    const allowedTargetPages = pages.filter((p) => p.id !== sourcePageId);
    const targetPageId = rule?.action?.targetPageId || allowedTargetPages[0]?.id || pages[0]?.id;

    return (
      <div key={rule.id} className="border border-[var(--color-border-warm)] rounded-[12px] p-4 bg-[#FFFFFF] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-medium text-[var(--color-text-primary)]">Decision rule</h3>
            <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">Send users to a different page based on their answer.</p>
          </div>
          <button
            onClick={() => deleteLogicRule(rule.id)}
            className="p-2 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
            title="Delete rule"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-[12px] text-[var(--color-text-secondary)] mb-1">When question</label>
            <select
              value={condition.fieldId}
              onChange={(e) => {
                const nextField = fields.find((f) => f.id === e.target.value) || null;
                const nextFieldOptions = getFieldOptions(nextField);
                const nextValue = nextFieldOptions[0] || '';
                const nextSourcePageId = nextField?.meta?.pageId || pages[0]?.id;
                const nextTarget = pages.find((p) => p.id !== nextSourcePageId)?.id || pages[0]?.id;
                updateLogicRule(rule.id, {
                  conditions: [{ ...condition, fieldId: e.target.value, value: nextValue }],
                  action: {
                    ...rule.action,
                    type: 'jump_to_page',
                    sourcePageId: nextSourcePageId,
                    targetPageId: nextTarget,
                  },
                });
              }}
              className="input-base w-full"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>{f.label || 'Untitled question'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] text-[var(--color-text-secondary)] mb-1">Operator</label>
            <select
              value={condition.operator}
              onChange={(e) => updateRuleCondition(rule, { operator: e.target.value })}
              className="input-base w-full"
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] text-[var(--color-text-secondary)] mb-1">Answer value</label>
            {selectedFieldOptions.length > 0 ? (
              <select
                value={condition.value ?? ''}
                onChange={(e) => updateRuleCondition(rule, { value: e.target.value })}
                className="input-base w-full"
              >
                {selectedFieldOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={condition.value ?? ''}
                onChange={(e) => updateRuleCondition(rule, { value: e.target.value })}
                className="input-base w-full"
                placeholder="e.g. veg"
              />
            )}
          </div>

          <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-[12px]">
            <ArrowRight size={14} />
            <span>Then go to page</span>
          </div>

          <div>
            <select
              value={targetPageId}
              onChange={(e) => updateLogicRule(rule.id, {
                action: {
                  ...rule.action,
                  type: 'jump_to_page',
                  sourcePageId,
                  targetPageId: e.target.value,
                },
              })}
              className="input-base w-full"
            >
              {allowedTargetPages.map((p) => (
                <option key={p.id} value={p.id}>{p.title || 'Untitled page'}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside className="absolute right-0 top-0 bottom-0 w-[400px] bg-[var(--color-bg-surface)] border-l border-[var(--color-border-warm)] shadow-2xl z-50 flex flex-col overflow-hidden">
      <div className="absolute -top-14 -right-10 w-36 h-36 rounded-full bg-[var(--color-accent-soft)] blur-3xl pointer-events-none opacity-80" />
      <div className="flex items-center justify-between p-8 border-b border-[var(--color-border-warm)] bg-white/55 backdrop-blur-sm relative z-10">
        <div>
          <h2 className="label-upper text-[var(--color-text-primary)]">Logic Routing</h2>
          <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">Define conditional page branches.</p>
        </div>
        <button onClick={() => setTab('builder')} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2">
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div className="p-8 overflow-y-auto flex-1 space-y-6 custom-scrollbar relative z-10">
        {pages.length < 2 && (
          <div className="text-[13px] text-[var(--color-text-secondary)] border border-[var(--color-border-warm)] rounded-[16px] p-4 bg-white/75">
            Add at least two pages to enable branching.
          </div>
        )}

        {fields.length === 0 && (
          <div className="text-[13px] text-[var(--color-text-secondary)] border border-[var(--color-border-warm)] rounded-[16px] p-4 bg-white/75">
            Add questions first, then create rules based on answers.
          </div>
        )}

        {branchingRules.map(renderRuleCard)}

        <button
          onClick={addBranchRule}
          disabled={fields.length === 0 || pages.length < 2}
          className="w-full py-3 px-4 border border-[var(--color-border-warm)] rounded-[14px] text-[13px] font-medium text-[var(--color-text-primary)] bg-white/80 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={14} />
          Add branching rule
        </button>
      </div>
    </aside>
  );
}
