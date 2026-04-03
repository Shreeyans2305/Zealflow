/**
 * Evaluates visibility of fields based on logic rules and current answers.
 * Returns a visibility map: { [fieldId]: boolean }
 */
function normalizeValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map((v) => String(v));
  return String(value);
}

export function evaluateRuleConditions(rule, answers) {
  const conditions = Array.isArray(rule?.conditions) ? rule.conditions : [];
  if (conditions.length === 0) return false;

  const conditionResults = conditions.map((cond) => {
    const answer = answers?.[cond.fieldId];
    if (answer === undefined || answer === null) return false;

    const expected = cond?.value ?? '';
    const normalizedAnswer = normalizeValue(answer);

    switch (cond.operator) {
      case 'equals':
        if (Array.isArray(normalizedAnswer)) return normalizedAnswer.includes(String(expected));
        return normalizedAnswer === String(expected);
      case 'not_equals':
        if (Array.isArray(normalizedAnswer)) return !normalizedAnswer.includes(String(expected));
        return normalizedAnswer !== String(expected);
      case 'contains':
        if (Array.isArray(normalizedAnswer)) return normalizedAnswer.includes(String(expected));
        return normalizedAnswer.toLowerCase().includes(String(expected).toLowerCase());
      case 'greater_than':
        return Number(answer) > Number(expected);
      case 'less_than':
        return Number(answer) < Number(expected);
      default:
        return false;
    }
  });

  return rule?.conditionOperator === 'OR'
    ? conditionResults.some(Boolean)
    : conditionResults.every(Boolean);
}

export function evaluateFieldVisibility(schema, answers) {
  // Initialize all fields to their default visibility
  const visibilityMap = {};
  
  schema.fields.forEach(field => {
    visibilityMap[field.id] = !field.meta?.hidden;
  });

  // Evaluate rules
  schema.logicRules.forEach(rule => {
    const { action } = rule;
    const isMatch = evaluateRuleConditions(rule, answers);

    if (isMatch) {
      if (action.type === 'show') {
        visibilityMap[action.targetFieldId] = true;
      } else if (action.type === 'hide') {
        visibilityMap[action.targetFieldId] = false;
      }
    }
  });

  return visibilityMap;
}

export function resolveNextPageId(schema, answers, currentPageId) {
  const rules = Array.isArray(schema?.logicRules) ? schema.logicRules : [];
  for (const rule of rules) {
    if (rule?.action?.type !== 'jump_to_page') continue;
    const targetPageId = rule?.action?.targetPageId;
    if (!targetPageId || targetPageId === currentPageId) continue;
    if (evaluateRuleConditions(rule, answers)) {
      return targetPageId;
    }
  }
  return null;
}
