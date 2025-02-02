/**
 * Extract variables used in a template string
 * @param template Template string with variables in {{variable}} format
 * @returns Array of variable names used in the template
 */
export const extractTemplateVariables = (template: string): string[] => {
  const variableRegex = /{{([^{}]+)}}/g;
  const matches = template.match(variableRegex) || [];
  return [...new Set(matches.map(match => match.slice(2, -2).trim()))];
};

/**
 * Extract only the required variables from customer data based on template needs
 * @param customer Customer object with all fields
 * @param usedVariables Array of variable names used in template
 * @returns Object containing only the required customer variables
 */
export const extractRequiredVariables = (
  customer: Record<string, any>,
  usedVariables: string[]
): Record<string, any> => {
  const variables: Record<string, any> = {};
  
  usedVariables.forEach(variable => {
    if (variable in customer) {
      variables[variable] = customer[variable];
    }
  });

  return variables;
};
