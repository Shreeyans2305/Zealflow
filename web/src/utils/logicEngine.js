/**
 * Evaluates visibility of fields based on logic rules and current answers.
 * Returns a visibility map: { [fieldId]: boolean }
 */
export function evaluateFieldVisibility(schema, answers) {
  // Initialize all fields to their default visibility
  const visibilityMap = {};
  
  schema.fields.forEach(field => {
    visibilityMap[field.id] = !field.meta?.hidden;
  });

  // Evaluate rules
  schema.logicRules.forEach(rule => {
    const { conditions, conditionOperator, action } = rule;
    
    // Evaluate conditions
    const conditionResults = conditions.map(cond => {
      const answer = answers[cond.fieldId];
      if (answer === undefined || answer === null) return false;
      
      switch (cond.operator) {
        case 'equals': return answer === cond.value;
        case 'not_equals': return answer !== cond.value;
        case 'contains': return String(answer).includes(cond.value);
        case 'greater_than': return Number(answer) > Number(cond.value);
        case 'less_than': return Number(answer) < Number(cond.value);
        default: return false;
      }
    });

    const isMatch = conditionOperator === 'AND' 
      ? conditionResults.every(Boolean)
      : conditionResults.some(Boolean);

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
