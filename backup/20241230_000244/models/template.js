import { loadTemplates, saveTemplate, getTemplate as getStoredTemplate, deleteTemplate as removeTemplate } from '../utils/templateCache.js';

/**
 * Message template model with variable substitution and validation
 */
class Template {
  constructor(id, text, attachments = [], isPrivate = false, author = null) {
    this.id = id;
    this.text = text;
    this.attachments = attachments;
    this.isPrivate = isPrivate;
    this.author = author;
    this.variables = this.extractVariables(text);
  }

  /**
   * Extract variable names from template text
   */
  extractVariables(text) {
    const matches = text.match(/{{([^}]+)}}/g) || [];
    return matches.map(match => match.slice(2, -2).trim());
  }

  /**
   * Validate required variables are provided
   */
  validateVariables(variables) {
    const missingVars = this.variables.filter(v => !(v in variables));
    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Apply variables to template text
   */
  applyVariables(variables) {
    this.validateVariables(variables);
    let result = this.text;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  /**
   * Create message data with variables and overrides
   */
  createMessage(phoneNumber, variables, overrides = {}) {
    return {
      phoneNumber,
      message: this.applyVariables(variables),
      attachments: overrides.attachments || this.attachments,
      isPrivate: 'isPrivate' in overrides ? overrides.isPrivate : this.isPrivate,
      author: overrides.author || this.author
    };
  }

  /**
   * Preview template with sample variables
   */
  preview(sampleVariables = {}) {
    try {
      const text = this.applyVariables(sampleVariables);
      return {
        text,
        attachments: this.attachments,
        isPrivate: this.isPrivate,
        author: this.author,
        variables: this.variables
      };
    } catch (error) {
      return {
        error: error.message,
        variables: this.variables
      };
    }
  }

  /**
   * Convert template to JSON
   */
  toJSON() {
    return {
      id: this.id,
      text: this.text,
      attachments: this.attachments,
      isPrivate: this.isPrivate,
      author: this.author,
      variables: this.variables
    };
  }
}

/**
 * Create a new template
 */
async function createTemplate(text, attachments, isPrivate, author) {
  const id = `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const template = new Template(id, text, attachments, isPrivate, author);
  await saveTemplate(id, template.toJSON());
  return template;
}

/**
 * Get template by ID
 */
async function getTemplate(id) {
  const templateData = await getStoredTemplate(id);
  if (!templateData) {
    return null;
  }
  
  return new Template(
    templateData.id,
    templateData.text,
    templateData.attachments,
    templateData.isPrivate,
    templateData.author
  );
}

/**
 * List all templates
 */
async function listTemplates() {
  const templates = await loadTemplates();
  return Object.values(templates);
}

/**
 * Delete template
 */
async function deleteTemplate(id) {
  return await removeTemplate(id);
}

export { Template, createTemplate, getTemplate, listTemplates, deleteTemplate };
