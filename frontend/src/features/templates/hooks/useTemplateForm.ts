import { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { createTemplate, updateTemplate } from '@/store/thunks/templateThunks';
import { Template, TemplateMutation, TEMPLATE_VALIDATION_RULES, TEMPLATE_VARIABLE_REGEX } from '../types';

interface UseTemplateFormProps {
  template?: Template;
  onSuccess?: () => void;
}

interface FormErrors {
  name?: string;
  content?: string;
  description?: string;
  submit?: string;
}

export const useTemplateForm = ({ template, onSuccess }: UseTemplateFormProps = {}) => {
  const dispatch = useAppDispatch();
  
  // Form state
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // Initialize form when editing existing template
  useEffect(() => {
    if (template) {
      setName(template.name);
      setContent(template.content);
      setDescription(template.description || '');
      setVariables(template.variables);
    } else {
      setName('');
      setContent('');
      setDescription('');
      setVariables([]);
    }
    setErrors({});
  }, [template]);

  // Detect variables in content
  useEffect(() => {
    const matches = content.match(TEMPLATE_VARIABLE_REGEX) || [];
    const newVariables = [...new Set(matches.map(match => match.slice(2, -2).trim()))];
    setVariables(newVariables);
  }, [content]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!name) {
      newErrors.name = 'Name is required';
    } else if (name.length > TEMPLATE_VALIDATION_RULES.name.maxLength) {
      newErrors.name = `Name must be less than ${TEMPLATE_VALIDATION_RULES.name.maxLength} characters`;
    }

    // Content validation
    if (!content) {
      newErrors.content = 'Content is required';
    } else if (content.length > TEMPLATE_VALIDATION_RULES.content.maxLength) {
      newErrors.content = `Content must be less than ${TEMPLATE_VALIDATION_RULES.content.maxLength} characters`;
    }

    // Description validation
    if (description && description.length > TEMPLATE_VALIDATION_RULES.description.maxLength) {
      newErrors.description = `Description must be less than ${TEMPLATE_VALIDATION_RULES.description.maxLength} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const templateData: TemplateMutation = {
      name,
      content,
      description: description || undefined,
      variables,
    };

    try {
      setSaving(true);
      if (template) {
        await dispatch(updateTemplate({ id: template.id, template: templateData })).unwrap();
      } else {
        await dispatch(createTemplate(templateData)).unwrap();
      }
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to save template. Please try again.',
      }));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return {
    // Form state
    name,
    content,
    description,
    variables,
    errors,
    saving,

    // Form actions
    setName,
    setContent,
    setDescription,
    clearError,
    handleSubmit,

    // Form helpers
    isEditing: !!template,
    isDirty:
      name !== (template?.name || '') ||
      content !== (template?.content || '') ||
      description !== (template?.description || ''),
  };
};

export default useTemplateForm;